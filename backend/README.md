# MediCare Home Backend

Production-structured FastAPI backend for the MediCare Home medication management system.

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:
   pip install -r requirements.txt
3. Copy `.env.example` to `.env` and adjust values.
4. Configure the database URL in `.env`. SQLite is suitable for local development.
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
