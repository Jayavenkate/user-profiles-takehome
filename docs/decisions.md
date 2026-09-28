# Decisions & trade-offs

## Backend

**Django REST Framework.** The brief recommends it, and `ModelViewSet`, `SearchFilter`, `PageNumberPagination` and serializer validation cover almost every requirement with little custom code. That kept my time on the parts that are specific to this app: the flat serializer, images and import.

**One flat serializer instead of nested `user` + `profile` objects.** Multipart form data has no clean way to send nested objects. With a flat shape, the same field names work for JSON, multipart, the React form and the import. The cost is that the serializer maps `user.*` fields by hand in `create()` and `update()`.

**Profile id in the URL, not user id.** The resource being managed is the profile, so `/api/profiles/{id}/` uses `UserProfile.id`.

**Deleting a profile deletes the User.** In this app a `User` exists only to back a profile. Leaving orphaned users would block their username and email from being used again, and would show up in the admin as confusing leftovers. The profile and its image are removed through `CASCADE` and a `post_delete` signal.

**Users get an unusable password.** These are managed records, not accounts that log in. Adding login would be a separate feature.

**Uniqueness checked case-insensitively; email stored lowercase.** `Ali@Example.com` and `ali@example.com` are the same person in practice. Django's `User.email` is not unique at the database level, so the serializer enforces it (see [Known issues](known-issues.md)).

**Image cleanup with signals.** A profile can be deleted directly or through its `User`, and an image can be replaced or cleared. Signals catch all of those paths in one place. Doing it in the view would miss the cascade.

**Image validators defined once and shared.** I originally let the model validators apply on their own, and a test showed that a `.gif` still got through the API. Declaring the serializer's `ImageField` explicitly replaces the model's validators. Now both use `PROFILE_IMAGE_VALIDATORS`, and a test covers it.

**Extra validation beyond the brief:** date of birth in the past, hire date after date of birth, 5 MB image limit, `page_size` capped at 100, and import limits (2 MB, 1000 records). They are cheap, and they stop obviously wrong data or unbounded requests.

**Import skips existing usernames.** See [Import behaviour](import.md).

## Frontend

**Vite + React + React Router, plain JavaScript, no UI library.** The brief says TypeScript is optional and styling isn't graded on polish. Plain JS and one CSS file kept the focus on structure and UI states.

**The URL is the only source of truth for list state.** `page`, `page_size` and `search` are read from `useSearchParams`, never copied into `useState`. Refresh, back/forward and shared links therefore always agree with what's on screen, and there's no state to sync.

**A small `useFetch` hook instead of a data library.** React Query or SWR would add caching, but this app has two read endpoints. The hook handles loading, error, reload, and aborting stale requests, which prevents old responses from overwriting newer ones.

**The form doesn't know about the API.** `ProfileForm` receives `onSubmit(formData)`. The create and edit pages each supply one line that calls the right endpoint. That keeps one form for both pages and makes the form easy to reuse.

**Validation on both sides.** Client-side checks give instant feedback and avoid pointless requests. The server is still the authority, since only it can know that a username is taken. Its errors are mapped back onto the same fields.

**Debounced search-as-you-type.** Searching waits for a 350 ms pause, so typing a name sends one request, not one per keystroke. Enter still searches immediately. While typing, the URL is updated with `replace`, so the history isn't filled with half-typed searches.

**Sorting through a named allowlist, not DRF's `OrderingFilter`.** The URL stays readable (`?ordering=-name`), `name` can mean first name then last name, and a client can't sort by fields that aren't in the table. Sort lives in the URL with page, search and filters.

**A native `<dialog>` for delete confirmation.** `ConfirmDialog` uses `showModal()`, which gives focus trapping, Esc to close and a backdrop without a modal library. Unlike `window.confirm`, it can name the profile being deleted and stay open with a spinner until the request finishes.

**Frontend tests through the UI, with the API mocked.** Tests use React Testing Library queries by role and label, the way a user or screen reader finds things, so they survive markup and styling changes. Only `api/profiles.js` is mocked. The form, validation, routing and URL state all run for real. Pure helpers (`validateProfile`, `filters`) get plain unit tests.

**Always send multipart from the form.** The API accepts both formats, and using `FormData` for every save means one code path whether or not an image was chosen.

## What I'd improve with more time

- **Thumbnails.** Resize uploaded images (for example with Pillow on save), so the list doesn't download full-size images for 36px avatars.
- **An "unsaved changes" warning** when leaving the form.
- **Database-level email uniqueness** (a unique constraint on `Lower('email')` in a migration) to close the race described in Known issues.
- **Import preview / update mode.** Show what will happen before committing, with an optional "update existing" mode.
- **Authentication and permissions** on the API.
- **OpenAPI docs** via `drf-spectacular`, and a `docker-compose.yml` for one-command setup.
