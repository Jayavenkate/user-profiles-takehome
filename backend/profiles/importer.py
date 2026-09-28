"""
Import profiles from the structure used in data/user_profiles.json:

    [{"username": ..., "email": ..., "first_name": ..., "last_name": ...,
      "profile": {"phone": ..., "gender": ..., ...}}, ...]

Every record is validated with the same serializer the API uses, and saved in
its own transaction, so one bad record never stops (or half-saves) the others.

- Invalid record                        -> failed, with field errors
- Username repeated inside the file     -> failed
- Username already in the database      -> skipped (existing data is not overwritten)
"""

from django.contrib.auth.models import User
from django.db import transaction

from .serializers import USER_FIELDS, UserProfileSerializer


def _flatten(record):
    """Turn {"username": ..., "profile": {...}} into the flat shape the serializer expects."""
    profile = record.get('profile')
    if not isinstance(profile, dict):
        return None
    data = {field: record.get(field) for field in USER_FIELDS if field in record}
    data.update(profile)
    # Images can't be imported from JSON; they are uploaded separately.
    data.pop('profile_image', None)
    return data


def _failure(row, username, errors):
    return {'row': row, 'username': username, 'errors': errors}


def import_profiles(records):
    result = {'total': len(records), 'imported_count': 0, 'skipped': [], 'failed': []}
    seen_usernames = {}

    for row, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            result['failed'].append(_failure(row, None, {'non_field_errors': ['Record must be an object.']}))
            continue

        username = record.get('username')
        key = username.lower() if isinstance(username, str) else None

        if key and key in seen_usernames:
            result['failed'].append(_failure(row, username, {
                'username': [f'Duplicate of row {seen_usernames[key]} in this file.'],
            }))
            continue
        if key:
            seen_usernames[key] = row

        if key and User.objects.filter(username__iexact=key).exists():
            result['skipped'].append({
                'row': row,
                'username': username,
                'reason': 'A user with this username already exists.',
            })
            continue

        data = _flatten(record)
        if data is None:
            result['failed'].append(_failure(row, username, {'profile': ['Missing or invalid "profile" object.']}))
            continue

        serializer = UserProfileSerializer(data=data)
        if not serializer.is_valid():
            result['failed'].append(_failure(row, username, serializer.errors))
            continue

        with transaction.atomic():
            serializer.save()
        result['imported_count'] += 1

    result['skipped_count'] = len(result['skipped'])
    result['failed_count'] = len(result['failed'])
    return result
