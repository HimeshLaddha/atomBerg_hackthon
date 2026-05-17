# GoalSync Portal — In-House Goal Setting & Tracking System

> **Built for AtomBerg Hackathon 2026** · Full-Stack MERN · Role-Based · Quarter-Aware

[![GitHub](https://img.shields.io/badge/GitHub-HimeshLaddha%2FatomBerg__hackthon-blue?logo=github)](https://github.com/HimeshLaddha/atomBerg_hackthon)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live Demo & Repository](#-live-demo--repository)
3. [System Design & Architecture](#-system-design--architecture)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Data Models](#-data-models)
7. [API Reference](#-api-reference)
8. [Feature Breakdown](#-feature-breakdown)
9. [Progress Math Engine](#-progress-math-engine-uom-formulas)
10. [Role-Based Flow](#-role-based-flow)
11. [Setup & Installation](#-setup--installation)
12. [Seeding the Database](#-seeding-the-database)
13. [Environment Variables](#-environment-variables)

---

## 🚀 Project Overview

**GoalSync Portal** is a production-grade, full-stack Goal Setting & Performance Tracking application built for an organizational hierarchy. It enables employees, managers, and HR admins to manage the complete lifecycle of performance goals — from initial drafting to quarterly execution tracking and governance reporting.

### Core Capabilities

| Capability | Description |
|---|---|
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

---

## 🏗 System Design & Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT (React + Vite)                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Global Top Navigation Bar                      │    │
│  │         [ Evaluator Role Switcher Dropdown ]             │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│   [ Employee ]         [ Manager ]          [ Admin/HR ]        │
│         │                   │                   │               │
│    ┌────┴────┐          ┌────┴────┐         ┌───┴────────┐      │
│    ▼         ▼          ▼         ▼         ▼            ▼      │
│  No Sheet  Sheet     Approvals  Check-in  KPI Broadcast  Audit  │
│  Phase 1   Phase 2   Queue     Workspace  Analytics     Trail   │
│  Form      Q1-Q4     (Inline   (Target    Escalation    CSV     │
│            Grid      Review)   vs Actual) Monitor       Export  │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                     │
│                                                                   │
│   /api/goals     →  Goal CRUD, Submit, Approve, Quarterly        │
│   /api/users     →  User lookup                                  │
│                                                                   │
│   Middleware: CORS · JSON Parser · Audit Logger Helper           │
│   Utils:      goalSanitizer.js · auditLogger.js                  │
└─────────────────────────────────────────────────────────────────┘
                              │ Mongoose ODM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB (Database)                            │
│                                                                   │
│   Collections:  users · goalsheets · auditlogs                  │
└─────────────────────────────────────────────────────────────────┘
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
        Alice Admin (EMP-001)        Admin/HR Role
              │
        Bob Manager (EMP-002)        Manager (L1) Role
         ┌────┴────┐
         │         │
   Charlie (EMP-003)   Diana (EMP-004)   Employee Role
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 (Vite) | Component-based SPA |
| **Styling** | Tailwind CSS | Utility-first premium UI |
| **State Management** | React Context API | Role & user state across app |
| **HTTP Client** | Axios | REST API communication |
| **Routing** | React Router v6 | Client-side navigation |
| **Backend Framework** | Node.js + Express 5 | REST API server |
| **ODM** | Mongoose 9 | MongoDB schema & queries |
| **Database** | MongoDB | Document store |
| **Dev Server** | Nodemon | Hot-reload during dev |
| **Build Tool** | Vite | Lightning-fast HMR |

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
        ├── App.jsx                  # Router configuration
        ├── contexts/
        │   └── UserContext.jsx      # Role switcher state & mock user profiles
        ├── components/layout/
        │   ├── Layout.jsx           # Shell: Header + Sidebar + Outlet
        │   ├── RoleSwitcher.jsx     # Global top nav with dropdown switcher
        │   └── Sidebar.jsx          # Role-aware nav links + flow reference key
        ├── pages/
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
    field:    String,      // e.g. "goals["Sales Target"].Q1.actualAchievement"
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

### Phase 1 — Goal Drafting (Employee)

- **Employee Dashboard** (`EmployeeDashboard.jsx`) acts as a conditional router:
  - Calls `GET /api/goals?userId=` on mount
  - `{ exists: false }` → renders `EmployeeGoalForm` (Phase 1)
  - Sheet exists → renders `EmployeeTracking` (Phase 2) or status banners
- **Save Draft**: persists without any validation — employees can iterate freely
- **Submit for Approval**: triggers server-side rule checks before transitioning status
- **Shared KPI lock**: Goals with `isShared: true` render `Thrust Area`, `Title`, and `UoM` as read-only `<div>`s — only **Weightage** is editable

### Phase 2 — Quarterly Tracking (Employee)

- Four-tab navigation bar: `Q1 Progress`, `Q2 Progress`, `Q3 Progress`, `Q4 Progress`
- Per-goal card with read-only identity fields (Thrust Area, Title, Target, Weightage)
- **Actual Achievement** input + **Status Selection** dropdown (Not Started / On Track / Completed)
- Live **Progress Score** bar updates as user types — powered by `progressEngine.js`
- **Save Progress** surgically updates only the specific quarter field via MongoDB `$set` (prevents re-validation of other quarter fields)

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
| ⚠ Escalation Tracker | Simulate timeline delays (1–15 days) to flag overdue submissions with hierarchy trace |
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
- Backward-compat `calculateProgress` alias exported

---

## 🔄 Role-Based Flow

### Complete End-to-End Journey

```
1. Employee (EMP-003) logs in
   └─ No sheet → Phase 1 Form appears
   └─ Fills goals (max 8, each ≥10%, total = 100%)
   └─ "Save Draft" → persists without validation
   └─ "Submit for Approval" → server validates → status: Pending_Approval

2. Manager (EMP-002) logs in
   └─ Approvals Queue tab shows Charlie's sheet
   └─ Reviews goals inline (can adjust Target & Weightage)
   └─ "Approve & Lock" → status: Approved, isLocked: true
      OR
   └─ "Return for Rework" → status: Draft (back to employee)

3. Employee (EMP-003) after approval
   └─ Sheet exists + isLocked → Phase 2 Tracking Grid
   └─ Selects Q1 tab → enters Actual Achievement
   └─ Live progress meter shows UoM-calculated score
   └─ "Save Progress" → MongoDB $set surgical update → AuditLog entry

4. Manager (EMP-002) – Phase 2 Check-ins
   └─ Sees all approved sheets with Q1-Q4 actuals
   └─ Adds manager comments per goal per quarter

5. Admin (EMP-001)
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

---

## 🌱 Seeding the Database

The seed script wipes all collections and inserts a clean organizational hierarchy with correct data:

```bash
cd backend
npm run seed
```

**What it creates:**

| User | ID | Role | Reports To |
|---|---|---|---|
| Alice Admin | EMP-001 | Admin/HR | — |
| Bob Manager | EMP-002 | Manager (L1) | Alice |
| Charlie Employee | EMP-003 | Employee | Bob |
| Diana Employee | EMP-004 | Employee | Bob |

Also creates a **Draft GoalSheet** for Charlie with 2 goals (properly initialized `quarterlyAchievements` objects — no corrupt empty-string values).

**Test the full flow after seeding:**

```
1. Switch to Employee (EMP-003) → See Draft form
2. Click Submit for Approval
3. Switch to Manager (EMP-002) → See pending sheet → Approve & Lock
4. Switch back to Employee → See Q1–Q4 tracking grid
5. Enter actual achievement → See live progress score
6. Switch to Admin (EMP-001) → Export CSV
```

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
| Single active cycle (`2026-H1`) | Multi-cycle support would require a Cycle Manager service |
| Mock user authentication | Role switching via Context API (no JWT/sessions) |
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
