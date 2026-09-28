from rest_framework.routers import DefaultRouter

from .views import UserProfileViewSet

router = DefaultRouter()
router.register('profiles', UserProfileViewSet, basename='profile')

urlpatterns = router.urls
