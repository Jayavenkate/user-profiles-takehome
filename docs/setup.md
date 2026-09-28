# Setup

## Requirements

| Tool | Version | Notes |
|---|---|---|
| Python | 3.10 or newer | Developed on 3.14. Django 5.2 supports 3.10–3.14. |
| Node.js | 20.19+ or 22.12+ | Required by Vite 8. Developed on 20.20. |
| npm | 10+ | Comes with Node. |

No database server is needed. The backend uses SQLite.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver         # http://localhost:8000
```

Optional, to use the Django admin at http://localhost:8000/admin/:

```bash
python manage.py createsuperuser
```

### Environment variables (all optional)

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | a development-only key | Set a real value outside local development. |
| `DJANGO_DEBUG` | `1` | `0` turns debug off. Uploaded images are only served by Django while debug is on. |

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The frontend calls `http://localhost:8000/api` by default. To point it somewhere else, copy `frontend/.env.example` to `frontend/.env.local` and change `VITE_API_URL`.

The backend allows CORS requests from `http://localhost:5173` and `http://127.0.0.1:5173` only. If Vite picks a different port because 5173 is busy, stop the other process or add the port to `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py`.

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

36 tests cover the API, image handling and import. They use a temporary database and a temporary media folder, so your data is not touched.

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Reset the database

```bash
cd backend
rm db.sqlite3
rm -rf media/
.venv/bin/python manage.py migrate
```
