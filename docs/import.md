# Import behaviour

**Import JSON** on the list page uploads a file to `POST /api/profiles/import/`. The summary appears on the same page: counts, plus a table of failed rows with reasons. Skipped usernames are listed in a collapsible section.

## How each record is handled

Records are processed in file order. Row numbers start at 1.

1. **Not an object**: failed, "Record must be an object."
2. **Username already seen earlier in this file**: failed, "Duplicate of row N in this file." The first occurrence is kept.
3. **Username already in the database**: skipped (see below).
4. **Missing or non-object `profile`**: failed.
5. **Otherwise**, the record is flattened into the API's shape and validated with `UserProfileSerializer`, the same serializer that create and edit use. That means the rules are identical: required fields, email format, real dates, gender choices, unique email, and so on. Invalid records are failed with the serializer's field errors.
6. Each valid record is saved in its own transaction, so one failure never rolls back or blocks the others.

Unknown keys are ignored. `profile_image` is ignored in JSON, because images can only be uploaded as files.

## Result for `data/user_profiles.json` on an empty database

**100 records: 96 imported, 0 skipped, 4 failed.**

| Row | Username | Reason |
|---|---|---|
| 24 | `hassan.haddad` | email `not-an-email` is not a valid email address |
| 52 | `grace.rossi` | same username (and email) as row 11 |
| 78 | `carlos.alenezi` | date of birth `1995-13-40` is not a real date |
| 89 | *(missing)* | no `username` field |

## Importing the same file twice

A second import gives **0 imported, 96 skipped, 4 failed**. Nothing is duplicated or changed.

**Choice: skip, don't update.** If a username already exists, that record is left alone. The reasoning:

- Profiles can be edited in the UI after importing. Re-importing an old file should not silently overwrite those edits.
- The result is predictable. Importing a file N times gives the same data as importing it once.
- Skipped records are reported separately from failures, so the user can tell "already there" apart from "bad data".

If updating were wanted later, it could be an explicit option (for example `?mode=update`) rather than the default.

Matching is by username, compared case-insensitively. A record with a new username but an email that another user already has is **failed** with "A user with this email already exists.", not skipped, because it is a genuine conflict.

## Limits

To stop one request from doing unbounded work:

- the file can be at most **2 MB**
- the file can hold at most **1000 records**

A missing file, invalid JSON, or JSON that isn't a list returns `400` with a message. No records are processed in that case.
