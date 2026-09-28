# User Profiles: Documentation

A Django + DRF backend and a React (Vite) frontend for managing user profiles, with image upload and JSON import.

| Document | What's in it |
|---|---|
| [Setup](setup.md) | Run the backend and frontend from a fresh clone, run the tests |
| [How it works](architecture.md) | Models, API structure, frontend organisation, image storage |
| [API reference](api.md) | Every endpoint with example requests and responses |
| [Import behaviour](import.md) | How bad records and duplicates are handled |
| [Decisions & trade-offs](decisions.md) | What I chose, why, and what I'd improve |
| [Known issues](known-issues.md) | What is missing or limited |
| [Screenshots](screenshots/) | List, search, filters, form, detail, import result, 768px width and Swagger UI |

## Quick start

```bash
# Terminal 1: backend (http://localhost:8000)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver

# Terminal 2: frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Import JSON** to load `data/user_profiles.json`.
