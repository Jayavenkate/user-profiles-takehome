"""Keep MEDIA_ROOT in sync with the database: no orphaned profile images."""

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_delete, sender=UserProfile)
def delete_image_on_profile_delete(sender, instance, **kwargs):
    # Also runs when the profile is removed through User cascade delete.
    if instance.profile_image:
        instance.profile_image.delete(save=False)


@receiver(pre_save, sender=UserProfile)
def delete_old_image_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    old_image = (
        UserProfile.objects.filter(pk=instance.pk)
        .values_list('profile_image', flat=True)
        .first()
    )
    if old_image and old_image != instance.profile_image.name:
        instance.profile_image.storage.delete(old_image)
