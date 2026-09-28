from rest_framework import filters, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import UserProfile
from .serializers import UserProfileSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    list:     GET    /api/profiles/?page=&page_size=&search=
    create:   POST   /api/profiles/          (JSON or multipart)
    retrieve: GET    /api/profiles/{id}/
    update:   PUT    /api/profiles/{id}/     (JSON or multipart)
    partial:  PATCH  /api/profiles/{id}/
    destroy:  DELETE /api/profiles/{id}/     (also deletes the User)
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
