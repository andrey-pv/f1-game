# F1 Predictor

Full-stack Formula 1 prediction and gamification platform. Predict race winners and pole sitters, earn points, and compete on a global leaderboard.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand + Firebase Auth
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + PostgreSQL + Redis
- **Data**: Jolpica F1 API (Ergast mirror) + OpenF1 API
- **Auth**: Google OAuth 2.0 via Firebase
- **Infra**: Docker Compose (local), Vercel (frontend), Railway (backend)

## Quick Start (Docker)

```bash
# 1. Clone and enter directory
cd f1game

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your Firebase credentials

# 3. Start all services
docker compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
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
# Edit .env with Firebase config

npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SECRET_KEY` | Random 32-byte secret |
| `ADMIN_UID` | Firebase UID of admin user |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (e.g., `http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Firebase Setup

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Sign-In** under Authentication > Sign-in method
3. Add authorized domains: `localhost`, your production domain
4. Generate a service account key (Project Settings > Service Accounts > Generate new private key)
5. Copy values to `backend/.env`
6. Copy web app config to `frontend/.env`

## Running Tests

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set environment variables in Vercel dashboard
```

### Backend → Railway

```bash
# Connect GitHub repo in Railway dashboard
# Set environment variables in Railway
# Railway auto-detects Dockerfile
```

## API Documentation

With the backend running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive Swagger UI.

## Points System

| Event | Points |
|---|---|
| Correct Race Winner | 25 pts |
| Correct Pole Sitter | 15 pts |
| Double Hit (both correct) | +10 pts |
| Perfect Weekend bonus | +20 pts |
| 3-Race Win Streak | +15 pts |
| 5-Race Win Streak | +30 pts |
| Early Bird (48h+ before qualifying) | +2 pts |
