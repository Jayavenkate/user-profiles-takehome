import io
import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image

from profiles.models import UserProfile


def make_image(name='photo.png', image_format='PNG', content_type='image/png'):
    buffer = io.BytesIO()
    Image.new('RGB', (10, 10), 'red').save(buffer, image_format)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


def profile_payload(**overrides):
    data = {
        'username': 'ali.khan',
        'email': 'ali.khan@example.com',
        'first_name': 'Ali',
        'last_name': 'Khan',
        'phone': '+965 12345678',
        'gender': 'male',
        'date_of_birth': '1990-05-01',
        'job_title': 'Backend Developer',
        'department': 'Engineering',
        'city': 'Kuwait City',
        'country': 'Kuwait',
        'bio': 'Likes clean code.',
        'hire_date': '2020-01-15',
        'is_active': True,
    }
    data.update(overrides)
    return data


def create_profile(username='sara.ahmed', email=None, first_name='Sara', last_name='Ahmed', **fields):
    user = User.objects.create(
        username=username,
        email=email or f'{username}@example.com',
        first_name=first_name,
        last_name=last_name,
    )
    defaults = {
        'gender': 'female',
        'date_of_birth': '1992-03-04',
        'job_title': 'Designer',
        'department': 'Design',
        'city': 'Dubai',
        'country': 'United Arab Emirates',
        'hire_date': '2021-06-01',
    }
    defaults.update(fields)
    return UserProfile.objects.create(user=user, **defaults)


class TempMediaMixin:
    """Save uploaded files to a throwaway folder instead of the real MEDIA_ROOT."""

    @classmethod
    def setUpClass(cls):
        cls._media_root = tempfile.mkdtemp()
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_root)
        cls._media_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._media_override.disable()
        shutil.rmtree(cls._media_root, ignore_errors=True)
