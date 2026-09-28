import uuid
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
MAX_IMAGE_SIZE_MB = 5


def profile_image_upload_to(instance, filename):
    """Store images under a random name so uploads never overwrite each other."""
    extension = Path(filename).suffix.lower()
    return f'profile_images/{uuid.uuid4().hex}{extension}'


def validate_image_size(file):
    if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(f'Image must be {MAX_IMAGE_SIZE_MB} MB or smaller.')


# Shared by the model field and the API serializer.
PROFILE_IMAGE_VALIDATORS = [
    FileExtensionValidator(
        allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
        message='Only JPG, JPEG, PNG and WEBP images are allowed.',
    ),
    validate_image_size,
]


class UserProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    phone = models.CharField(max_length=30, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices)
    date_of_birth = models.DateField()
    job_title = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(
        upload_to=profile_image_upload_to,
        blank=True,
        validators=PROFILE_IMAGE_VALIDATORS,
    )
    hire_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'{self.user.username} profile'
