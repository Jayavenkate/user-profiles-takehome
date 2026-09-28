import json
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

IMPORT_URL = '/api/profiles/import/'
SAMPLE_FILE = Path(settings.BASE_DIR).parent / 'data' / 'user_profiles.json'


def json_file(content, name='profiles.json'):
    raw = content if isinstance(content, bytes) else json.dumps(content).encode()
    return SimpleUploadedFile(name, raw, content_type='application/json')


class ImportSampleFileTests(APITestCase):
    def import_sample(self):
        return self.client.post(IMPORT_URL, {'file': json_file(SAMPLE_FILE.read_bytes())}, format='multipart')

    def test_sample_file_imports_valid_records_and_reports_bad_ones(self):
        response = self.import_sample()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 100)
        self.assertEqual(response.data['imported_count'], 96)
        self.assertEqual(response.data['failed_count'], 4)
        self.assertEqual(User.objects.count(), 96)

        failed = {item['row']: item for item in response.data['failed']}
        self.assertEqual(sorted(failed), [24, 52, 78, 89])
        self.assertIn('email', failed[24]['errors'])          # "not-an-email"
        self.assertIn('username', failed[52]['errors'])       # duplicate grace.rossi
        self.assertIn('date_of_birth', failed[78]['errors'])  # 1995-13-40
        self.assertIn('username', failed[89]['errors'])       # missing username

    def test_importing_twice_skips_existing_users(self):
        self.import_sample()
        response = self.import_sample()
        self.assertEqual(response.data['imported_count'], 0)
        self.assertEqual(response.data['skipped_count'], 96)
        self.assertEqual(response.data['failed_count'], 4)
        self.assertEqual(User.objects.count(), 96)


class ImportValidationTests(APITestCase):
    def post(self, upload):
        return self.client.post(IMPORT_URL, {'file': upload} if upload else {}, format='multipart')

    def test_missing_file(self):
        response = self.post(None)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)

    def test_invalid_json(self):
        self.assertEqual(self.post(json_file(b'{broken')).status_code, status.HTTP_400_BAD_REQUEST)

    def test_json_must_be_a_list(self):
        self.assertEqual(self.post(json_file({'username': 'x'})).status_code, status.HTTP_400_BAD_REQUEST)

    def test_malformed_records_fail_without_crashing(self):
        response = self.post(json_file([42, {'username': 'no.profile'}, {'username': 'bad', 'profile': 'text'}]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['failed_count'], 3)
        self.assertFalse(User.objects.exists())
