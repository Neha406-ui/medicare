# MediCare Home Backend

Production-structured FastAPI backend for the MediCare Home medication management system.

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:
   pip install -r requirements.txt
3. Copy `.env.example` to `.env` and adjust values.
4. Configure `DATABASE_URL` and `SECRET_KEY` in `.env`. SQLite is suitable for local development; production requires PostgreSQL.
5. Apply database migrations:
   alembic upgrade head
6. On a new database, create the first administrator interactively:
   python -m app.create_admin
   This command prompts for the account details and refuses to create an administrator if one already exists. No sample residents, medications, or accounts are inserted.
7. Start API:
   uvicorn app.main:app --reload --port 8000

## API docs

- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Render deployment

Create a Render PostgreSQL database and a Python web service with `backend` as its Root Directory. Set the web service's `DATABASE_URL` to the database's **Internal Database URL**. SQLAlchemy URLs using either `postgres://` or `postgresql://` are normalized to the installed Psycopg 3 driver.

Configure these web-service environment variables:

- `APP_ENV=production`
- `DATABASE_URL` = the Render PostgreSQL Internal Database URL
- `SECRET_KEY` = a unique, randomly generated secret; do not reuse the development value
- `FRONTEND_URL` = the deployed frontend's origin, without a path (for example, `https://your-frontend.example`)

Optional settings are `ACCESS_TOKEN_EXPIRE_MINUTES` and `ALGORITHM`. Do not set `DATABASE_URL` to SQLite in production; configuration validation rejects it.

Render commands, with Root Directory set to `backend`:

- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Manual migration (when needed): `alembic upgrade head`

Application startup applies Alembic migrations before serving requests. The migration command can also be run manually from the same Root Directory. Alembic's script path is anchored to `alembic.ini`, so it does not depend on a caller's working directory.

For a separately deployed frontend, set its build-time `VITE_API_URL` to `https://<your-render-service>.onrender.com/api` and set the backend's `FRONTEND_URL` to the frontend origin. The frontend's checked-in `.env` is for local development only.
