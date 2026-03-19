# F1 Predictor

Full-stack Formula 1 prediction and gamification platform. Predict race winners and pole sitters, earn points, and compete on a global leaderboard.

## Features

- **Predictions** — Pick the race winner and pole sitter for each Grand Prix before qualifying locks
- **Points & Scoring** — Earn points for correct picks, with an early bird bonus for submitting early
- **Leaderboard** — Global rankings with live accuracy, streak counters, and total points
- **Player profiles** — Click any player on the leaderboard to see their full prediction history across past races
- **Streaks** — Win and prediction streaks tracked per user
- **Badges** — Achievements awarded automatically based on performance
- **Admin panel** — Manage races, import results, and trigger scoring

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, Framer Motion |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 15 |
| Auth | Google OAuth 2.0 via Firebase |
| Cache | In-memory (5-minute TTL on leaderboard responses) |
| Infra | Docker Compose (local), Vercel (frontend), Railway (backend) |

## Quick Start (Docker)

```bash
# 1. Clone and enter directory
cd f1game

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your credentials (see Environment Variables below)

# 3. Start all services
docker compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs:    http://localhost:8000/docs
```

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env with your Firebase config

npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `http://localhost:5173`) |
| `SECRET_KEY` | Random secret string |
| `ADMIN_UID` | Firebase UID of the admin user |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Sign-In** under Authentication > Sign-in method
3. Add authorized domains: `localhost` and your production domain
4. Generate a service account key: Project Settings > Service Accounts > Generate new private key
5. Copy the values into `backend/.env`
6. Copy the web app config into `frontend/.env`

## Points System

| Event | Points |
|---|---|
| Correct race winner | 25 pts |
| Correct pole sitter | 15 pts |
| Early bird (submitted 48h+ before qualifying) | +2 pts |

## API Documentation

With the backend running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive Swagger UI.

Key endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Sign in with Firebase ID token |
| `GET` | `/api/races` | List all races |
| `GET` | `/api/races/{id}` | Race detail with results |
| `POST` | `/api/predictions` | Submit a prediction |
| `GET` | `/api/predictions/history` | Your prediction history |
| `GET` | `/api/predictions/user/{id}` | Another user's completed-race predictions |
| `GET` | `/api/leaderboard` | Global leaderboard |
| `GET` | `/api/leaderboard/me` | Your rank and nearby players |
| `GET` | `/api/stats/{user_id}` | User stats and badges |

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set VITE_* environment variables in the Vercel dashboard
```

### Backend → Railway

```bash
# Connect the GitHub repo in the Railway dashboard
# Set all backend environment variables in Railway
# Railway auto-detects the Dockerfile
```

## Running Tests

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```
