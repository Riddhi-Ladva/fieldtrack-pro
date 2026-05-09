<div align="center">
  <h1>🌍 FieldTrack Pro</h1>
  <p><strong>Real-Time Field Employee Management & Attendance Platform</strong></p>
  
  [![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black.svg)](https://socket.io/)
</div>

<br />

## 📖 1. Project Overview

**FieldTrack Pro** is a comprehensive SaaS platform built to solve the challenges of managing remote and field employees. Time theft, buddy punching, and lack of visibility are common problems in field operations. FieldTrack Pro solves this by enforcing location-based attendance and providing real-time GPS tracking.

With this platform, organizations can define strict **Geo-Fenced zones** where employees must physically be located to punch in. Meanwhile, supervisors and admins get a bird's-eye view of their entire workforce on a live interactive map, complete with historical route tracing, comprehensive attendance reports, and PDF exports.

---

## 🔗 2. Live Demo

- **Frontend URL**: [Insert Frontend Demo URL Here]
- **Backend URL**: [Insert Backend API URL Here]
- **Documentation / Video**: [Insert Demo Video Link Here]

*(Demo credentials are provided in the Demo Accounts section below.)*

---

## ✨ 3. Core Features

FieldTrack Pro is divided into three distinct roles to ensure data privacy and operational efficiency:

### 👑 Admin Functionalities
- **Total Control**: Full access to all settings, users, and logs.
- **Geo-Fence Management**: Create, edit, and delete virtual perimeters on a live map.
- **Team Management**: Add/remove Editors and Members, assign them to specific Geo-Fences.
- **System Audits**: View immutable logs of every action taken within the system.

### 👥 Editor (Supervisor) Functionalities
- **Team Monitoring**: View live locations of assigned team members.
- **Member Management**: Add new team members to their department.
- **Attendance Correction**: Safely modify or correct employee punch-in times and modes if mistakes happen.

### 👷 Member Functionalities
- **Easy Check-in**: One-click Punch In and Punch Out with a live session timer.
- **Location Validation**: The app automatically reads GPS to ensure they are at the correct site.
- **Remote vs Geo-Fenced**: Switch between office/site attendance and remote fieldwork.

### 🌐 Universal Features
- **Live Tracking**: See exactly where remote employees are via Socket.IO live GPS updates.
- **Reports**: Filter historical attendance data by Date and Export to **CSV** or **PDF**.
- **Role-Based Access Control (RBAC)**: Strict security ensuring users only see what they are allowed to.

---

## 🛠 4. Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Vite | Ultra-fast user interface rendering |
| **Styling** | TailwindCSS | Modern, responsive, and clean design system |
| **Backend** | Node.js, Express.js | Robust API server and business logic routing |
| **Database** | MongoDB, Mongoose | NoSQL data storage for users, logs, and attendance |
| **Realtime** | Socket.IO | Bi-directional communication for live map tracking |
| **Mapping** | Leaflet, React-Leaflet | Interactive maps and Geo-Fence rendering |
| **Auth** | JSON Web Tokens (JWT) | Secure, stateless user authentication |

---

## 📁 5. Folder Structure

The project is structured into two main directories: `frontend` and `backend`.

```text
FieldTrack-Pro/
│
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── controllers/      # Business logic (auth, attendance, geoFences)
│   │   ├── middlewares/      # JWT protection and Role verification
│   │   ├── models/           # MongoDB schemas (User, AttendanceSession, etc.)
│   │   ├── routes/           # API Endpoints definition
│   │   ├── utils/            # Helper functions (Haversine formula, Token gen)
│   │   └── index.js          # Entry point and Socket.IO server setup
│   ├── .env                  # Backend environment variables
│   └── package.json
│
└── frontend/                 # React + Vite Client
    ├── src/
    │   ├── components/       # Reusable UI elements (Cards, Buttons, Inputs)
    │   ├── hooks/            # Custom React hooks (useGeolocation)
    │   ├── pages/            # Main dashboards (Admin, Editor, Member, Reports)
    │   ├── store/            # Zustand global state (authStore, socketStore)
    │   ├── App.jsx           # React Router setup
    │   └── main.jsx          # React DOM entry
    ├── .env                  # Frontend environment variables
    └── package.json
```

---

## 🚀 6. Installation Guide

Follow these simple step-by-step instructions to run the project on your local machine.

### Prerequisites
Before you begin, ensure you have installed:
1. **Node.js** (v18 or higher) - [Download Here](https://nodejs.org/)
2. **Git** - [Download Here](https://git-scm.com/)
3. **MongoDB** (Local setup or a free MongoDB Atlas cloud cluster)

### Step 1: Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/yourusername/fieldtrack-pro.git
cd fieldtrack-pro
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
Open a *new* terminal window and run:
```bash
cd frontend
npm install
```

---

## 🔐 7. Environment Variables

You need to set up environment variables for both the frontend and backend.

### Backend `.env`
Create a file named `.env` inside the `backend` folder and add:
```env
# Port for the server to run on
PORT=5000

# Your MongoDB connection string (Local or Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/fieldtrack

# A secret key used to sign JWT tokens (can be any random string)
JWT_SECRET=my_super_secret_jwt_key_123

# The URL where your frontend is running (used for CORS security)
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
Create a file named `.env` inside the `frontend` folder and add:
```env
# The URL pointing to your backend API
VITE_API_URL=http://localhost:5000/api
```

---

## ▶️ 8. How to Run the Project

Once installed and configured, you need to start both servers.

**1. Start the Backend:**
Open your terminal, go to the `backend` folder, and run:
```bash
npm run dev
```
*(You should see: "Server running on port 5000" and "MongoDB Connected")*

**2. Start the Frontend:**
Open a second terminal, go to the `frontend` folder, and run:
```bash
npm run dev
```
*(You should see a Vite local link like `http://localhost:5173`)*

**3. Open the App:**
Ctrl+Click the `http://localhost:5173` link in your terminal to open the app in your browser!

---

## 🔑 9. Demo Accounts

If you have run the database seeder (or registered a new organization), you can use these roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | admin@example.com | `password123` |
| **Editor** | editor@example.com | `password123` |
| **Member** | member@example.com | `password123` |

*(Note: Ensure you run the `npm run seed` command in your backend directory if you want to automatically generate these accounts with sample data!)*

---

## 📍 10. How Geo-Fence Works

The Geo-Fencing system acts as a virtual boundary to guarantee employees are exactly where they claim to be.

1. **GPS Usage**: When a Member clicks "Punch In", their phone or browser asks for permission to read their GPS coordinates (Latitude & Longitude).
2. **Radius Checking**: The backend takes the employee's GPS coordinates and compares them against the coordinates of their assigned building/site.
3. **The Haversine Formula**: We use complex mathematical algorithms on the backend to accurately calculate the Earth's curvature and measure the exact distance (in meters) between the employee and the site.
4. **Validation Logic**: If the employee is within the allowed radius (e.g., 500 meters), the punch-in succeeds. If they are sitting at a coffee shop 2 miles away, the system actively rejects the punch-in!

---

## 📊 11. Reports & Exports

FieldTrack Pro offers a comprehensive Analytics Dashboard designed for HR and payroll.

- **Filters**: Quickly filter historical attendance data by "Daily", "Weekly", "Monthly", or a Custom Date Range.
- **Analytics**: Instantly view metrics like Total Punch-Ins, Active Sessions, and Daily Trends.
- **CSV Export**: Click a button to instantly download an Excel-friendly `.csv` spreadsheet containing raw payroll data.
- **PDF Export**: Generates a beautiful, styled, printable PDF document on-the-fly containing summary statistics and paginated data tables.

---

## 🛠 12. Troubleshooting Guide

**1. MongoDB Connection Error (`MongooseServerSelectionError`)**
* **Fix**: Ensure your IP Address is whitelisted in MongoDB Atlas under "Network Access". If using local MongoDB, ensure the MongoDB service is running on your PC.

**2. CORS Issues / Frontend Cannot Connect**
* **Fix**: Ensure your `VITE_API_URL` exactly matches where your backend is running. Ensure your backend `CLIENT_URL` exactly matches your frontend Vite port.

**3. Geolocation / GPS Not Working**
* **Fix**: Browsers block GPS access on `http://` sites unless it is exactly `localhost`. Ensure you are testing on `http://localhost` or a secure `https://` domain.

**4. NPM Install Errors (`node-gyp` or permission issues)**
* **Fix**: Try running `npm cache clean --force` and then `npm install`. Ensure your Node.js version is at least v18.

**5. Live Map Tracking Not Updating**
* **Fix**: The frontend relies on Socket.IO for live updates. Ensure no firewall is blocking WebSocket connections on port 5000.

---

## ☁️ 13. Deployment Guide

Ready to go live? Here is how to deploy:

### Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to Network Access and allow access from anywhere (`0.0.0.0/0`).
3. Get your connection string and save it for the backend.

### Backend (Render / Heroku)
1. Push your code to GitHub.
2. Go to [Render](https://render.com/) and create a "New Web Service".
3. Connect your repository and select the `backend` folder as the Root Directory.
4. Set the start command to `node src/index.js`.
5. Add your Environment Variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` pointing to Vercel).

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and "Add New Project".
2. Connect your repository.
3. Select `frontend` as the Root Directory.
4. Add the Environment Variable `VITE_API_URL` pointing to your new Render Backend URL.
5. Click Deploy!

---

## 🔮 14. Future Improvements

While this MVP is production-ready, future iterations will include:
- 📱 **Native Mobile App**: React Native apps for iOS and Android for better background tracking.
- 🔔 **Push Notifications**: Real-time alerts for Supervisors when someone breaches a Geo-Fence.
- 🤖 **AI Insights**: Machine learning to identify irregular attendance patterns or predict workforce shortages.
- 🏢 **Multi-Tenancy Subscriptions**: Self-serve billing using Stripe for companies to register independently.

---

## 📄 15. License & Author

**Author**: FieldTrack Pro Team  
**GitHub**: [@yourusername](https://github.com/yourusername)

This project is licensed under the MIT License - feel free to use it, modify it, and build upon it!

<div align="center">
  <i>Built with ❤️ for modern field operations.</i>
</div>
