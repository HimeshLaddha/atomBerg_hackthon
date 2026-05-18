# GoalSync Portal — Enterprise Performance & Goal Alignment System

> **Built for AtomBerg Hackathon 2026** · Full-Stack MERN · Role-Based · Quarter-Aware · Session-Authenticated

[![GitHub](https://img.shields.io/badge/GitHub-HimeshLaddha%2FatomBerg__hackthon-blue?logo=github)](https://github.com/HimeshLaddha/atomBerg_hackthon)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live Demo & Repository](#-live-demo--repository)
3. [Login & Authentication](#-login--authentication)
4. [System Design & Architecture](#-system-design--architecture)
5. [Tech Stack](#-tech-stack)
6. [Project Structure](#-project-structure)
7. [Data Models](#-data-models)
8. [API Reference](#-api-reference)
9. [Feature Breakdown](#-feature-breakdown)
10. [Progress Math Engine](#-progress-math-engine-uom-formulas)
11. [Role-Based Flow](#-role-based-flow)
12. [Setup & Installation](#-setup--installation)
13. [Seeding the Database](#-seeding-the-database)
14. [Environment Variables](#-environment-variables)

---

## 🚀 Project Overview

**GoalSync Portal** is a production-grade, full-stack Goal Setting & Performance Tracking application built for an organizational hierarchy. It enables employees, managers, and HR admins to manage the complete lifecycle of performance goals — from initial drafting through quarterly execution tracking to governance reporting.

The portal features a professional **split-panel login gateway** with session persistence, allowing instant persona switching via quick-access profile cards or traditional credential entry.

### Core Capabilities

| Capability | Description |
|---|---|
| 🔐 **Session Login** | Split-panel login page with credential form + 3 quick-access persona cards |
| 🎯 **Goal Drafting** | Employees draft goals (max 8, each ≥10%, summing to 100% weightage) |
| ✅ **Manager Approval** | L1 Managers review, edit inline, and lock approved goal sheets |
| 📊 **Quarterly Tracking** | Locked sheets get a Q1–Q4 progress log grid with live math engine |
| 📡 **Shared KPI Broadcast** | HR Admin pushes org-wide KPIs with read-only field enforcement |
| ⚠ **Escalation Simulation** | Rule-based engine flags delayed submissions and pending approvals |
| 📈 **Analytics Dashboard** | Goal distribution by Thrust Area and UoM + Manager effectiveness ranking |
| 📋 **Audit Trail** | Every post-lock mutation is captured in a structured AuditLog collection |
| 📥 **CSV Export** | One-click achievement report download with computed progress scores |

---

## 🔗 Live Demo & Repository

| Resource | Link |
|---|---|
| **GitHub Repository** | [github.com/HimeshLaddha/atomBerg_hackthon](https://github.com/HimeshLaddha/atomBerg_hackthon) |
| **Frontend** (local) | `http://localhost:5173` |
| **Backend API** (local) | `http://localhost:5000` |
| **Login Gateway** | `http://localhost:5173/login` |

---

## 🔐 Login & Authentication

The portal uses a **client-side session simulation** — no real authentication server is required. The login system is fully self-contained within the React frontend.

### Login Page Layout

The login page (`/login`) is a dark-themed, split-panel interface:

```
┌────────────────────────┬──────────────────────────────────────┐
│                        │  ● QUICK ACCESS · DEMO PROFILES      │
│   GoalSync             │                                       │
│   Enterprise Portal    │  Select a profile to launch directly  │
│                        │                                       │
│   Welcome back         │  ┌──────────────────────────────┐    │
│                        │  │ JD  John Doe  [Employee]     │    │
│   USERNAME             │  │     Software Engineer        │    │
│   [john.doe        ]   │  │     EMP-003  Phase 1&2       │    │
│                        │  └──────────────────────────────┘    │
│   PASSWORD             │  ┌──────────────────────────────┐    │
│   [••••••••    👁  ]   │  │ JS  Jane Smith [Manager]     │    │
│                        │  │     Engineering Manager       │    │
│   [ Sign In ]          │  │     EMP-002  Approvals       │    │
│                        │  └──────────────────────────────┘    │
│                        │  ┌──────────────────────────────┐    │
│                        │  │ AR  Alex Rivera [Admin]      │    │
│                        │  │     HR Director               │    │
│                        │  │     EMP-001  KPI/Audit       │    │
│                        │  └──────────────────────────────┘    │
│                        │                                       │
│                        │  CREDENTIAL REFERENCE                 │
│                        │  John · Jane · Alex usernames & pass  │
└────────────────────────┴──────────────────────────────────────┘
```

### Demo Credentials (Primary Persona Mappings)

| Name | Username | Password | Role | ID | Department | Focus / Sandbox Tab |
|---|---|---|---|---|---|---|
| **John Doe** | `john.doe` | `emp@2026` | Employee | `EMP-003` | Engineering | Phase 1 & 2 Goal Tracking |
| **Jane Smith** | `jane.smith` | `mgr@2026` | Manager | `EMP-002` | Engineering | Approvals & Quarterly Check-ins |
| **Alex Rivera** | `alex.rivera` | `adm@2026` | Admin | `EMP-001` | Human Resources | Shared KPIs, Escalations, Analytics & Audit |

### How to Log In

**Option A — Credential Form (left panel):**
1. Type a username (e.g. `jane.smith`) and password (`mgr@2026`)
2. Click **Sign In** → validates credentials → redirects to `/dashboard`

**Option B — Quick-Login Card (right panel):**
1. Click any persona card → instant login, no form needed

**Option C — Fill Form button:**
1. Click **Fill form** on a card → auto-populates the left form fields
2. Then click **Sign In** to proceed

### Session Behaviour

| Behaviour | Detail |
|---|---|
| **Persistence** | Session is saved to `localStorage` (`goalsync_session` key) — survives page refresh |
| **Route protection** | Direct access to `/dashboard` without a session bounces back to `/login` |
| **Smart redirect** | `/dashboard` automatically routes to the correct role view (Employee / Manager / Admin) |
| **Log Out** | Navbar shows avatar badge + **Log Out** button when signed in; clears session and returns to `/login` |
| **Catch-all** | Any unmatched URL falls back to `/login` |

### Navbar — Authenticated State

When a session is active the role-dropdown is replaced by:

```
[ GoalSync ] ─────────────── [ Signed in as John Doe ]  [ JD avatar ]  [ 🚪 Log Out ]
```

Clicking **Log Out** purges the session context and localStorage, then redirects to `/login`.

---

## 🏗 System Design & Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT (React + Vite)                  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  /login  — Split-panel Login Gateway (public route)     │     │
│  │  Credential Form  |  Quick-Access Persona Cards (×3)    │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                             │ login() → sessionUser → navigate    │
│  ┌─────────────────────────▼───────────────────────────────┐     │
│  │  Global Top Navigation Bar (RoleSwitcher.jsx)            │     │
│  │  [Authenticated]  Avatar Badge · Log Out                 │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                             │                                      │
│         ┌───────────────────┼───────────────────┐                │
│         ▼                   ▼                   ▼                │
│   [ Employee ]         [ Manager ]          [ Admin/HR ]         │
│         │                   │                   │                │
│    ┌────┴────┐          ┌────┴────┐         ┌───┴────────┐       │
│    ▼         ▼          ▼         ▼         ▼            ▼       │
│  No Sheet  Sheet     Approvals  Check-in  KPI Broadcast  Audit   │
│  Phase 1   Phase 2   Queue     Workspace  Analytics     Trail    │
│  Form      Q1-Q4     (Inline   (Target    Escalation    CSV      │
│            Grid      Review)   vs Actual) Monitor       Export   │
└──────────────────────────────────────────────────────────────────┘
                               │ REST API
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                      │
│                                                                    │
│   /api/goals     →  Goal CRUD, Submit, Approve, Quarterly        │
│   /api/users     →  User lookup                                   │
│                                                                    │
│   Middleware: CORS · JSON Parser · Audit Logger Helper            │
│   Utils:      goalSanitizer.js · auditLogger.js                   │
└──────────────────────────────────────────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MongoDB (Database)                             │
│                                                                    │
│   Collections:  users · goalsheets · auditlogs                   │
└──────────────────────────────────────────────────────────────────┘
```

### State Machine — GoalSheet Lifecycle

```
                    ┌──────────────┐
        Employee    │    DRAFT     │  ← Save Draft (no validation)
        creates  →  └──────┬───────┘
                           │ Submit for Approval
                           │ (validates: max 8, 100% total, each ≥10%)
                           ▼
                    ┌──────────────┐
                    │  PENDING_    │  ← Manager sees in Approvals Queue
                    │  APPROVAL    │
                    └──────┬───────┘
                    ┌──────┴───────┐
                    │              │
                    ▼              ▼
             Manager          Manager
             Approves         Returns
                │                │
                ▼                ▼
         ┌──────────────┐   ┌──────────┐
         │   APPROVED   │   │  DRAFT   │
         │ isLocked:true│   │(reworked)│
         └──────┬───────┘   └──────────┘
                │
                ▼ Employee logs Q1–Q4 actuals
         ┌──────────────────────────────────┐
         │   Quarterly Progress Tracking    │
         │   Q1 → Q2 → Q3 → Q4             │
         │   Live UoM Math Engine           │
         │   Manager Check-in Comments      │
         │   AuditLog on every change       │
         └──────────────────────────────────┘
```

### Organizational Hierarchy

```
        Alex Rivera (ADM-2026-001)    Admin/HR Role
              │
        Jane Smith  (MGR-2026-042)    Manager (L1) Role
         ┌────┴────┐
         │         │
   John Doe        (additional employees)    Employee Role
 (EMP-2026-881)
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 (Vite) | Component-based SPA |
| **Styling** | Tailwind CSS v4 | Utility-first premium UI |
| **State Management** | React Context API | Session + role state across app |
| **HTTP Client** | Axios | REST API communication |
| **Routing** | React Router v7 | Client-side navigation + route protection |
| **Backend Framework** | Node.js + Express 5 | REST API server |
| **ODM** | Mongoose 9 | MongoDB schema & queries |
| **Database** | MongoDB | Document store |
| **Dev Server** | Nodemon | Hot-reload during dev |
| **Build Tool** | Vite 8 | Lightning-fast HMR |

---

## 📁 Project Structure

```
atomBerg_hackthon/
├── backend/
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   ├── .env                         # MONGODB_URI, PORT
│   └── src/
│       ├── models/
│       │   ├── User.js              # User schema (Employee/Manager/Admin)
│       │   ├── GoalSheet.js         # GoalSheet + quarterlyAchievements schema
│       │   └── AuditLog.js          # Post-lock mutation log schema
│       ├── routes/
│       │   ├── goalRoutes.js        # All /api/goals/* endpoints
│       │   └── userRoutes.js        # /api/users/* endpoints
│       └── utils/
│           ├── seed.js              # DB wipe + seed script
│           ├── auditLogger.js       # Centralized appendAuditLog() helper
│           └── goalSanitizer.js     # Ensures quarterlyAchievements always an object
│
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx                 # React app mount
        ├── App.jsx                  # Router config + ProtectedRoute + DashboardDispatcher
        ├── contexts/
        │   └── UserContext.jsx      # Session login/logout + legacy role-switcher state
        ├── components/layout/
        │   ├── Layout.jsx           # Shell: Header + Sidebar + Outlet
        │   ├── RoleSwitcher.jsx     # Navbar: avatar+logout (auth) or dropdown (dev)
        │   └── Sidebar.jsx          # Role-aware nav links + flow reference key
        ├── pages/
        │   ├── Login.jsx                  # ★ Split-panel login gateway (NEW)
        │   ├── EmployeeDashboard.jsx      # Conditional router (Phase 1 vs Phase 2)
        │   ├── EmployeeGoalForm.jsx       # Phase 1: Draft & Submit form
        │   ├── EmployeeTracking.jsx       # Phase 2: Q1–Q4 quarterly tracking grid
        │   ├── ManagerDashboard.jsx       # Manager home: Approvals + Check-ins tabs
        │   ├── ManagerReview.jsx          # Inline goal review & approve/return
        │   ├── ManagerTrackingReview.jsx  # Side-by-side Target vs Actual + comments
        │   ├── AdminPanel.jsx             # Full governance panel (5 tabs)
        │   └── AdminOverview.jsx          # Admin landing page
        └── utils/
            ├── progressEngine.js    # UoM formula calculator (4 types)
            └── csvExporter.js       # Native browser blob CSV download
```

### Key Files Added / Modified (Login Feature)

| File | Change |
|---|---|
| `src/pages/Login.jsx` | **New** — split-panel login UI with form + persona cards |
| `src/contexts/UserContext.jsx` | Added `login()`, `logout()`, `sessionUser`, `isAuthenticated` |
| `src/App.jsx` | Added `/login` route, `ProtectedRoute`, `DashboardDispatcher` |
| `src/components/layout/RoleSwitcher.jsx` | Session-aware navbar: avatar+logout vs dropdown |

---

## 📐 Data Models

### User

```js
{
  userId:     String,   // e.g. "EMP-001" (human-readable ID)
  name:       String,
  email:      String,
  role:       String,   // "Employee" | "Manager" | "Admin"
  managerId:  ObjectId, // ref → User (null for Admin)
  department: String
}
```

### GoalSheet

```js
{
  employeeId: ObjectId,    // ref → User
  cycle:      String,      // "2026-H1"
  status:     String,      // "Draft" | "Pending_Approval" | "Approved"
  isLocked:   Boolean,     // true once Manager approves
  goals: [{
    goalId:      String,
    thrustArea:  String,
    title:       String,
    description: String,
    uomType:     String,   // See UoM types below
    target:      String,   // Stored as string to handle dates & numbers
    weightage:   Number,   // 10–100, all goals must sum to 100
    isShared:    Boolean,  // true = HR-pushed KPI (Title/Target read-only)
    quarterlyAchievements: {
      Q1: { actualAchievement: String, status: String, managerComment: String },
      Q2: { actualAchievement: String, status: String, managerComment: String },
      Q3: { actualAchievement: String, status: String, managerComment: String },
      Q4: { actualAchievement: String, status: String, managerComment: String }
    }
  }]
}
```

### AuditLog

```js
{
  goalSheetId: ObjectId,   // ref → GoalSheet
  changedBy:   ObjectId,   // ref → User
  timestamp:   Date,
  changes: [{
    field:    String,      // e.g. "goals[Sales Target].Q1.actualAchievement"
    oldValue: String,
    newValue: String
  }]
}
```

---

## 📡 API Reference

### Goals

| Method | Endpoint | Auth Role | Description |
|---|---|---|---|
| `GET` | `/api/goals?userId=` | Employee | Check if sheet exists; returns `{ exists: false }` if not |
| `GET` | `/api/goals/team/subordinates?managerId=` | Manager | All direct reports + their GoalSheet status |
| `GET` | `/api/goals/pending?managerId=` | Manager | All `Pending_Approval` sheets for direct reports |
| `GET` | `/api/goals/team-approved?managerId=` | Manager | All `Approved` sheets for check-in workspace |
| `GET` | `/api/goals/approved` | Admin | All approved sheets org-wide |
| `GET` | `/api/goals/audit` | Admin | Full AuditLog with populated references |
| `POST` | `/api/goals/save` | Employee | Save draft (no business rule validation) |
| `POST` | `/api/goals/submit` | Employee | Submit for approval (validates: max 8, 100%, ≥10%) |
| `POST` | `/api/goals/approve` | Manager | Approve sheet → `isLocked: true` |
| `PUT` | `/api/goals/review/:sheetId` | Manager | Inline edit + approve or return for rework |
| `PUT` | `/api/goals/quarterly/:sheetId` | Employee | Log actual achievement for a specific quarter |
| `PUT` | `/api/goals/manager-checkin/:sheetId` | Manager | Add quarterly comment on employee's goal |
| `POST` | `/api/goals/shared-kpi` | Admin | Push shared KPI to all employees in a department |

### Submit Validation Rules (server-enforced)

```
✅ goals.length <= 8
✅ sum(weightage) === 100%
✅ every goal.weightage >= 10%
```

---

## ✨ Feature Breakdown

### Login Gateway (NEW)

- **Split-panel layout**: credential form (left) + 3 persona cards (right)
- **Credential form**: username/password inputs, show/hide password toggle, error state, loading spinner
- **Persona cards**: click to instant-login; "Fill form" button auto-populates credentials into the form
- **Credential reference strip**: all usernames & passwords displayed at a glance
- **Session persistence**: `localStorage` key `goalsync_session` — survives refresh
- **Route protection**: `ProtectedRoute` wrapper bounces unauthenticated routes back to `/login`
- **Smart dashboard dispatch**: `/dashboard` redirects to the correct view by role
- **Log Out**: purges session from state + localStorage, redirects to `/login`

### Phase 1 — Goal Drafting (Employee)

- **Employee Dashboard** (`EmployeeDashboard.jsx`) acts as a conditional router:
  - Calls `GET /api/goals?userId=` on mount
  - `{ exists: false }` → renders `EmployeeGoalForm` (Phase 1)
  - Sheet exists → renders `EmployeeTracking` (Phase 2) or status banners
- **Save Draft**: persists without any validation — employees can iterate freely
- **Submit for Approval**: triggers server-side rule checks before transitioning status
- **Shared KPI lock**: Goals with `isShared: true` render Thrust Area, Title, and UoM as read-only — only **Weightage** is editable

### Phase 2 — Quarterly Tracking (Employee)

- Four-tab navigation bar: `Q1 Progress`, `Q2 Progress`, `Q3 Progress`, `Q4 Progress`
- Per-goal card with read-only identity fields (Thrust Area, Title, Target, Weightage)
- **Actual Achievement** input + **Status Selection** dropdown (Not Started / On Track / Completed)
- Live **Progress Score** bar updates as user types — powered by `progressEngine.js`
- **Save Progress** surgically updates only the specific quarter field via MongoDB `$set`

### Manager Approval Workspace

- **Phase 1 Tab**: Lists all `Pending_Approval` sheets. Manager can edit Target and Weightage inline (must maintain 100% total) before approving
- **Approve & Lock**: Locks the sheet (`isLocked: true`), writes AuditLog entry
- **Return for Rework**: Resets status to `Draft` for employee revision
- **Phase 2 Tab**: Lists all approved sheets. Side-by-side Target vs Actual grid with manager comment log per quarter

### Admin Governance Panel (5 tabs)

| Tab | Functionality |
|---|---|
| 📡 Shared KPI | Form to broadcast a KPI to all employees in a department |
| 📊 Execution Matrix | Organization-wide approval status table + **Export Achievement Report** button |
| ⚠ Escalation Tracker | Simulate timeline delays (1–15 days) to flag overdue submissions |
| 📈 Analytics | Goal distribution by Thrust Area + UoM; Manager Effectiveness Ranking grid |
| 🔍 Audit Trail | Full chronological log of every post-lock field change |

---

## 🧮 Progress Math Engine (UoM Formulas)

File: `frontend/src/utils/progressEngine.js`

| UoM Type | Direction | Formula | Example |
|---|---|---|---|
| `Numeric_Min` / `Percentage_Min` | Higher is better | `(achievement ÷ target) × 100` | Achieve 4000 of 5000 → **80%** |
| `Numeric_Max` / `Percentage_Max` | Lower is better | `(target ÷ achievement) × 100` | 6 bugs vs max 10 → **167% → capped 100%** |
| `Zero-based` | Zero = success | `achievement === 0 ? 100 : 0` | 0 incidents → **100%** |
| `Timeline` | On-time = success | Proportional date delta | Delivered before deadline → **100%** |

**Edge-case protections:**
- Division by zero → returns `0` (never throws)
- Empty input → returns `0`
- All results clamped to `[0, 100]`

---

## 🔄 Role-Based Flow

### Complete End-to-End Journey

```
0. Landing
   └─ Navigate to http://localhost:5173 → redirects to /login
   └─ Click "John Doe" card or type john.doe / emp@2026 → Sign In
   └─ Redirected to /employee/goals (Employee dashboard)
   └─ Navbar shows: "Signed in as John Doe" | [JD] | [Log Out]

1. Employee (John Doe) — Phase 1
   └─ No sheet → Phase 1 Form appears
   └─ Fills goals (max 8, each ≥10%, total = 100%)
   └─ "Save Draft" → persists without validation
   └─ "Submit for Approval" → server validates → status: Pending_Approval

2. Manager (Jane Smith) — Approval
   └─ Log Out → Login as Jane Smith (MGR-2026-042)
   └─ Approvals Queue tab shows pending sheet
   └─ Reviews goals inline (can adjust Target & Weightage)
   └─ "Approve & Lock" → status: Approved, isLocked: true
      OR
   └─ "Return for Rework" → status: Draft (back to employee)

3. Employee (John Doe) — Phase 2 Tracking
   └─ Log back in as John Doe
   └─ Sheet exists + isLocked → Phase 2 Tracking Grid
   └─ Selects Q1 tab → enters Actual Achievement
   └─ Live progress meter shows UoM-calculated score
   └─ "Save Progress" → MongoDB $set surgical update → AuditLog entry

4. Manager (Jane Smith) — Check-ins
   └─ Sees all approved sheets with Q1-Q4 actuals
   └─ Adds manager comments per goal per quarter

5. Admin (Alex Rivera) — Governance
   └─ Login as Alex Rivera (ADM-2026-001)
   └─ Broadcasts shared KPI to Engineering dept
   └─ Exports full Achievement Report as CSV
   └─ Runs escalation simulation (5 Days Past Due)
   └─ Views audit trail of all post-lock changes
```

---

## 📦 Setup & Installation

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or MongoDB Atlas)
- npm ≥ 9

### 1. Clone the Repository

```bash
git clone https://github.com/HimeshLaddha/atomBerg_hackthon.git
cd atomBerg_hackthon
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` in `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/goal-tracking-portal
PORT=5000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Start Development Servers

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev       # runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev       # runs on http://localhost:5173
```

Then open `http://localhost:5173` — you'll land on the login page automatically.

---

## 🌱 Seeding the Database

The seed script wipes all collections and inserts a clean organizational hierarchy:

```bash
cd backend
npm run seed
```

**What it creates (Total 17 users):**

| Core Seeded User | ID | Role | Reports To | Department |
|---|---|---|---|---|
| **Alex Rivera** | `EMP-001` | Admin/HR | — | Human Resources |
| **Jane Smith** | `EMP-002` | Manager (L1) | Alex Rivera | Engineering |
| **John Doe** | `EMP-003` | Employee | Jane Smith | Engineering |
| **Diana Employee** | `EMP-004` | Employee | Jane Smith | Engineering |

*Also seeds 13 additional accounts (Priya Kapoor, Sam O'Brien, Bob Martinez, Nina Patel, Raj Mehta, and employees across Sales, Marketing, and Finance) to test org-wide analytics and escalations.*

Also pre-populates:
1. **Goal Sheet for John Doe (`EMP-003`):** Approved & locked state featuring fully pre-tracked actuals and manager comments for Q1–Q4 across all UoM math types (Numeric, Percentage, Zero-based, Timeline).
2. **Goal Sheet for Diana Employee (`EMP-004`):** In a `Pending_Approval` state to allow immediate testing of manager inline reviews and approval routing.
3. **Goal Sheet for Charlie Employee (`EMP-003`):** Re-mapped cleanly to John Doe (`EMP-003`) to ensure absolute session sync.

> **Note:** The login portal quick-access cards and the full credentials reference strip are mapped directly to these database records, providing a zero-friction playground for evaluators.

---

## 🔐 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/goal-tracking-portal` | MongoDB connection string |
| `PORT` | `5000` | Express server port |

> **Note:** For production, replace with a MongoDB Atlas URI and set appropriate CORS origins.

---

## 🧪 Known Constraints (Hackathon MVP)

| Constraint | Reason |
|---|---|
| Client-side session only | No JWT/OAuth server — sessions live in `localStorage` |
| Single active cycle (`2026-H1`) | Multi-cycle support would require a Cycle Manager service |
| Escalation engine uses mock data | Real-time data would require WebSocket or polling |
| Single manager per employee | Hierarchy supports one `managerId` reference |

---

## 🏆 Built By

**Himesh Laddha** — [github.com/HimeshLaddha](https://github.com/HimeshLaddha)

*Submitted for the AtomBerg Hackathon 2026*

---

<p align="center">
  <strong>GoalSync Portal</strong> · MIT License · 2026
</p>
