# Setup

## Requirements

| Tool | Version | Notes |
|---|---|---|
| Python | 3.10 or newer | Developed on 3.14. Django 5.2 supports 3.10–3.14. |
| Node.js | 20.19+ or 22.12+ | Required by Vite 8. Developed on 20.20. |
| npm | 10+ | Comes with Node. |

No database server is needed. The backend uses SQLite.

Prefer containers? See [Run with Docker](#run-with-docker-alternative).

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver         # http://localhost:8000
```

Interactive API docs (Swagger UI) are at http://localhost:8000/api/docs/.

Optional, to use the Django admin at http://localhost:8000/admin/:

```bash
python manage.py createsuperuser
```

### Environment variables (all optional)

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | a development-only key | Set a real value outside local development. |
| `DJANGO_DEBUG` | `1` | `0` turns debug off. Uploaded images are only served by Django while debug is on. |
| `DJANGO_DB_PATH` | `backend/db.sqlite3` | Where the SQLite file lives. Docker sets it to a volume. |
| `DJANGO_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated origins allowed to call the API. |

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The frontend calls `http://localhost:8000/api` by default. To point it somewhere else, copy `frontend/.env.example` to `frontend/.env.local` and change `VITE_API_URL`.

The backend allows CORS requests from `http://localhost:5173` and `http://127.0.0.1:5173` only. If Vite picks a different port because 5173 is busy, stop the other process or add the port to `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py`.

## Run with Docker (alternative)

If you have Docker with Compose v2, one command builds and starts both apps. No Python or Node is needed on your machine.

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api (Swagger UI at http://localhost:8000/api/docs/)

The ports are the same as the manual setup, so stop `runserver` and `npm run dev` first if they are running. The database and uploaded images are kept in Docker volumes, so they survive `docker compose down` and restarts. To start from an empty database, run `docker compose down -v`.

The backend container runs migrations on start and then Django's development server. The frontend is built with `npm run build` and served by nginx, so it's the production bundle rather than the Vite dev server. The API URL is baked in at build time (`VITE_API_URL` build arg in `docker-compose.yml`).

## Load the sample data

Open http://localhost:5173, click **Import JSON**, and choose `data/user_profiles.json`. Expected result on an empty database: **96 imported, 0 skipped, 4 failed**. See [Import behaviour](import.md).

Or from the command line:

```bash
curl -F file=@data/user_profiles.json http://localhost:8000/api/profiles/import/
```

## Run the tests

```bash
cd backend
.venv/bin/python manage.py test profiles
```

51 tests cover the API (including filters and sorting), image handling, import and the OpenAPI schema. They use a temporary database and a temporary media folder, so your data is not touched.

Frontend tests and checks:

```bash
cd frontend
npm test          # or `npm run test:watch` while working
npm run lint
npm run build
```

30 frontend tests (Vitest + React Testing Library, in jsdom) cover form validation, server error mapping, the list's empty / no-results / error states, sorting, debounced search, and the filter and validation helpers. The API module is mocked, so the backend doesn't need to be running.

## Reset the database

```bash
cd backend
rm db.sqlite3
rm -rf media/
.venv/bin/python manage.py migrate
```
