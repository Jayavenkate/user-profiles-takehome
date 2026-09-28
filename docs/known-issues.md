# Known issues and limitations

Nothing in the core requirements is unfinished as far as I know. These are the limits I'm aware of.

## Backend

- **No authentication.** Anyone who can reach the API can create, edit, delete and import. That's fine for a local take-home, not for production.
- **Email uniqueness is enforced by the serializer, not the database.** Two simultaneous requests with the same new email could both pass validation. Username is unique at the database level (Django's `User`), so it doesn't have this problem.
- **Import is synchronous.** Each record is validated and saved one by one, with a few queries per record. That's fine for 100 records and capped at 1000. A large import would need a background job and bulk inserts.
- **Import never updates existing users.** This is by design (see [Import behaviour](import.md)), but it means re-importing a corrected file won't fix records that already exist.
- **Images are served by Django only while `DEBUG` is on.** Production would need the web server or object storage (S3 or similar) to serve `MEDIA_ROOT`.
- **No image resizing.** The list's thumbnails load the original uploaded file.
- **No database-level check** that `gender` is `male`/`female`. It's enforced by model choices and the serializer, not by a `CHECK` constraint.

## Frontend

- **Frontend tests cover the form and the list page only.** The detail, edit and import flows, the filter drawer and bulk delete have no automated tests. I checked them by driving the UI in a headless browser (also at 768px width), but those scripts are not part of the repo.
- **Bulk delete is one request per profile.** There is no bulk endpoint, so if some deletes fail the rest still go through; the failures are listed afterwards.
- **Selection is per page.** Ticked rows are cleared when you change page, search or filters, so bulk actions only reach the rows you can see.
- **No warning about unsaved changes** when leaving the form.
- **Pagination has Previous/Next only**, with no numbered page links.
- **Timestamps (`created_at`, `updated_at`) show in the browser's local time.** Dates of birth and hire dates are plain dates and never shift.
- If port 5173 is taken and Vite starts on another port, the backend's CORS setting will block requests until the port is added (see [Setup](setup.md)).
