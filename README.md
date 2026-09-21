# GymPass

A multi-gym membership platform for India. MERN stack: MongoDB, Express, React (Vite), Node.js.

## Phase 0 — Project Setup (current state)

This is the initial scaffold: two independent apps (`backend/`, `frontend/`) wired
together with a working health-check connection, Tailwind theme configured, and
environment variable templates in place. No real features (auth, gyms, payments,
etc.) exist yet — those come in later phases.

## Prerequisites

Install these on your machine first:

- **Node.js** v18 or newer (v20 LTS recommended) — https://nodejs.org
- **MongoDB** — either:
  - **MongoDB Atlas** (free cloud cluster, recommended for beginners) — https://www.mongodb.com/cloud/atlas, or
  - **Local MongoDB Community Server** — https://www.mongodb.com/try/download/community

Check your Node install:
```bash
node -v
npm -v
```

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set:
- `MONGO_URI` — your MongoDB Atlas connection string, or `mongodb://127.0.0.1:27017/gympass` if running MongoDB locally
- `JWT_SECRET` — any long random string (we'll use this properly starting Phase 1)

Start the backend in dev mode (auto-restarts on file changes):
```bash
npm run dev
```

You should see in the terminal:
```
MongoDB connected: <your-cluster-host>
GymPass API server running on http://localhost:5000
```

Test it directly: open `http://localhost:5000/api/health` in your browser. You should see a JSON response like:
```json
{ "status": "ok", "message": "GymPass API is running", "timestamp": "..." }
```

## 2. Frontend Setup

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it in your browser.

## 3. Confirm the Full Connection

If everything is wired correctly, the page will show a dark GymPass card with:

> Backend says: **GymPass API is running**

If instead you see "Could not reach backend...", check that:
1. The backend terminal is still running with no errors
2. `backend/.env` → `CLIENT_URL` matches your frontend URL exactly (`http://localhost:5173`)
3. `frontend/.env` → `VITE_API_URL` matches your backend URL exactly (`http://localhost:5000/api`)

## Project Structure

See the architecture document from our planning phase for the full folder
structure, database design, and API/page map. This scaffold currently contains
only the setup files — models, routes, controllers, and pages will be filled in
phase by phase.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT (httpOnly cookies), bcrypt
