import os

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from profiles.models import UserProfile

from .helpers import TempMediaMixin, create_profile, make_image, profile_payload


def multipart_payload(**overrides):
    data = profile_payload(**overrides)
    data['is_active'] = 'true'
    return data


class ProfileImageTests(TempMediaMixin, APITestCase):
    def upload(self, profile, image):
        return self.client.patch(f'/api/profiles/{profile.id}/', {'profile_image': image}, format='multipart')

    def test_create_with_image_returns_usable_url(self):
        response = self.client.post('/api/profiles/', multipart_payload(profile_image=make_image()), format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['profile_image'].startswith('http://testserver/media/profile_images/'))
        self.assertTrue(os.path.exists(UserProfile.objects.get().profile_image.path))

    def test_accepts_jpg_and_webp(self):
        profile = create_profile()
        self.assertEqual(self.upload(profile, make_image('a.jpg', 'JPEG', 'image/jpeg')).status_code, 200)
        self.assertEqual(self.upload(profile, make_image('a.webp', 'WEBP', 'image/webp')).status_code, 200)

    def test_rejects_other_image_types(self):
        response = self.upload(create_profile(), make_image('anim.gif', 'GIF', 'image/gif'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only JPG, JPEG, PNG and WEBP', str(response.data['profile_image']))

    def test_rejects_non_image_with_image_extension(self):
        fake = SimpleUploadedFile('fake.png', b'not really an image', content_type='image/png')
        response = self.upload(create_profile(), fake)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('profile_image', response.data)

    def test_replacing_image_deletes_old_file(self):
        profile = create_profile()
        self.upload(profile, make_image('first.png'))
        profile.refresh_from_db()
        old_path = profile.profile_image.path

        self.upload(profile, make_image('second.png'))
        profile.refresh_from_db()
        self.assertFalse(os.path.exists(old_path))
        self.assertTrue(os.path.exists(profile.profile_image.path))

    def test_clearing_image_with_null_or_empty_value(self):
        profile = create_profile()
        for clear in [
            lambda: self.client.patch(f'/api/profiles/{profile.id}/', {'profile_image': None}, format='json'),
            lambda: self.client.patch(f'/api/profiles/{profile.id}/', {'profile_image': ''}, format='multipart'),
        ]:
            self.upload(profile, make_image())
            profile.refresh_from_db()
            path = profile.profile_image.path

            response = clear()
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIsNone(response.data['profile_image'])
            self.assertFalse(os.path.exists(path))

    def test_update_without_image_keeps_existing_image(self):
        profile = create_profile()
        self.upload(profile, make_image())
        response = self.client.patch(f'/api/profiles/{profile.id}/', {'city': 'Doha'}, format='multipart')
        self.assertIsNotNone(response.data['profile_image'])

    def test_deleting_profile_deletes_image_file(self):
        profile = create_profile()
        self.upload(profile, make_image())
        profile.refresh_from_db()
        path = profile.profile_image.path

        self.client.delete(f'/api/profiles/{profile.id}/')
        self.assertFalse(os.path.exists(path))
