# 🌳 Family Website

A full-stack Instagram-style family website with a public frontend, private admin panel, and real-time messaging.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express v5 |
| Database | MongoDB Atlas (Mongoose) |
| Media | Cloudinary |
| Auth | JWT (HTTP-only cookies) |
| Cache | Redis (optional, gracefully skipped if not set) |

---

## Project Structure

```
/
├── frontend/    ← Vite + React app
├── backend/     ← Express API
```

---

## Setup

### 1. Backend Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```env
MONGODB_URI=mongodb+srv://...          # MongoDB Atlas connection string
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
JWT_SECRET=some_random_long_string
FRONTEND_URL=http://localhost:5173
PORT=5000
ADMIN_PASSWORD=Admin@1234              # Password for first admin
REDIS_URL=                             # Optional — leave blank to skip
```

### 2. Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 4. Seed Admin User

Run this ONCE after setting up your `.env`:

```bash
cd backend && npm run seed
```

This creates an admin user with:
- **Username:** `admin`
- **Password:** (from your `ADMIN_PASSWORD` env var, default: `Admin@1234`)

> ⚠️ Change the admin password after first login!

---

## Running Locally

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Admin Panel: http://localhost:5173/admin

---

## Features

### Public Pages
- **Home** — Hero carousel, family history timeline, animated stats, member preview
- **Members** — Instagram-style grid of all active members

### Member Profile (`/members/:username`)
- Instagram-style layout: avatar, stats, bio
- Follow/Unfollow toggle
- Message button (opens DM)
- Posts grid with lightbox
- Edit profile (own profile)
- Create post (own profile)
- Followers/Following modal

### Auth-Required Pages
- **Search** — Debounced member search + explore photo/video gallery
- **Messages** — DM conversations with 3s polling
- **Admin** — Full management panel (admin only)

### Admin Panel (`/admin`)
- Overview stats dashboard
- Member management: create, enable/disable, delete
- Post management: view all, delete any

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/members` | — | All active members |
| GET | `/api/members/:username` | — | Profile + posts |
| PUT | `/api/members/:username` | ✓ | Edit profile |
| POST | `/api/members/:username/follow` | ✓ | Follow/unfollow |
| POST | `/api/posts` | ✓ | Create post |
| GET | `/api/posts/feed` | — | Explore feed |
| GET | `/api/messages/conversations` | ✓ | All conversations |
| GET | `/api/messages/:userId` | ✓ | Chat thread |
| POST | `/api/messages/:userId` | ✓ | Send message |
| GET | `/api/search/members?q=` | — | Search members |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| POST | `/api/admin/members` | Admin | Create member |

---

## Deployment Notes

- Set `NODE_ENV=production` on the backend for secure cookies
- Use a cloud Redis like [Upstash](https://upstash.com/) (free tier)
- Deploy frontend to Vercel/Netlify, backend to Railway/Render
- Update `FRONTEND_URL` in backend env to your production frontend URL
