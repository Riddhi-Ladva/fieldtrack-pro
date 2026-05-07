# FieldTrack Pro — Field Attendance & Tracking System

> **Prepared for Manager Review**
> Version: 1.0.0-MVP | Date: May 2026

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [How to Run Locally](#4-how-to-run-locally)
5. [Environment Variables](#5-environment-variables)
6. [Test Credentials](#6-test-credentials)
7. [Feature Status — What Is Working](#7-feature-status--what-is-working)
8. [Known Limitations & Bugs](#8-known-limitations--bugs)
9. [What Is Remaining / Not Yet Implemented](#9-what-is-remaining--not-yet-implemented)
10. [API Reference](#10-api-reference)
11. [Database Schema Overview](#11-database-schema-overview)
12. [Demo Data](#12-demo-data)

---

## 1. Project Overview

**FieldTrack Pro** is a web-based field employee attendance and real-time location tracking system built for organizations that need to monitor remote workers and office-based employees.

The platform supports **two attendance modes**:
- **Mode A — Geo-Fence**: Employee must be physically within a defined GPS zone to punch in.
- **Mode B — Remote Tracking**: Employee can punch in from anywhere; their location is tracked continuously throughout the shift.

The system has three user roles with distinct dashboards and access levels:

| Role | Description |
|---|---|
| **Admin** | Full system access — manages users, geo-fences, org settings, reports, and audit logs |
| **Editor** | Supervisor-level — monitors team, manages attendance, views reports. Cannot create other Admins/Editors |
| **Member** | Field employee — can only punch in/out and view their own live map |

---

## 2. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v18+ | Runtime |
| Express.js | v5 | REST API framework |
| MongoDB Atlas | Cloud | Database |
| Mongoose | v9 | ODM |
| Socket.io | v4 | Real-time bidirectional communication |
| JSON Web Token (JWT) | v9 | Authentication |
| bcryptjs | v3 | Password hashing |
| dotenv | v17 | Environment config |
| morgan | v1 | HTTP request logging |
| nodemon | v3 | Dev auto-restart |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React.js | v18 | UI framework |
| Vite | v6 | Build tool & dev server |
| React Router DOM | v6 | Client-side routing |
| Zustand | v4 | State management (Auth + Socket) |
| Axios | v1 | HTTP client with JWT interceptor |
| Socket.io Client | v4 | Real-time location reception |
| React Leaflet | v4 | Interactive maps |
| Leaflet.js | v1 | Map engine (OpenStreetMap tiles) |
| date-fns | v4 | Date formatting utilities |
| Lucide React | Latest | Icon library |
| Shadcn UI components | Custom | Button, Card, Input, Label |
| TailwindCSS | v3 | Utility-first CSS framework |

---

## 3. Project Structure

```
FTP/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js       # Login, Register org
│   │   │   ├── userController.js       # CRUD users (RBAC enforced)
│   │   │   ├── geoFenceController.js   # Geo-fence CRUD
│   │   │   ├── attendanceController.js # Punch in/out, location logging
│   │   │   └── reportController.js     # Summary, records, CSV export
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js       # protect + authorizeRoles
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Organization.js
│   │   │   ├── GeoFence.js
│   │   │   ├── AttendanceSession.js
│   │   │   ├── LocationLog.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── geoFenceRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── auditRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── utils/
│   │   │   ├── generateToken.js        # JWT token utility
│   │   │   └── haversine.js            # GPS distance calculation
│   │   ├── index.js                    # Server entry point + Socket.io
│   │   ├── seeder.js                   # Base seed (resets DB to clean state)
│   │   └── safeSeeder.js              # Append-only demo data seeder
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx      # Route guard (role-based)
    │   │   └── ui/                     # Shadcn UI components
    │   ├── hooks/
    │   │   └── useGeolocation.js       # GPS watcher hook
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── AdminDashboard.jsx      # Full admin control panel
    │   │   ├── EditorDashboard.jsx     # Supervisor panel
    │   │   ├── MemberDashboard.jsx     # Field employee panel
    │   │   └── Reports.jsx             # Dedicated reports page
    │   ├── store/
    │   │   ├── authStore.js            # Zustand auth + Axios instance
    │   │   └── socketStore.js          # Zustand Socket.io store
    │   └── App.jsx                     # Routes definition
    └── package.json
```

---

## 4. How to Run Locally

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- A MongoDB Atlas URI (or local MongoDB instance)

### Step 1 — Clone & Navigate

```bash
# The project folder is FTP/
cd FTP
```

### Step 2 — Setup Backend

```bash
cd backend
npm install
```

Create `.env` file in `backend/` with the following (see Section 5):

```bash
# Then start the backend dev server
npm run dev
```

✅ Server will start at **http://localhost:5000**

### Step 3 — Setup Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend will start at **http://localhost:5173**

### Step 4 — Seed Initial Data (First Time Only)

```bash
cd backend
node src/seeder.js
```

This creates:
- An organization: **FieldTrack Demo Corp**
- An Admin account
- A Member account
- A sample Geo-Fence

### Step 5 — (Optional) Add Demo Attendance Records

```bash
node src/safeSeeder.js
```

> ⚠️ Safe to run multiple times — it won't delete or overwrite existing data. Only adds demo records if none exist.

---

## 5. Environment Variables

Create a file at `backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fieldtrack
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for signing JWTs |
| `PORT` | Optional | Defaults to `5000` |

> ⚠️ Never commit `.env` to version control.

---

## 6. Test Credentials

After running `node src/seeder.js`:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@demo.com | password123 |
| **Member** | member@demo.com | password123 |

> **Note**: No Editor account is created by the seeder. Create one from the Admin dashboard → Team Management → Add New Member → Role: Editor.

---

## 7. Feature Status — What Is Working

### ✅ Authentication & Security
- [x] Login with email/password
- [x] Logout (clears JWT from localStorage)
- [x] JWT-based authentication (Bearer token)
- [x] Protected API routes via middleware
- [x] Role-Based Access Control (Admin / Editor / Member)
- [x] Editor blocked from creating/elevating Admin or Editor accounts (enforced on both frontend and backend)
- [x] Organization registration (POST `/api/auth/register`)

### ✅ Admin Dashboard
- [x] Sidebar navigation with tab switching
- [x] Live employee map (OpenStreetMap + Leaflet)
- [x] Geo-fence circles rendered on map
- [x] Real-time employee markers with popup (name, mode, last update time)
- [x] Today's attendance overview summary cards (Total Team, Present, Absent, Active, Punch-Ins, Punch-Outs)
- [x] Team Management: Add, Edit members
- [x] Role assignment (Admin can assign Admin/Editor/Member)
- [x] Geo-Fence Management: Create, Edit, Delete zones
- [x] Assign geo-fence to employees
- [x] Organization Settings (name, remote tracking interval)
- [x] Audit Logs tab (all system actions displayed)
- [x] Reports sidebar link → dedicated Reports page

### ✅ Editor Dashboard
- [x] Live map with active employee markers
- [x] Team directory (view & edit Members only)
- [x] Cannot create or assign Admin/Editor roles
- [x] Attendance history tab with CSV export
- [x] My Activity (audit log filtered view)
- [x] Reports link in sidebar

### ✅ Member Dashboard
- [x] GPS acquisition with loading state
- [x] Mode selection (Remote / Geo-Fenced)
- [x] Automatic mode lock if assigned to a Geo-Fence
- [x] Punch In (with GPS validation)
- [x] Punch Out
- [x] Active session indicator (live pulsing dot)
- [x] Live map showing member's own current position
- [x] GPS disabled/denied error banner
- [x] Real-time location broadcasting via Socket.io

### ✅ Geo-Fence Attendance (Mode A)
- [x] Admin creates geo-fence with name, lat, lng, radius
- [x] Assign geo-fence to a specific employee
- [x] On Punch-In: server calculates distance using **Haversine formula**
- [x] Punch-in rejected if outside the allowed radius
- [x] Geo-Fenced employees cannot switch to Remote mode

### ✅ Remote Tracking (Mode B)
- [x] Punch in from any location
- [x] Location broadcast every X minutes (configurable: 5/10/15/30 min)
- [x] Location saved to `LocationLog` collection at every interval
- [x] Session duration calculated on punch-out
- [x] Total distance calculated from breadcrumb logs on punch-out

### ✅ Live Location Tracking
- [x] Socket.io room-based architecture (one room per organization)
- [x] Members emit `send-location` events
- [x] Admin/Editor receive `live-location-update` events
- [x] Map markers update in real-time without page refresh
- [x] Attendance status changes trigger dashboard refresh (`attendance-status-changed`)

### ✅ Attendance Management
- [x] All sessions stored in `AttendanceSession` collection
- [x] Punch timestamps stored (punchInTime, punchOutTime)
- [x] Session status (Active / Completed)
- [x] Manual correction API (Admin/Editor can edit sessions)
- [x] Single-device restriction per active session
- [x] Remote punch-in blocked if user is assigned to a Geo-Fence

### ✅ Reports & Analytics
- [x] Dedicated `/admin/reports` and `/editor/reports` page
- [x] Summary cards: Present/Absent/Active/Punch-Ins/Punch-Outs (real-time)
- [x] Date range filters: Daily / Weekly / Monthly
- [x] Custom date range (start date + end date pickers)
- [x] Daily attendance trend visualization
- [x] Attendance records table (last 30 days by default)
- [x] Search by employee name or email
- [x] Pagination (10 records per page)
- [x] **CSV export** — downloads a `.csv` file with: Employee Name, Email, Mode, Punch In, Punch Out, Duration, Status, Date

### ✅ Audit Logs
- [x] Every critical action is logged: LOGIN, PUNCH_IN, PUNCH_OUT, USER_CREATED, USER_UPDATED, GEOFENCE_CREATED, GEOFENCE_UPDATED, GEOFENCE_DELETED, ATTENDANCE_CORRECTION, ORG_UPDATED
- [x] Audit logs viewable in Admin Dashboard → Audit Logs tab
- [x] Each log shows: timestamp, actor (who did it), action, entity, and metadata

### ✅ Security
- [x] Passwords hashed with bcryptjs (salt rounds: 10)
- [x] JWT expires based on configured secret
- [x] All sensitive routes require valid JWT
- [x] Organization isolation — users can only see data within their own organization

---

## 8. Known Limitations & Bugs

| # | Component | Issue | Severity |
|---|---|---|---|
| 1 | Member Dashboard | Session timer (HH:MM:SS countdown) is not displayed in the UI. Duration is calculated and stored on punch-out but not shown live. | Low |
| 2 | Member Dashboard | Attendance history list is not rendered in the Member's own view. History is accessible only from Admin/Editor dashboards and Reports. | Medium |
| 3 | Reports | Trend chart is shown as card tiles, not a proper bar/line chart (no chart library integrated — recharts was removed during stabilization). | Low |
| 4 | Notifications | No push notifications. GPS alerts and Geo-Fence breach alerts are shown as inline UI banners only (no browser notifications or emails). | Medium |
| 5 | App.jsx Routing | `/admin/reports` route is registered **before** `/admin/*` wildcard. If React Router resolves incorrectly in some edge cases, switching the route order may be needed. | Low |
| 6 | Auth Redirect | Editor role does not redirect to a proper "unauthorized" page if accessing restricted admin routes. | Low |

---

## 9. What Is Remaining / Not Yet Implemented

The following features are **defined in the PRD** but were **not implemented in this MVP sprint**:

### 🔴 High Priority (Core PRD Requirements)
| Feature | Reason Not Implemented |
|---|---|
| **PDF Report Export** | Marked optional for MVP; `pdfmake` was removed during dependency rollback for stability |
| **Attendance History in Member Dashboard** | Backend data exists; frontend table view not built |
| **Session Timer (live countdown)** | Punch-in time is stored; UI countdown component not built |
| **Failed Punch Attempt Logging** | The rejection is logged in audit but not in a dedicated "failed attempts" collection |

### 🟡 Medium Priority (Enhancements)
| Feature | Reason Not Implemented |
|---|---|
| **Email Notifications** | No email service (SendGrid/Nodemailer) integrated |
| **Push Notifications (Browser)** | Service Workers not configured |
| **Background GPS Tracking (Mobile)** | Requires native app (React Native / Capacitor) — web-only for now |
| **Battery Alert System** | Mobile-native feature; not applicable to web |
| **Route Breadcrumb Map Visualization** | Location logs saved to DB but not rendered as polylines on the map |
| **Distance Traveled per Session** | Calculated and stored on punch-out; not displayed in the Member dashboard |
| **Geo-Fence Breach Detection Post Punch-In** | Zone exit after punch-in is not continuously monitored |

### 🟢 Low Priority (Nice to Have)
| Feature | Reason Not Implemented |
|---|---|
| **Dark Mode** | Tailwind config not extended for dark mode |
| **Multi-Geo-Fence per Employee** | Schema supports one fence per user only |
| **Attendance Approval Workflow** | No approval/rejection flow for manual punches |
| **Data Export to Excel (.xlsx)** | Only CSV is supported |
| **Admin User Deletion** | UI has no delete button for users (only edit) |

---

## 10. API Reference

> Base URL: `http://localhost:5000/api`
> All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/register` | Public | Register new organization + Admin |
| GET | `/auth/org` | Protected | Get org settings |
| PUT | `/auth/org` | Admin only | Update org settings |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin, Editor | Get all org members |
| POST | `/users` | Admin, Editor | Create member (Editor cannot create Admin/Editor) |
| PUT | `/users/:id` | Admin, Editor | Update user |

### Geo-Fences
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/geofences` | Admin, Editor | Get all fences |
| POST | `/geofences` | Admin | Create fence |
| PUT | `/geofences/:id` | Admin | Update fence |
| DELETE | `/geofences/:id` | Admin | Delete fence |

### Attendance
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/attendance/punch-in` | Member | Punch in (with GPS + mode validation) |
| POST | `/attendance/punch-out` | Member | Punch out (calculates distance + duration) |
| GET | `/attendance/active` | Member | Get own active session |
| POST | `/attendance/location` | Member | Log current GPS location |
| GET | `/attendance/org-active` | Admin, Editor | Get all active sessions |
| PUT | `/attendance/:id` | Admin, Editor | Manual attendance correction |

### Reports
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reports/summary` | Admin, Editor | Overview counters + trend data. Params: `range` (daily/weekly/monthly), `startDate`, `endDate` |
| GET | `/reports/records` | Admin, Editor | Raw attendance records for table. Params: `startDate`, `endDate` |
| GET | `/reports/export` | Admin, Editor | Download CSV file. Params: `startDate`, `endDate`, `search` |

### Audit Logs
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/audit` | Admin, Editor | Get all audit logs for org |

---

## 11. Database Schema Overview

### User
```
name, email, password (hashed), role (Admin/Editor/Member),
organizationId (ref), assignedGeoFenceId (ref, optional)
```

### Organization
```
name, createdBy (ref: User), trackingInterval (minutes, default: 5)
```

### GeoFence
```
name, organizationId (ref), location: { lat, lng }, radius (meters)
```

### AttendanceSession
```
userId (ref), organizationId (ref), punchInTime, punchOutTime,
status (Active/Completed), mode (Geo-Fenced/Remote),
punchInLocation: { lat, lng }, deviceId, totalDistance (km), duration (min)
```

### LocationLog
```
sessionId (ref), userId (ref), location: { lat, lng }, timestamp
```

### AuditLog
```
actorId (ref: User), organizationId (ref), action (string),
targetEntity (string), details (object), timestamp
```

---

## 12. Demo Data

After running `node src/safeSeeder.js`, the database will contain:
- **34 realistic attendance sessions** across the last 45 days
- Mix of **Remote** (75%) and **Geo-Fenced** (25%) sessions
- Varied punch-in times (8–10 AM) and durations (6–10 hrs)
- Random GPS coordinates around `37.7749, -122.4194` (San Francisco reference point)

All demo records are clearly tagged with `DEMO_SEEDED` in the `deviceId` field for easy identification and cleanup.

### To remove demo data only:
```javascript
// In MongoDB shell or Compass:
db.attendancesessions.deleteMany({ deviceId: /DEMO_SEEDED/ })
```

---

## Quick Start Summary

```bash
# 1. Backend
cd backend && npm install
# Create .env with MONGO_URI and JWT_SECRET
npm run dev

# 2. Frontend (new terminal)
cd frontend && npm install
npm run dev

# 3. Seed base data
cd backend && node src/seeder.js

# 4. (Optional) Add demo attendance records
node src/safeSeeder.js
```

**Frontend**: http://localhost:5173
**Backend API**: http://localhost:5000/api

---

*FieldTrack Pro — Built with MERN Stack + Socket.io + React Leaflet*
