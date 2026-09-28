import json

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .importer import import_profiles
from .models import UserProfile
from .serializers import UserProfileSerializer

MAX_IMPORT_FILE_SIZE_MB = 2
MAX_IMPORT_RECORDS = 1000


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    list:     GET    /api/profiles/?page=&page_size=&search=
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

    def perform_destroy(self, instance):
        # The profile only exists for its User, so remove both. The profile
        # (and its image file) goes with it through CASCADE.
        instance.user.delete()

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
