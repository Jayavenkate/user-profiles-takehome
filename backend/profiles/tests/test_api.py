from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from profiles.models import UserProfile

from .helpers import create_profile, profile_payload

LIST_URL = '/api/profiles/'


def detail_url(profile_id):
    return f'/api/profiles/{profile_id}/'


class ListProfilesTests(APITestCase):
    def setUp(self):
        for i in range(12):
            create_profile(username=f'user{i:02d}', first_name=f'First{i}', last_name='Tester')

    def test_list_is_paginated_with_count_and_links(self):
        response = self.client.get(LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 12)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])

    def test_page_and_page_size(self):
        response = self.client.get(LIST_URL, {'page': 2, 'page_size': 5})
        self.assertEqual(len(response.data['results']), 5)
        self.assertIsNotNone(response.data['previous'])
        self.assertIsNotNone(response.data['next'])

    def test_page_size_is_capped(self):
        create_profile(username='extra')
        response = self.client.get(LIST_URL, {'page_size': 1000})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 13)  # cap is 100, all fit

    def test_page_out_of_range_returns_404(self):
        response = self.client.get(LIST_URL, {'page': 99})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_returns_user_and_profile_fields_together(self):
        result = self.client.get(LIST_URL).data['results'][0]
        for field in ['id', 'username', 'email', 'first_name', 'department', 'profile_image', 'is_active']:
            self.assertIn(field, result)
        self.assertIsNone(result['profile_image'])


class SearchProfilesTests(APITestCase):
    def setUp(self):
        create_profile(username='noura.alsabah', first_name='Noura', last_name='Al-Sabah')
        create_profile(username='ahmad.smith', first_name='Ahmad', last_name='Smith', email='a.smith@corp.com')
        create_profile(username='john.doe', first_name='John', last_name='Doe')

    def search(self, term):
        return [row['username'] for row in self.client.get(LIST_URL, {'search': term}).data['results']]

    def test_search_by_username_email_and_names(self):
        self.assertEqual(self.search('noura.al'), ['noura.alsabah'])
        self.assertEqual(self.search('corp.com'), ['ahmad.smith'])
        self.assertEqual(self.search('SMITH'), ['ahmad.smith'])
        self.assertEqual(self.search('ahmad smith'), ['ahmad.smith'])

    def test_search_with_no_match_returns_empty_page(self):
        response = self.client.get(LIST_URL, {'search': 'nobody'})
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_search_covers_all_pages(self):
        for i in range(15):
            create_profile(username=f'filler{i}')
        self.assertEqual(self.search('noura'), ['noura.alsabah'])


class RetrieveProfileTests(APITestCase):
    def test_retrieve_existing_profile(self):
        profile = create_profile()
        response = self.client.get(detail_url(profile.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'sara.ahmed')
        self.assertEqual(response.data['department'], 'Design')

    def test_retrieve_missing_profile_returns_404(self):
        self.assertEqual(self.client.get(detail_url(999)).status_code, status.HTTP_404_NOT_FOUND)


class CreateProfileTests(APITestCase):
    def test_create_makes_user_and_profile(self):
        response = self.client.post(LIST_URL, profile_payload(email='Ali.Khan@Example.com'), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username='ali.khan')
        self.assertEqual(user.email, 'ali.khan@example.com')  # stored lowercase
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.profile.job_title, 'Backend Developer')
        self.assertIsNotNone(response.data['created_at'])

    def test_missing_required_fields(self):
        response = self.client.post(LIST_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ['username', 'email', 'first_name', 'gender', 'date_of_birth', 'hire_date']:
            self.assertIn(field, response.data)
        self.assertNotIn('phone', response.data)
        self.assertNotIn('bio', response.data)

    def test_username_and_email_must_be_unique_ignoring_case(self):
        create_profile(username='ali.khan', email='ali.khan@example.com')
        response = self.client.post(
            LIST_URL,
            profile_payload(username='ALI.KHAN', email='ALI.KHAN@example.com'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertIn('email', response.data)
        self.assertEqual(User.objects.count(), 1)

    def test_invalid_values(self):
        cases = {
            'gender': 'other',
            'email': 'not-an-email',
            'date_of_birth': '1995-13-40',
            'username': 'has spaces',
        }
        for field, value in cases.items():
            with self.subTest(field=field):
                response = self.client.post(LIST_URL, profile_payload(**{field: value}), format='json')
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_hire_date_must_be_after_date_of_birth(self):
        response = self.client.post(
            LIST_URL,
            profile_payload(date_of_birth='2000-01-01', hire_date='1999-01-01'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('hire_date', response.data)

    def test_failed_profile_does_not_leave_a_user_behind(self):
        self.client.post(LIST_URL, profile_payload(gender='other'), format='json')
        self.assertFalse(User.objects.exists())


class UpdateProfileTests(APITestCase):
    def setUp(self):
        self.profile = create_profile()

    def test_patch_updates_user_and_profile_fields(self):
        response = self.client.patch(
            detail_url(self.profile.id),
            {'first_name': 'Sarah', 'city': 'Abu Dhabi', 'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.user.first_name, 'Sarah')
        self.assertEqual(self.profile.city, 'Abu Dhabi')
        self.assertFalse(self.profile.is_active)

    def test_keeping_own_email_is_allowed(self):
        response = self.client.patch(detail_url(self.profile.id), {'email': self.profile.user.email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_take_another_users_email(self):
        other = create_profile(username='other')
        response = self.client.patch(detail_url(self.profile.id), {'email': other.user.email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_update_missing_profile_returns_404(self):
        response = self.client.patch(detail_url(999), {'city': 'X'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DeleteProfileTests(APITestCase):
    def test_delete_removes_profile_and_user(self):
        profile = create_profile()
        response = self.client.delete(detail_url(profile.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserProfile.objects.exists())
        self.assertFalse(User.objects.exists())

    def test_delete_missing_profile_returns_404(self):
        self.assertEqual(self.client.delete(detail_url(999)).status_code, status.HTTP_404_NOT_FOUND)
