# API reference

Base URL: `http://localhost:8000/api`

All endpoints accept and return JSON. Create and update also accept `multipart/form-data`, which is needed when sending an image. There is no authentication (see [Known issues](known-issues.md)).

| Method | Path | Description | Success |
|---|---|---|---|
| GET | `/profiles/` | List (paginated, searchable) | 200 |
| POST | `/profiles/` | Create user + profile | 201 |
| GET | `/profiles/{id}/` | Retrieve | 200 |
| PUT | `/profiles/{id}/` | Full update | 200 |
| PATCH | `/profiles/{id}/` | Partial update | 200 |
| DELETE | `/profiles/{id}/` | Delete profile and its user | 204 |
| POST | `/profiles/import/` | Import a JSON file | 200 |

Errors: `400` for validation errors (body is `{ field: [messages] }`), `404` for an unknown id or a page past the end.

## Profile object

`{id}` is the `UserProfile` id.

```json
{
  "id": 12,
  "username": "noura.alsabah",
  "email": "noura.alsabah@example.com",
  "first_name": "Noura",
  "last_name": "Al-Sabah",
  "phone": "+971 90801586",
  "gender": "female",
  "date_of_birth": "1980-06-08",
  "job_title": "Backend Developer",
  "department": "Engineering",
  "city": "Dubai",
  "country": "United Arab Emirates",
  "bio": "Team player who enjoys cross-functional work.",
  "profile_image": "http://localhost:8000/media/profile_images/3d991689d72343ef93bf52552275e661.png",
  "hire_date": "2020-08-31",
  "is_active": true,
  "created_at": "2026-09-28T07:22:18.813930Z",
  "updated_at": "2026-09-28T07:22:18.813951Z"
}
```

| Field | Required | Rules |
|---|---|---|
| `username` | yes | unique (case-insensitive), max 150, letters, digits and `@ . + - _` |
| `email` | yes | valid email, unique (case-insensitive), stored lowercase |
| `first_name`, `last_name` | yes | max 150 |
| `gender` | yes | `male` or `female` |
| `date_of_birth` | yes | `YYYY-MM-DD`, in the past |
| `hire_date` | yes | `YYYY-MM-DD`, after `date_of_birth` |
| `job_title`, `department`, `city`, `country` | yes | max 100 |
| `phone` | no | max 30 |
| `bio` | no | any length |
| `is_active` | no | boolean, default `true` |
| `profile_image` | no | jpg/jpeg/png/webp, max 5 MB. `null` (or an empty multipart value) clears it |
| `id`, `created_at`, `updated_at` | read-only | |

## List profiles

`GET /profiles/?page=2&page_size=10&search=sara`

| Parameter | Default | Notes |
|---|---|---|
| `page` | 1 | page past the end returns 404 `{"detail": "Invalid page."}` |
| `page_size` | 10 | max 100 |
| `search` | none | matches username, email, first or last name; every word must match |
| `department` | none | exact match, ignoring case |
| `is_active` | none | `true` or `false` |
| `created_after` / `created_before` | none | ISO datetime (`2026-09-28T00:00:00+03:00`) or date (`2026-09-28`, midnight UTC). `after` is inclusive, `before` is exclusive |
| `updated_after` / `updated_before` | none | same as above, for `updated_at` |
| `ordering` | `-created_at` | one of `name`, `department`, `job_title`, `city`, `is_active`, `created_at`, `updated_at`; prefix `-` for descending. `name` sorts by first then last name. Ties are broken by `id`, so pages stay stable |

All filters combine with each other and with `search`. An invalid value (including an unknown `ordering`) returns 400, e.g. `{"created_after": ["Enter a valid date or ISO datetime."]}`.

Without `ordering`, results are newest first.

The frontend sends date ranges as the viewer's local midnight, with the end moved to the next midnight. That way "created 28 Sep" means 28 Sep in the viewer's timezone, not in UTC.

## Departments and countries

`GET /profiles/departments/` and `GET /profiles/countries/` return the distinct values in use, sorted. The form's Department and Country boxes and the filter's Department dropdown use them as suggestions:

```json
["Design", "Engineering", "Finance", "HR"]
```

```json
{
  "count": 96,
  "next": "http://localhost:8000/api/profiles/?page=3&page_size=10&search=sara",
  "previous": "http://localhost:8000/api/profiles/?page_size=10&search=sara",
  "results": [ { "id": 12, "username": "...", "...": "..." } ]
}
```

## Retrieve

`GET /profiles/12/` returns the profile object, or 404:

```json
{ "detail": "No UserProfile matches the given query." }
```

## Create

JSON (no image):

```bash
curl -X POST http://localhost:8000/api/profiles/ \
  -H 'Content-Type: application/json' \
  -d '{"username": "ali.khan", "email": "ali.khan@example.com", "first_name": "Ali",
       "last_name": "Khan", "gender": "male", "date_of_birth": "1990-05-01",
       "job_title": "Backend Developer", "department": "Engineering",
       "city": "Kuwait City", "country": "Kuwait", "hire_date": "2020-01-15"}'
```

Multipart with an image:

```bash
curl -X POST http://localhost:8000/api/profiles/ \
  -F username=sara.m -F email=sara@example.com \
  -F first_name=Sara -F last_name=Mohammed \
  -F gender=female -F date_of_birth=1992-02-02 \
  -F job_title=Designer -F department=Design \
  -F city=Dubai -F country=UAE -F hire_date=2021-01-01 \
  -F is_active=true \
  -F profile_image=@photo.png
```

`201 Created` returns the profile object, with `profile_image` as a full URL.

`400 Bad Request` example:

```json
{
  "username": ["A user with this username already exists."],
  "email": ["A user with this email already exists."],
  "gender": ["\"other\" is not a valid choice."],
  "date_of_birth": ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."],
  "profile_image": ["Only JPG, JPEG, PNG and WEBP images are allowed."]
}
```

## Update

`PATCH` changes only the fields sent. `PUT` requires every required field. With both, leaving out `profile_image` keeps the current image.

```bash
# Change fields (JSON)
curl -X PATCH http://localhost:8000/api/profiles/12/ \
  -H 'Content-Type: application/json' \
  -d '{"first_name": "Sarah", "city": "Abu Dhabi", "is_active": false}'

# Replace the image (the old file is deleted)
curl -X PATCH http://localhost:8000/api/profiles/12/ -F profile_image=@new-photo.jpg

# Clear the image: empty multipart value ...
curl -X PATCH http://localhost:8000/api/profiles/12/ -F profile_image=

# ... or null in JSON
curl -X PATCH http://localhost:8000/api/profiles/12/ \
  -H 'Content-Type: application/json' -d '{"profile_image": null}'
```

Returns `200` with the updated profile, `400` with field errors, or `404`.

## Delete

`DELETE /profiles/12/` returns `204 No Content`. The `User`, the `UserProfile` and the image file are all removed.

## Import

`POST /profiles/import/` as `multipart/form-data` with a `file` field. The file is a JSON array in the shape of `data/user_profiles.json`:

```json
[
  {
    "username": "ahmad.smith",
    "email": "ahmad.smith@example.com",
    "first_name": "Ahmad",
    "last_name": "Smith",
    "profile": { "phone": "...", "gender": "male", "date_of_birth": "1976-04-05", "...": "..." }
  }
]
```

```bash
curl -F file=@data/user_profiles.json http://localhost:8000/api/profiles/import/
```

`200 OK`. The request succeeds even when some records fail:

```json
{
  "total": 100,
  "imported_count": 96,
  "skipped_count": 0,
  "failed_count": 4,
  "skipped": [],
  "failed": [
    { "row": 24, "username": "hassan.haddad", "errors": { "email": ["Enter a valid email address."] } },
    { "row": 52, "username": "grace.rossi", "errors": { "username": ["Duplicate of row 11 in this file."] } },
    { "row": 78, "username": "carlos.alenezi", "errors": { "date_of_birth": ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."] } },
    { "row": 89, "username": null, "errors": { "username": ["This field is required."] } }
  ]
}
```

Skipped items look like `{ "row": 1, "username": "ahmad.smith", "reason": "A user with this username already exists." }`.

`400` when the file itself is unusable. The body is `{ "file": ["..."] }`, for one of these reasons:

- no file was sent
- the file is larger than 2 MB
- the file is not valid UTF-8 JSON
- the JSON is not a list
- the list has more than 1000 records

See [Import behaviour](import.md) for the rules.
