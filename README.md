# Junior Full-Stack Take-Home: User Profiles (Django + React)

Welcome, and thanks for taking the time to do this exercise.

We know you may not have used Django before. That's fine and expected. We're less interested in a perfect result than in **how you learn, structure your work, and explain your decisions**.

---

## ⏱️ Time & Submission

- **Suggested time:** 8–12 hours of work. Please don't spend much more than that.
- That window is for the **core** requirements only. Bonus items are extra and optional.
- If Django is new to you, expect more of that time on the backend. A complete, working core beats unfinished polish.
- **Deadline:** 1 October 2026
- **Submission:** open a **Pull Request against the `master` branch** of this repository (see [Submitting your work](#-submitting-your-work)).
- You may use documentation, tutorials, Stack Overflow and AI tools. If you use AI tools, say so in the PR description and be ready to explain every line of your code in a follow-up call.

---

## 🎯 The Goal

Build a small app to manage **user profiles**:

1. A **Django** backend that extends Django's built-in `User` with a `UserProfile` model.
2. A **REST API** with full CRUD for users and their profiles, with pagination.
3. A **React** frontend that lists, views, creates, updates and deletes profiles.
4. An **Import** button on the frontend that loads the sample data in [`data/user_profiles.json`](data/user_profiles.json).

---

## 📦 What's in this repository

```
.
├── README.md                     ← you are here
├── data/
│   └── user_profiles.json        ← 100 sample records to import
└── .github/
    └── pull_request_template.md  ← fill this in when you open your PR
```

Everything else is up to you.

---

## 🧱 Requirements

### 1. Project setup

- Create a Django project and a React app in this repo. A suggested layout:
  ```
  backend/    ← Django project
  frontend/   ← React app (Vite or Create React App)
  ```
- Use **SQLite** for the database (no extra setup needed for us).
- Include a `requirements.txt` (backend) and `package.json` (frontend).
- Do **not** commit `node_modules/`, virtual environments, `db.sqlite3`, or secrets. Add a `.gitignore`.

### 2. Data model

Use Django's built-in `django.contrib.auth.models.User` (do **not** replace it with a custom user model). Create a `UserProfile` model linked **one-to-one** with `User`.

`User` already provides: `username`, `email`, `first_name`, `last_name`.

`UserProfile` must have at least these fields (look at the JSON file to choose sensible field types):

| Field           | Notes                                              |
|-----------------|----------------------------------------------------|
| `phone`         | optional                                           |
| `gender`        | one of `male`, `female` (use choices)              |
| `date_of_birth` | a date                                             |
| `job_title`     |                                                    |
| `department`    |                                                    |
| `city`          |                                                    |
| `country`       |                                                    |
| `bio`           | optional, can be long text                         |
| `profile_image` | optional image upload (see notes below)            |
| `hire_date`     | a date                                             |
| `is_active`     | true/false                                         |
| `created_at`    | set automatically                                  |
| `updated_at`    | set automatically                                  |

`profile_image` notes:
- Store it as an uploaded file on `UserProfile` (e.g. Django `ImageField`), not a required URL string.
- Optional on create, update, and import. The sample JSON has **no** images — imported profiles can have an empty image.
- Accept common image types only (`jpg`, `jpeg`, `png`, `webp`). Reject other files with a useful validation error.
- Configure media storage (`MEDIA_ROOT` / `MEDIA_URL`) so uploaded images can be served in development. Do **not** commit uploaded files.
- When a profile is deleted, remove its image file as well (or document why you didn't).

Register the model in the **Django admin**.

### 3. REST API

We recommend **Django REST Framework (DRF)**, but you may use something else if you can justify it.

Provide endpoints to:

| Action              | Expectation                                                    |
|---------------------|----------------------------------------------------------------|
| List profiles       | Paginated. Support `?page=` and `?page_size=`. Also support `?search=` (match name, username, or email). |
| Retrieve a profile  | Returns user fields + profile fields together.                 |
| Create a profile    | Creates the `User` **and** its `UserProfile` in one request. Must accept an optional `profile_image` file. |
| Update a profile    | Can update user fields and profile fields, including replacing or clearing `profile_image`. |
| Delete a profile    | Removes the profile (decide what happens to the `User` and document it). |
| Import from JSON    | Accepts the structure of `data/user_profiles.json`.            |

API expectations:
- Return proper HTTP status codes (`200`, `201`, `204`, `400`, `404`).
- Validate input and return useful error messages.
- `username` and `email` must be unique.
- The list response must tell the frontend the **total count** and whether there are next/previous pages.
- Create and update that include an image must accept **multipart form data** (JSON-only create/update is fine when no file is sent). Responses should include a usable image URL (or `null` when there is no image).

### 4. Import

- Add an **Import** button in the UI that sends `data/user_profiles.json` (file upload) to the backend.
- ⚠️ **The sample data is not perfectly clean.** Your import must not crash on bad records. Decide how to handle them, and show the result to the user (e.g. "96 imported, 4 failed" with reasons).
- Think about what should happen if the same file is imported twice. Document your choice.

### 5. Frontend (React)

This is a full-stack exercise. We will review the React app as carefully as the API — structure, UX, and how you handle real UI states.

**Routing**

Use client-side routing (React Router or equivalent). At minimum:

- `/` — list
- `/profiles/new` — create
- `/profiles/:id` — detail
- `/profiles/:id/edit` — update

A 404 / "profile not found" view is required when the id does not exist.

**Pages**

- **List** — a table of profiles (at least: thumbnail, name, username, email, department, job title, city, active status). Show a placeholder when there is no image.
  - **Pagination** in the URL (`?page=`), so refresh and back/forward keep the same page.
  - **Search** by name, username, or email. Keep the query in the URL (`?search=`). Searching should reset to page 1 and work across the whole dataset (not only the current page).
  - **Empty state** when there are no profiles, and a different empty state when a search returns nothing.
- **Detail** — all fields, including the profile image (or a placeholder). Link to edit and delete.
- **Create / Update** — one **shared form component** used by both pages (do not copy-paste two forms).
  - Optional image file input.
  - **Live preview** of the selected image before submit. On edit, show the current image until a new file is chosen.
  - **Client-side validation** before submit (required fields, email format, image type). Then also show **API validation errors** next to the matching fields.
  - Disable the submit button while a request is in flight; say what failed if the request errors.
- **Delete** — from the list or detail page, with a confirmation. After success, return to the list and the row should be gone.
- **Import** — the button described above. Show imported vs failed counts and the failure reasons without leaving the page.

**UI states (required)**

- Loading, error, empty, and success for list, detail, forms, and import.
- Broken image / missing image fallback.
- The layout should stay usable at laptop width and a narrower window (~768px). A design system is not required; it should not overflow or become unusable.

**Code organisation**

- Do **not** put the whole app in one file. Split routes, pages, form, table, and API calls.
- Prefer a small API helper (or similar) over `fetch` copied into every component.
- TypeScript is welcome but not required.

Styling is not graded on visual polish. We *do* grade whether the UI is clear, whether forms are usable, and whether the React code is structured on purpose. Any UI library is allowed.

### 6. Bonus (optional — only if you have time)

Pick any. Don't do them at the cost of the core requirements.

- Sortable table columns (reflect sort in the URL).
- Filter by department or active status.
- Debounced search-as-you-type.
- Frontend tests (form validation, empty states).
- Backend tests (models, API, import).
- Docker / `docker-compose` setup.
- API documentation (e.g. Swagger/OpenAPI via `drf-spectacular`).

---

## 📝 Documentation (required)

Add documentation to your PR. It can be a `docs/` folder or sections in this README. It must include:

1. **Setup** — exact steps to run backend and frontend from a fresh clone.
2. **How it works** — a short explanation of the architecture: models, how the API is structured, how the frontend is organised (routes, shared form, data fetching), and how profile images are stored and served.
3. **API reference** — each endpoint, method, and an example request/response (include a multipart create/update example).
4. **Import behaviour** — how bad records and duplicates are handled.
5. **Decisions & trade-offs** — what you chose and why, and what you'd improve with more time.
6. **Known issues** — anything unfinished or not working.

We value honest documentation. "I didn't finish X because Y" is much better than hiding it.

---

## 🚀 Submitting your work

1. Create a branch from `master`, e.g. `feature/user-profiles`.
2. Commit in **small, meaningful steps** with clear messages. We will read your commit history.
3. Push and open a **Pull Request into `master`**.
4. Fill in the PR template completely.
5. Do **not** merge the PR yourself.

---

## 🔍 How we'll review

Roughly in this order of importance:

- Does it run by following your setup instructions?
- Are the requirements met (model, CRUD, pagination, search, import, profile image)?
- **Frontend:** routing, shared form, image preview, URL state, and loading / empty / error handling.
- Is the code readable and well organised (backend *and* React)?
- Are errors and bad data handled sensibly?
- Quality of documentation, PR description and commit history.

After the review we may schedule a **short call** where you walk us through your code and we ask you to make a small change live.

---

## ❓ Questions

If something is unclear, make a reasonable assumption and **write it down** in your documentation. You can also email us — asking good questions is a plus, not a minus.

Good luck! 🍀
