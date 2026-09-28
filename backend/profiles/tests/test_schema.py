from rest_framework import status
from rest_framework.test import APITestCase


class OpenApiSchemaTests(APITestCase):
    def test_schema_documents_every_endpoint_and_list_param(self):
        response = self.client.get('/api/schema/', HTTP_ACCEPT='application/vnd.oai.openapi+json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        schema = response.json()
        self.assertEqual(
            set(schema['paths']),
            {
                '/api/profiles/',
                '/api/profiles/{id}/',
                '/api/profiles/departments/',
                '/api/profiles/countries/',
                '/api/profiles/import/',
            },
        )
        params = {p['name'] for p in schema['paths']['/api/profiles/']['get']['parameters']}
        self.assertLessEqual(
            {'page', 'page_size', 'search', 'department', 'is_active', 'ordering', 'created_after', 'updated_before'},
            params,
        )
        create = schema['paths']['/api/profiles/']['post']['requestBody']['content']
        self.assertIn('multipart/form-data', create)

    def test_swagger_ui_is_served(self):
        response = self.client.get('/api/docs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, 'swagger-ui')
