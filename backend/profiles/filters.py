from datetime import datetime, time

from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.exceptions import ValidationError

# Query param -> ORM lookup. "after" is inclusive and "before" is exclusive, so
# the client can send the start of one local day and the start of the next.
DATE_RANGE_PARAMS = {
    'created_after': 'created_at__gte',
    'created_before': 'created_at__lt',
    'updated_after': 'updated_at__gte',
    'updated_before': 'updated_at__lt',
}

BOOLEAN_VALUES = {'true': True, '1': True, 'false': False, '0': False}

# ?ordering= value -> ORM fields. A leading "-" sorts descending, e.g. ?ordering=-created_at.
ORDERING_FIELDS = {
    'name': ['user__first_name', 'user__last_name'],
    'username': ['user__username'],
    'department': ['department'],
    'job_title': ['job_title'],
    'city': ['city'],
    'is_active': ['is_active'],
    'created_at': ['created_at'],
    'updated_at': ['updated_at'],
}


def parse_moment(value):
    """ISO datetime ("2026-09-28T21:00:00Z") or plain date ("2026-09-28", midnight in server time)."""
    moment = parse_datetime(value)
    if moment is None:
        day = parse_date(value)
        if day is None:
            return None
        moment = datetime.combine(day, time.min)
    if timezone.is_naive(moment):
        moment = timezone.make_aware(moment)
    return moment


def filter_profiles(queryset, params):
    """Applies ?department=, ?is_active= and the created/updated date range params."""
    errors = {}

    department = params.get('department', '').strip()
    if department:
        queryset = queryset.filter(department__iexact=department)

    is_active = params.get('is_active', '').strip().lower()
    if is_active:
        if is_active not in BOOLEAN_VALUES:
            errors['is_active'] = ['Use true or false.']
        else:
            queryset = queryset.filter(is_active=BOOLEAN_VALUES[is_active])

    for param, lookup in DATE_RANGE_PARAMS.items():
        value = params.get(param, '').strip()
        if not value:
            continue
        try:
            moment = parse_moment(value)
        except ValueError:
            moment = None
        if moment is None:
            errors[param] = ['Enter a valid date or ISO datetime.']
        else:
            queryset = queryset.filter(**{lookup: moment})

    if errors:
        raise ValidationError(errors)
    return queryset


def order_profiles(queryset, params):
    """Applies ?ordering=; without it the model's default order (newest first) is kept."""
    value = params.get('ordering', '').strip()
    if not value:
        return queryset
    descending = value.startswith('-')
    fields = ORDERING_FIELDS.get(value.lstrip('-'))
    if fields is None:
        raise ValidationError({'ordering': [f'Use one of: {", ".join(ORDERING_FIELDS)} (prefix "-" for descending).']})
    prefix = '-' if descending else ''
    # "id" breaks ties, so rows with equal values keep a stable order across pages.
    return queryset.order_by(*[prefix + field for field in fields], prefix + 'id')
