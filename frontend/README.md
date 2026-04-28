# 🚨 Smart Incident Response Platform

A hackathon-grade full-stack application for real-time incident management, built with the **MERN stack** (MongoDB, Express, React, Node.js).

---

## ✨ Features

| Feature | Status |
|---|---|
| JWT Authentication (stateless) | ✅ |
| bcrypt Password Hashing | ✅ |
| Role-Based Access Control (admin, responder, user) | ✅ |
| Protected API Routes | ✅ |
| Input Validation | ✅ |
| Admin Panel (`/admin`) | ✅ |
| Incident CRUD | ✅ |
| Real-time Timeline via Socket.io | ✅ |
| AI Postmortem via Gemini API | ✅ |
| In-Memory GET /incidents Caching (30s TTL) | ✅ |
| Debounced Incident Search | ✅ |
| Zustand Global State | ✅ |
| Mobile Responsive Layout | ✅ |
| Public Status Page | ✅ |

---

## 🏗 Project Structure

```
hackathon/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, GetUsers
│   │   ├── incidentController.js   # Full CRUD + AI summary + caching
│   │   └── adminController.js      # Admin: list users/incidents, delete user
│   ├── middleware/
│   │   └── authMiddleware.js       # protect (JWT) + adminOnly
│   ├── models/
│   │   ├── User.js                 # bcrypt hashing, role field
│   │   └── Incident.js             # Incident schema with timeline
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── incidentRoutes.js       # All routes protected
│   │   └── adminRoutes.js          # Admin-only routes
│   ├── server.js                   # Express + Socket.io + MongoDB
│   └── .env                        # Environment variables
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Layout.jsx
        │   ├── Navbar.jsx           # Admin link for admin role
        │   └── ProtectedRoute.jsx   # Auth + role guard
        ├── pages/
        │   ├── Dashboard.jsx        # Incidents list + search
        │   ├── IncidentDetail.jsx   # Real-time incident room
        │   ├── AdminPanel.jsx       # Admin panel (/admin)
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   └── StatusPage.jsx       # Public status page
        └── store/
            └── useStore.js          # Zustand: user, incidents, users
```

---

## 🔐 Security

### Password Hashing
Passwords are hashed using **bcryptjs** with salt rounds of 10, applied in a Mongoose `pre('save')` hook in `User.js`. Plain-text passwords are never stored.

### JWT Authentication
- Tokens are signed with `JWT_SECRET` from `.env` and expire in **30 days**.
- All protected routes require `Authorization: Bearer <token>` header.
- The server is **stateless** — no sessions or cookies needed.

### Role-Based Access Control (RBAC)
| Role | Permissions |
|---|---|
| `user` | View & create incidents, add timeline updates |
| `responder` | Same as user |
| `admin` | All of the above + access `/admin` panel, delete users |

---

## ⚡ Architecture & Horizontal Scaling

### Current Setup
```
[Browser] → [React Frontend :5173] → [Express Backend :5000] → [MongoDB Atlas]
```

### Making It Scale (Conceptual)

The backend is already **stateless** (JWT, no server-side sessions), which means it can run as multiple instances:

```
[Browser]
    ↓
[Load Balancer] (e.g., Nginx, AWS ALB)
    ├── [Backend Instance 1 :5000]
    ├── [Backend Instance 2 :5001]
    └── [Backend Instance 3 :5002]
           ↓
    [MongoDB Atlas] ← single shared database for all instances
```

#### Node.js Cluster Mode (optional)
Uncomment and add to `server.js` to use all CPU cores:

```js
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary process forking ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Your existing server start code here
  startServer();
}
```

#### Docker Scaling (optional)
```bash
# Build image
docker build -t incident-backend ./backend

# Run 3 instances
docker run -p 5000:5000 incident-backend
docker run -p 5001:5000 incident-backend
docker run -p 5002:5000 incident-backend
```

Use Nginx as a reverse proxy to load balance across all three.

---

## 📦 In-Memory Caching

`GET /api/incidents` uses a simple in-memory cache with a 30-second TTL:

```js
const cache = { data: null, expiresAt: 0 };
const CACHE_TTL_MS = 30 * 1000;

if (cache.data && Date.now() < cache.expiresAt) {
  return res.json(cache.data); // serve from cache
}
// else fetch from DB and update cache
```

Cache is automatically invalidated when incidents are created or updated.

---

## 🤖 AI Integration

Uses **Google Gemini API** (`gemini-2.0-flash`) to auto-generate:
- **Incident Summary** — professional SRE-style description
- **Probable Root Cause** — based on the timeline updates

Requires `GEMINI_API_KEY` in `.env`.

---

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
npm install
# Create .env (see below)
npx nodemon server.js
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### .env (backend)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/hackathon
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🛠 Admin Panel

1. Register a user and manually set their role to `admin` in MongoDB Atlas
2. Login — the **Admin** link appears in the navbar
3. Navigate to `/admin` to view all users and incidents
4. Delete any non-admin user from the Users tab

---

## 📱 Responsiveness

- Navbar collapses brand text on mobile
- Dashboard header wraps on small screens
- Forms are full-width on mobile
- Incident cards wrap content properly
- Admin panel tables scroll horizontally on small screens
