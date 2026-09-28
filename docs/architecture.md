# How it works

```
Browser (React, :5173) ──fetch──► Django REST Framework (:8000) ──► SQLite
                                         │
                                         └──► backend/media/profile_images/  (uploaded files)
```

## Backend (`backend/`)

```
backend/
├── config/              project settings and root URLs
└── profiles/
    ├── models.py        UserProfile model, image validators
    ├── signals.py       delete image files when they are no longer used
    ├── serializers.py   one flat serializer for User + UserProfile
    ├── views.py         ModelViewSet (CRUD, search, filters) + departments, countries and import actions
    ├── filters.py       ?department=, ?is_active= and created/updated date ranges
    ├── importer.py      JSON import logic
    ├── pagination.py    ?page= and ?page_size=
    ├── admin.py         Django admin registration
    └── tests/           API, image and import tests
```

### Models

Django's built-in `User` holds `username`, `email`, `first_name` and `last_name`. `UserProfile` is linked to it with a `OneToOneField` (`on_delete=CASCADE`, `related_name='profile'`) and adds:

| Field | Type | Notes |
|---|---|---|
| `phone` | `CharField(30)` | optional |
| `gender` | `CharField` with `TextChoices` | `male` or `female` |
| `date_of_birth`, `hire_date` | `DateField` | |
| `job_title`, `department`, `city`, `country` | `CharField(100)` | |
| `bio` | `TextField` | optional |
| `profile_image` | `ImageField` | optional; jpg/jpeg/png/webp, max 5 MB |
| `is_active` | `BooleanField` | default `True` |
| `created_at`, `updated_at` | `DateTimeField` | `auto_now_add` / `auto_now` |

Profiles are records, not login accounts, so users are created with an unusable password.

### API

A single `UserProfileViewSet` (DRF `ModelViewSet`) provides list, retrieve, create, update, partial update and delete at `/api/profiles/`. A router registers it, and extra `@action`s add `GET /api/profiles/departments/`, `GET /api/profiles/countries/` and `POST /api/profiles/import/`.

- **Serializer.** `UserProfileSerializer` returns user and profile fields as **one flat object**. The user fields use `source='user.username'` and so on. Flat means the same field names work in JSON and in multipart form data, which the image upload needs. `create()` and `update()` write the `User` and the `UserProfile` inside one transaction, so a failure never leaves half a record.
- **Validation.** Username and email are unique, compared case-insensitively. Emails are stored lowercase. Date of birth must be in the past, and hire date must be after date of birth. The image validators are defined once in `models.py` and reused by the serializer.
- **Search.** DRF `SearchFilter` over username, email, first name and last name. Each word in the query must match one of those fields, so `ahmad smith` finds Ahmad Smith.
- **Filters.** `filters.py` applies `department`, `is_active` and the `created_*` / `updated_*` date range params on the list only. Bad values raise a 400 with field errors, like the serializer does. `GET /api/profiles/departments/` and `/countries/` feed the dropdowns.
- **Sorting.** `order_profiles()` in `filters.py` maps `?ordering=` names (`name`, `department`, `city`, `-created_at`, …) to ORM fields. It uses an explicit allowlist rather than DRF's `OrderingFilter`, so the API exposes short column names and never lets a client sort by an arbitrary field. `id` is always added as a tiebreaker so rows don't shift between pages.
- **Pagination.** `PageNumberPagination` with `page_size` from the query string (default 10, max 100). The response includes `count`, `next` and `previous`.
- **Queries.** The queryset uses `select_related('user')`, so a page of profiles is one query rather than one per row.
- **Delete.** Deleting a profile deletes its `User`. The profile goes with it through `CASCADE`.

### Profile images

- Stored with Django's default file storage under `MEDIA_ROOT` (`backend/media/`), in `profile_images/<random hex>.<ext>`. The random name means two uploads called `photo.jpg` never overwrite each other.
- In development, Django serves `MEDIA_URL` (`/media/`) from `config/urls.py` while `DEBUG` is on. The API returns an absolute URL, or `null` when there is no image.
- Two validations run: the extension must be jpg, jpeg, png or webp, and Pillow checks that the file really is an image. The size limit is 5 MB.
- `signals.py` keeps the folder clean. `post_delete` removes the file when a profile is deleted, including through the `User` cascade. `pre_save` removes the old file when the image is replaced or cleared.
- `backend/media/` is in `.gitignore`.

## Frontend (`frontend/src/`)

```
src/
├── App.jsx                 routes
├── api/
│   ├── client.js           fetch wrapper: base URL, JSON/FormData, errors
│   └── profiles.js         one function per endpoint
├── hooks/
│   ├── useFetch.js         loading / error / data for a request, with abort
│   └── useToast.js         toast context and the useToast() hook
├── pages/                  one component per route
├── components/
│   ├── form/               ProfileForm (shared), FormField, FormSection, ImageInput, Select, Combobox
│   ├── ProfileTable.jsx, Pagination.jsx, SearchBar.jsx, FilterDrawer.jsx
│   ├── ImportButton.jsx, ImportResult.jsx
│   ├── ConfirmDialog.jsx, Toast.jsx, Spinner.jsx, Icons.jsx
│   └── ProfileImage.jsx, StatusBadge.jsx, DeleteProfileButton.jsx, Layout.jsx
└── utils/                  validation, formatting and URL filter helpers
```

### Routes (React Router 7)

| Path | Page |
|---|---|
| `/` | `ProfileListPage` |
| `/profiles/new` | `ProfileCreatePage` |
| `/profiles/:id` | `ProfileDetailPage` |
| `/profiles/:id/edit` | `ProfileEditPage` |
| `*` | `NotFoundPage` |

Detail and edit show a "Profile not found" view when the API returns 404.

### Data fetching

- Components never call `fetch` directly. `api/client.js` builds the URL, sends JSON or `FormData`, and turns failures into an `ApiError` with `status` and the response body. For a 400 response, the body holds field errors. If the server can't be reached, the message says so.
- `useFetch(fetcher, deps)` runs a request when its dependencies change and returns `{ data, error, loading, reload }`. It aborts the previous request, so a slow old response can't overwrite a newer one. It keeps the old data while reloading, so the table doesn't flash empty between pages.

### List page and URL state

`page`, `page_size`, `search`, `ordering` and the filters (`department`, `status`, `created_from`, `created_to`, `updated_from`, `updated_to`) are read from the query string with `useSearchParams`. They are never copied into component state, so refresh, back/forward and shared links all show the same list. A new search, sort or filter removes `page`, which sends the user back to page 1. Default values are left out of the URL to keep it short. `utils/filters.js` turns the URL's local `YYYY-MM-DD` dates into API datetimes.

Search runs as you type: `SearchBar` waits 350 ms after the last keystroke (`SEARCH_DEBOUNCE_MS`), and Enter searches straight away. The debounced update *replaces* the current history entry, so Back doesn't step through every pause while typing. The input keeps its own text and only follows the URL when it changes from outside (back/forward, "Clear search"), so the URL update never steals focus or moves the cursor. Old requests are aborted by `useFetch`, so a slow response can't overwrite a newer one.

Column headers are buttons: clicking one sorts by it ascending, clicking again flips it, and the header gets `aria-sort` and an arrow.

The filter drawer (`FilterDrawer`) is a native `<dialog>`, so it gets focus trapping and Esc for free. It edits a draft and only changes the URL on **Apply filters**. Active filters show as removable chips under the toolbar.

Rows have checkboxes, and clicking anywhere on a row (other than the name link) ticks it. The toolbar's **View** and **Edit** need exactly one ticked row, and **Delete** works on all ticked rows (one request each, failures listed). New profiles are added from the sidebar's **New profile** link. The buttons are never disabled: clicking one without a suitable selection shows an info toast ("Tick a profile first…") instead; errors from delete and import also show as red toasts. The selection belongs to one view of the list: changing page, search or filters clears it.

The page shows separate states for loading, a failed request (with retry), a page number past the end, no profiles at all, and a search or filter with no results.

### Shared form

`ProfileForm` is used by both the create and edit pages. It knows nothing about the API. Each page passes an `onSubmit(formData)` that calls `createProfile` or `updateProfile` and then navigates.

1. Client-side validation (`utils/validateProfile.js`) mirrors the API rules: required fields, username characters, email format, dates, and image type and size. If it fails, nothing is sent and the first invalid field gets focus.
2. The submit button is disabled while the request is in flight.
3. A 400 response is mapped back to the fields: `{ "email": ["..."] }` appears under the email input. The form also shows an error toast: the field's own message when only one field failed, otherwise a summary. Other failures, such as a network error, appear in an error toast too.

The image preview uses `URL.createObjectURL` for the chosen file. The previous object URL is revoked when a new file is chosen or the page unmounts. On edit, the current image shows until a new file is picked. **Remove image** sends an empty `profile_image`, which clears it on the server.

### Styling

There is a single `index.css` and no UI library. Grids and flex rows wrap at narrow widths. The table scrolls horizontally inside its own box, so the page never overflows at 768px. On wider screens the list card fills the window: rows scroll inside it while the table header and the pagination stay pinned. Below 900px the page scrolls normally and the pagination sticks to the bottom edge.
