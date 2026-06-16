# 🌳 Family Website

A full-stack, Instagram-style private family portal with photo sharing, direct messaging, family events, special memory albums, and a secure admin panel.

---

## ✨ Features

### 🌐 Public Pages
- **Home** — Hero carousel, animated family history timeline, live member stats, upcoming events showcase
- **Members** — Instagram-style grid of all active family members with follow counts and bios

### 👤 Member Profile (`/members/:username`)
- Avatar, bio, stats (posts · followers · following)
- Follow / Unfollow toggle
- Message button → opens DM conversation
- Posts grid with full lightbox viewer (swipe/arrow navigation)
- Like & Save posts
- Edit own profile (name, bio, occupation, date of birth, profile photo)
- Create new posts (photo or video with caption)
- Followers / Following modal lists

### 🔍 Search (`/search`)
- Debounced live member search
- Explore photo & video gallery from all members

### 💬 Messages (`/messages`)
- Private DM conversations
- Unread badge counters
- Auto-mark messages as read when thread opens
- 3-second polling for new messages

### 🗂 Special Moments
- Admin-curated photo albums (folders with cover images)
- Viewable by all members

### 📅 Events
- Admin-managed upcoming family events with optional banner photos
- Shown on the public Home page

### 🛡 Admin Panel (`/admin`)
- **Overview** — Stats dashboard (members, posts, messages), system health indicators
- **Members** — Create, edit, enable/disable, delete members
- **Posts** — View all posts with media preview, delete any
- **Special Moments** — Create folders, upload photos, delete photos or entire folders
- **Events** — Create and delete family events with banner images
- All destructive actions use in-app confirmation modals (no browser dialogs)

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Vanilla CSS (custom design system, dark/light mode) |
| Backend | Node.js + Express v5 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Media Storage | Cloudinary (images + videos) |
| Auth | JWT stored in HTTP-only cookies |
| Caching | Redis (optional — gracefully skipped if not configured) |
| Toasts | react-hot-toast |
| Icons | Lucide React |

---

## 📁 Project Structure

```
/
├── frontend/               ← Vite + React app
│   ├── src/
│   │   ├── pages/          ← Home, Members, MemberProfile, Search, Messages, Admin, Login
│   │   ├── components/     ← PostLightbox, BottomNavbar, SettingsMenu, ProtectedRoute
│   │   ├── context/        ← AuthContext, ThemeContext
│   │   ├── api/            ← Axios API client + typed request helpers
│   │   └── types/          ← Shared TypeScript types
│   └── public/
│
└── backend/                ← Express API server
    └── src/
        ├── routes/         ← auth, members, posts, messages, moments, events, admin, search
        ├── models/         ← User, Post, Message, Moment, Event
        ├── middleware/     ← auth.js, upload.js (Cloudinary multer)
        ├── config/         ← cloudinary.js, redis.js
        └── seed.js         ← Seeds the initial admin account
```

---

## ⚙️ Setup

### 1. Backend Environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/familydb
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_long_random_secret_string
FRONTEND_URL=http://localhost:5173
PORT=5000
ADMIN_PASSWORD=your_secure_admin_password
REDIS_URL=                              # Optional — leave blank to disable caching
```

### 2. Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

Fill in `frontend/.env`:

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

### 4. Seed Admin Account

Run **once** after setting up your `.env`:

```bash
cd backend && npm run seed
```

This creates the admin user:
- **Username:** `admin`
- **Password:** value of your `ADMIN_PASSWORD` env variable

> ⚠️ Change the admin password after your first login!

---

## 🚀 Running Locally

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev        # or: node server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Admin Panel | http://localhost:5173/admin |

---

## 🔌 API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/login` | — | Login (sets HTTP-only JWT cookie) |
| POST | `/api/auth/logout` | — | Logout (clears cookie) |
| GET | `/api/auth/me` | ✓ | Get current user |

### Members

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/members` | — | All active members (cached) |
| GET | `/api/members/:username` | — | Public profile + posts |
| PUT | `/api/members/:username` | ✓ | Edit own profile (multipart) |
| POST | `/api/members/:username/follow` | ✓ | Toggle follow / unfollow |
| GET | `/api/members/:username/followers` | — | Follower list |
| GET | `/api/members/:username/following` | — | Following list |

### Posts

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/posts` | ✓ | Create post (multipart media) |
| GET | `/api/posts/feed` | — | Paginated explore feed |
| GET | `/api/posts/member/:username` | — | Posts by a specific member |
| POST | `/api/posts/:id/like` | ✓ | Toggle like |
| POST | `/api/posts/:id/save` | ✓ | Toggle save |
| GET | `/api/posts/saved` | ✓ | Get own saved posts |
| DELETE | `/api/posts/:id` | ✓ | Delete own post (or admin) |

### Messages

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/messages/conversations` | ✓ | All conversations with unread counts |
| GET | `/api/messages/:userId` | ✓ | Chat thread with a user |
| POST | `/api/messages/:userId` | ✓ | Send a message |

### Special Moments

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/moments` | — | All photo folders |
| POST | `/api/moments` | Admin | Create folder (optional cover image) |
| POST | `/api/moments/:id/images` | Admin | Upload photos to folder (up to 20) |
| DELETE | `/api/moments/:id/images/:imgId` | Admin | Delete a single photo |
| DELETE | `/api/moments/:id` | Admin | Delete entire folder + all photos |

### Events

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/events` | — | Upcoming events (cached 5 min) |
| POST | `/api/events` | Admin | Create event (optional banner) |
| DELETE | `/api/events/:id` | Admin | Delete event |

### Search

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/search/members?q=` | — | Search members by name or username |

### Admin

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/members` | Admin | All members (including disabled) |
| POST | `/api/admin/members` | Admin | Create new member account |
| PATCH | `/api/admin/members/:id` | Admin | Edit member info |
| PATCH | `/api/admin/members/:id/toggle` | Admin | Enable / disable member |
| DELETE | `/api/admin/members/:id` | Admin | Delete member + all their posts |
| GET | `/api/admin/posts` | Admin | All posts (paginated) |
| DELETE | `/api/admin/posts/:id` | Admin | Delete any post |

---

## 🚢 Deployment

### Environment Variables

Set these on your production backend host:

```env
NODE_ENV=production
MONGODB_URI=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=...
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_PASSWORD=...
REDIS_URL=redis://...   # e.g. Upstash free tier
```

### Recommended Platforms

| Service | Recommended Platform |
|---------|---------------------|
| Frontend | Vercel / Netlify |
| Backend | Railway / Render |
| Database | MongoDB Atlas (free tier) |
| Media | Cloudinary (free tier) |
| Cache | Upstash Redis (free tier) |

### Notes

- Set `NODE_ENV=production` for secure (HTTPS-only) JWT cookies
- Update `FRONTEND_URL` to your live frontend domain for CORS
- The frontend `VITE_API_URL` must point to your live backend URL at build time
- Run `npm run seed` once on the production backend after first deploy to create the admin account

---

## 🗝 Auth Notes

- Sessions are maintained via **HTTP-only JWT cookies** (no `localStorage`)
- Cookie is set with `sameSite: lax` in dev, `sameSite: none; secure` in production
- Admin routes check `user.isAdmin === true` server-side
- Disabled members (`isActive: false`) cannot log in
