from rest_framework.pagination import PageNumberPagination


class ProfilePagination(PageNumberPagination):
    """Supports ?page= and ?page_size= (capped so a client can't ask for everything)."""

    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
