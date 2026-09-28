import json

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view, inline_serializer
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .filters import ORDERING_FIELDS, filter_profiles, order_profiles
from .importer import import_profiles
from .models import UserProfile
from .serializers import UserProfileSerializer

MAX_IMPORT_FILE_SIZE_MB = 2
MAX_IMPORT_RECORDS = 1000

# filters.py reads these by hand, so describe them for the OpenAPI schema here.
LIST_PARAMETERS = [
    OpenApiParameter('department', str, description='Exact match, ignoring case.'),
    OpenApiParameter('is_active', bool),
    OpenApiParameter('created_after', OpenApiTypes.DATETIME, description='Inclusive. ISO datetime or YYYY-MM-DD.'),
    OpenApiParameter('created_before', OpenApiTypes.DATETIME, description='Exclusive. ISO datetime or YYYY-MM-DD.'),
    OpenApiParameter('updated_after', OpenApiTypes.DATETIME, description='Inclusive. ISO datetime or YYYY-MM-DD.'),
    OpenApiParameter('updated_before', OpenApiTypes.DATETIME, description='Exclusive. ISO datetime or YYYY-MM-DD.'),
    OpenApiParameter(
        'ordering',
        str,
        enum=[prefix + field for field in ORDERING_FIELDS for prefix in ('', '-')],
        description='Sort field; prefix "-" for descending. Default: -created_at.',
    ),
]

IMPORT_ROW = {
    'row': serializers.IntegerField(),
    'username': serializers.CharField(allow_null=True),
}

IMPORT_RESULT = inline_serializer('ImportResult', {
    'total': serializers.IntegerField(),
    'imported_count': serializers.IntegerField(),
    'skipped_count': serializers.IntegerField(),
    'failed_count': serializers.IntegerField(),
    'skipped': inline_serializer('ImportSkipped', {**IMPORT_ROW, 'reason': serializers.CharField()}, many=True),
    'failed': inline_serializer('ImportFailed', {**IMPORT_ROW, 'errors': serializers.DictField()}, many=True),
})


# Per-operation text for the docs; without it every operation would repeat the class docstring.
@extend_schema_view(
    list=extend_schema(
        summary='List profiles',
        description='Paginated. Search, filters and ordering can be combined.',
        parameters=LIST_PARAMETERS,
    ),
    create=extend_schema(
        summary='Create a user and profile',
        description='JSON or multipart. Use multipart to include `profile_image`.',
    ),
    retrieve=extend_schema(summary='Get a profile'),
    update=extend_schema(summary='Replace a profile', description='JSON or multipart.'),
    partial_update=extend_schema(
        summary='Update some fields',
        description='JSON or multipart. Send an empty `profile_image` to remove the image.',
    ),
    destroy=extend_schema(summary='Delete a profile', description='Also deletes the Django user.'),
)

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    list:     GET    /api/profiles/?page=&page_size=&search=
                     &department=&is_active=&created_after=&created_before=
                     &updated_after=&updated_before=&ordering=
    departments: GET /api/profiles/departments/  (distinct values, for dropdowns)
    countries:   GET /api/profiles/countries/    (distinct values, for dropdowns)
    create:   POST   /api/profiles/          (JSON or multipart)
    retrieve: GET    /api/profiles/{id}/
    update:   PUT    /api/profiles/{id}/     (JSON or multipart)
    partial:  PATCH  /api/profiles/{id}/
    destroy:  DELETE /api/profiles/{id}/     (also deletes the User)
    import:   POST   /api/profiles/import/   (multipart "file" with a JSON array)
    """

    queryset = UserProfile.objects.select_related('user')
    serializer_class = UserProfileSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter]
    # SearchFilter splits "ahmad smith" into terms and requires every term to
    # match one of these fields, so full-name searches work too.
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = filter_profiles(queryset, self.request.query_params)
            queryset = order_profiles(queryset, self.request.query_params)
        return queryset

    def perform_destroy(self, instance):
        # The profile only exists for its User, so remove both. The profile
        # (and its image file) goes with it through CASCADE.
        instance.user.delete()

    @extend_schema(
        summary='List departments in use',
        description='Distinct, sorted. Used for dropdown suggestions.',
        responses=serializers.ListSerializer(child=serializers.CharField()),
    )
    # Not paginated: the whole list is small and feeds a dropdown.
    @action(detail=False, methods=['get'], pagination_class=None)
    def departments(self, request):
        return Response(self._distinct_values('department'))

    @extend_schema(
        summary='List countries in use',
        description='Distinct, sorted. Used for dropdown suggestions.',
        responses=serializers.ListSerializer(child=serializers.CharField()),
    )
    @action(detail=False, methods=['get'], pagination_class=None)
    def countries(self, request):
        return Response(self._distinct_values('country'))

    @staticmethod
    def _distinct_values(field):
        """Sorted, non-empty values of one profile field, e.g. every department in use."""
        values = (
            UserProfile.objects.exclude(**{field: ''})
            .order_by(field)
            .values_list(field, flat=True)
            .distinct()
        )
        return list(values)

    @extend_schema(
        summary='Import profiles from a JSON file',
        description=(
            f'Multipart `file` containing a JSON array (max {MAX_IMPORT_RECORDS} records, {MAX_IMPORT_FILE_SIZE_MB} MB). '
            'Existing usernames are skipped; invalid records are reported with their errors.'
        ),
        request={'multipart/form-data': inline_serializer('ImportFile', {'file': serializers.FileField()})},
        responses={200: IMPORT_RESULT, 400: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=['post'], url_path='import', parser_classes=[MultiPartParser])
    def import_file(self, request):
        upload = request.FILES.get('file')
        if upload is None:
            return self._import_error('Upload a JSON file in the "file" field.')
        if upload.size > MAX_IMPORT_FILE_SIZE_MB * 1024 * 1024:
            return self._import_error(f'File must be {MAX_IMPORT_FILE_SIZE_MB} MB or smaller.')

        try:
            records = json.loads(upload.read().decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            return self._import_error(f'File is not valid JSON: {exc}')

        if not isinstance(records, list):
            return self._import_error('JSON must be a list of profile records.')
        if len(records) > MAX_IMPORT_RECORDS:
            return self._import_error(f'A file can contain at most {MAX_IMPORT_RECORDS} records.')

        return Response(import_profiles(records), status=status.HTTP_200_OK)

    @staticmethod
    def _import_error(message):
        return Response({'file': [message]}, status=status.HTTP_400_BAD_REQUEST)
