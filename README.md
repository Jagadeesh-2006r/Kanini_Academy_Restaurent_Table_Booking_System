# 🍽️ Savoria Bistro | Restaurant Table Reservation System

A production-grade, full-stack **Restaurant Table Reservation Web Application** built with **React.js (Vite)**, **Node.js (Express)**, **PostgreSQL 18**, and **Prisma ORM**.

This system features **three distinct user roles** (Customer, Staff, and Administrator), real-time availability calculation, **smart automatic smallest-table allocation**, ACID-compliant transaction concurrency locks to eliminate double bookings, and dynamic PDF pass generation.

---

## 📌 Table of Contents
- [1. Technology Stack](#1-technology-stack)
- [2. System Architecture & ER Design](#2-system-architecture--er-design)
- [3. Key Business Rules & Automatic Table Allocation Algorithm](#3-key-business-rules--automatic-table-allocation-algorithm)
- [4. Project Folder Structure](#4-project-folder-structure)
- [5. Database Setup (PostgreSQL & Prisma)](#5-database-setup-postgresql--prisma)
- [6. Environment Variable Configuration](#6-environment-variable-configuration)
- [7. Installation & Running Locally](#7-installation--running-locally)
- [8. Initial Database Seed & Demo Credentials](#8-initial-database-seed--demo-credentials)
- [9. REST API Endpoint Reference](#9-rest-api-endpoint-reference)
- [10. Postman Testing Guide](#10-postman-testing-guide)
- [11. College Project Demonstration & Evaluation Guide](#11-college-project-demonstration--evaluation-guide)

---

## 1. Technology Stack

### Frontend
- **Framework:** React.js (v18) with Vite
- **Styling:** Bootstrap 5.3 + Bootstrap Icons + Custom Savoria Warm-Charcoal/Gold Luxury Theme
- **Routing:** React Router DOM (v6) with Protected Role-Based Routes
- **HTTP Client:** Axios with dynamic JWT interceptors
- **PDF Generation:** jsPDF & jsPDF-AutoTable

### Backend
- **Runtime:** Node.js (ES Modules)
- **Web Framework:** Express.js
- **Authentication:** JSON Web Tokens (JWT) & bcrypt password hashing
- **Validation:** Express-Validator
- **Logging:** Morgan HTTP logger with timestamps

### Database & Persistence
- **Relational Database:** PostgreSQL 18
- **ORM:** Prisma ORM (v5.22)
- **Transactions:** Isolation via `prisma.$transaction()` with concurrency locks

---

## 2. System Architecture & ER Design

### Database Relational Schema

```mermaid
erDiagram
    users ||--o{ reservations : "places"
    users ||--o{ notifications : "receives"
    branches ||--o{ restaurant_tables : "contains"
    branches ||--o{ reservations : "hosts"
    branches ||--o{ users : "employs (staff)"
    restaurant_tables ||--o{ reservations : "allocated_to"
    reservations ||--o{ notifications : "triggers"
    reservations ||--o{ reservation_audit_logs : "records"

    users {
        int id PK
        string name
        string email UK
        string phone
        string password
        enum role "CUSTOMER, STAFF, ADMIN"
        int branchId FK
        boolean active
        datetime createdAt
    }

    branches {
        int id PK
        string branchName
        string address
        string openingTime
        string closingTime
        int slotLength "default 90 mins"
        boolean active
    }

    restaurant_tables {
        int id PK
        int branchId FK
        string tableNumber
        enum seatingArea "INDOOR, OUTDOOR"
        int capacity
        boolean active
    }

    reservations {
        int id PK
        string referenceNumber UK
        int customerId FK
        int branchId FK
        int tableId FK
        date reservationDate
        string startTime
        string endTime
        int partySize
        string specialRequest
        enum status "BOOKED, CANCELLED, COMPLETED"
    }

    notifications {
        int id PK
        int userId FK
        int reservationId FK
        string message
        boolean isRead
        datetime createdAt
    }

    reservation_audit_logs {
        int id PK
        int reservationId FK
        string action "CREATED, CANCELLED, MODIFIED"
        string oldValue
        string newValue
        datetime createdAt
    }
```

---

## 3. Key Business Rules & Automatic Table Allocation Algorithm

### 1. Smallest Available Table Allocation
1. When a customer requests a branch, date, start time, and party size:
2. The backend retrieves all active tables belonging to that branch where `capacity >= partySize` (and matching `seatingArea` if preferred).
3. The system sorts suitable tables by `capacity ASC`, then by `tableNumber ASC`.
4. Overlapping reservations (`existingStart < newEnd && existingEnd > newStart`) with status `BOOKED` are checked.
5. The **first available table** (the smallest table fitting the party) is allocated.
6. If all tables fitting the group are occupied, the booking request is safely rejected with HTTP 409: *"Sorry, no suitable table is available for the selected time."*

### 2. Double-Booking Prevention & Concurrency Control
- Table allocation and reservation insertion occur inside an ACID transaction (`prisma.$transaction`).
- Overlapping bookings for the same table and time slot cannot succeed concurrently.
- Rejection responses are returned with descriptive error messages.

### 3. Date & Operating Rules
- Customers can book from the next available slot up to **30 days in advance**.
- Past dates or elapsed time slots on the current day are strictly rejected with HTTP 400.
- A customer can hold **only one active reservation per branch per day** (duplicate attempts return HTTP 409).
- Cancelled reservations immediately release the allocated table for other guests.
- Reference number format: `RES-YYYYMMDD-0001` with incrementing sequences per date.

---

## 4. Project Folder Structure

```
kanini_academy/
├── package.json                   # Root workspace orchestration scripts
├── .env.example                   # Master environment template
├── .gitignore                     # Git ignore rules (node_modules, .env, dist)
├── postman_collection.json        # Postman test collection
├── README.md                      # Complete system documentation
├── DESIGN_WRITEUP.md              # Academic write-up for jury evaluation
│
├── backend/                       # Express + Prisma + PostgreSQL
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL Relational Schema
│   │   └── seed.js                # Database Seeder (Admin, Branches, Tables, Staff)
│   └── src/
│       ├── config/
│       │   └── prisma.js          # Prisma Client singleton
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── branchController.js
│       │   ├── tableController.js
│       │   ├── availabilityController.js
│       │   ├── reservationController.js
│       │   ├── staffController.js
│       │   ├── adminController.js
│       │   └── notificationController.js
│       ├── middleware/
│       │   ├── authMiddleware.js   # JWT verification & RBAC
│       │   ├── optionalAuth.js
│       │   └── errorHandler.js    # Global error handler (no leaked stack traces)
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── branchRoutes.js
│       │   ├── tableRoutes.js
│       │   ├── availabilityRoutes.js
│       │   ├── reservationRoutes.js
│       │   ├── staffRoutes.js
│       │   ├── adminRoutes.js
│       │   └── notificationRoutes.js
│       ├── services/
│       │   └── reservationService.js
│       ├── utils/
│       │   ├── jwt.js
│       │   └── password.js
│       ├── validators/
│       │   └── authValidators.js
│       ├── app.js
│       └── server.js
│
└── frontend/                      # React.js + Vite + Bootstrap 5
    ├── package.json
    ├── vite.config.js             # API proxy to http://localhost:5000
    ├── index.html
    └── src/
        ├── components/
        │   ├── Navbar.jsx         # Dynamic role-based header
        │   ├── Footer.jsx
        │   └── ProtectedRoute.jsx # Role router guard
        ├── context/
        │   └── AuthContext.jsx    # Authentication & User state
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── AboutPage.jsx
        │   ├── BranchListPage.jsx
        │   ├── BranchDetailPage.jsx
        │   ├── LoginPage.jsx       # With 1-click jury demo logins
        │   ├── RegisterPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── CustomerDashboard.jsx
        │   ├── NewReservationPage.jsx
        │   ├── MyReservationsPage.jsx
        │   ├── ReservationConfirmationPage.jsx
        │   ├── StaffDashboard.jsx
        │   ├── StaffTodayPage.jsx
        │   ├── AdminDashboard.jsx
        │   ├── ManageBranchesPage.jsx
        │   ├── ManageTablesPage.jsx
        │   ├── ManageStaffPage.jsx
        │   ├── AllReservationsPage.jsx
        │   └── ReportsPage.jsx
        ├── services/
        │   └── api.js             # Axios instance with auth interceptor
        ├── styles/
        │   └── custom.css         # Premium bistro theme
        ├── utils/
        │   └── pdfGenerator.js    # jsPDF pass generator
        ├── App.jsx
        └── main.jsx
```

---

## 5. Database Setup (PostgreSQL & Prisma)

### 1. Ensure PostgreSQL is Running
PostgreSQL 18 is running locally on port `5432`.

Create the database in PostgreSQL if not already present:
```sql
CREATE DATABASE restaurant_reservation_db;
```

### 2. Push Prisma Schema to PostgreSQL
Run from `backend/`:
```bash
cd backend
npx prisma db push
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

---

## 6. Environment Variable Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:jaga0607@localhost:5432/restaurant_reservation_db?schema=public"
JWT_SECRET=super_secret_jwt_token_key_restaurant_2026_xyz
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

---

## 7. Installation & Running Locally

### Step 1: Install Dependencies
From root directory:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Seed Initial Database Data
```bash
cd backend
npm run seed
```

### Step 3: Start the Backend Server
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### Step 4: Start the Frontend Application
Open a second terminal:
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 8. Initial Database Seed & Demo Credentials

The database seeder (`backend/prisma/seed.js`) provisions initial data:
- **1 Admin account**
- **2 Restaurant branches**
  - *Downtown Gourmet Hub* (100 Main Street)
  - *Seaside Terrace Bistro* (450 Ocean Boulevard)
- **10 Restaurant tables** distributed with capacities 2, 4, 6, 8, and 10 across Indoor and Outdoor areas.
- **2 Staff accounts** linked to their respective branches.
- **1 Sample customer account**.

### Demo Logins (Accessible with 1-Click on the Login Page)

| Role | Email | Password | Branch Assigned |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@restaurant.com` | `Admin@123` | *All Branches (Master Control)* |
| **Staff (Downtown)** | `staff.downtown@restaurant.com` | `Staff@123` | *Downtown Gourmet Hub* |
| **Staff (Seaside)** | `staff.seaside@restaurant.com` | `Staff@123` | *Seaside Terrace Bistro* |
| **Customer** | `customer@example.com` | `Customer@123` | *Customer Self-Service* |

---

## 9. REST API Endpoint Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer account (unique email) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name and contact phone |

### Branches (`/api/branches`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/branches` | Public | List active branches (search & location filters) |
| `GET` | `/api/branches/:id` | Public | Get branch details, operating hours, & table layout |
| `POST` | `/api/branches` | Admin | Create a new restaurant branch |
| `PUT` | `/api/branches/:id` | Admin | Update branch operating hours or address |
| `PATCH` | `/api/branches/:id/deactivate`| Admin | Toggle active/deactivated status |

### Tables (`/api/tables`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tables/:branchId` | Public/Staff | List tables for a specific branch |
| `POST` | `/api/tables` | Admin | Create a table (tableNumber, area, capacity) |
| `PUT` | `/api/tables/:id` | Admin | Update table details or seating area |
| `DELETE`| `/api/tables/:id` | Admin | Safe deletion or historical deactivation |

### Availability & Allocation (`/api/availability`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/availability` | Public | Query available time slots based on party size & date |

### Reservations (`/api/reservations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reservations` | Customer | Create booking with automatic smallest table allocation |
| `GET` | `/api/reservations/my` | Customer | Get customer's upcoming, past, and cancelled bookings |
| `GET` | `/api/reservations/:id` | Owner/Staff/Admin | Get detailed reservation record |
| `PUT` | `/api/reservations/:id` | Customer/Admin | Reschedule date, slot, or party size subject to availability |
| `PATCH`| `/api/reservations/:id/cancel`| Customer/Staff/Admin | Cancel booking and release table back to pool |

### Staff Operations (`/api/staff`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/staff/reservations` | Staff/Admin | View reservations for staff's assigned branch |
| `GET` | `/api/staff` | Admin | List all staff members |
| `POST` | `/api/staff` | Admin | Create new staff user and assign to branch |

### Admin Analytics (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/reservations` | Admin | Master reservation list with date, branch, and status filters |
| `GET` | `/api/admin/dashboard` | Admin | Summary metrics & branch-wise counts |
| `GET` | `/api/admin/reports` | Admin | Status distribution, seating area usage, & timeline |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Retrieve customer alerts and confirmations |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark notification as read |

---

## 10. Postman Testing Guide

A ready-to-import Postman Collection is included in the root directory: [`postman_collection.json`](./postman_collection.json).

### How to Import and Run:
1. Open Postman.
2. Click **Import** in the top-left corner.
3. Select `kanini_academy/postman_collection.json`.
4. Run the requests sequentially:
   - **Login - Admin**: Generates admin JWT.
   - **Login - Customer**: Generates customer JWT.
   - **Check Slot Availability**: Verify slot generation.
   - **Create Reservation**: Test automatic smallest table allocation.
   - **Double Booking Test**: Verify second booking on same slot receives conflict error or next table.
   - **Cancel Reservation**: Verify status changes to CANCELLED and table is freed.

---

## 11. College Project Demonstration & Evaluation Guide

When presenting to your college jury, follow this demonstration flow:

1. **Architecture & Tech Stack (Slide/Intro):**
   - Explain why PostgreSQL was chosen for ACID compliance and concurrency safety.
   - Point to Prisma ORM for relational modeling and migration management.
   - Demonstrate the modular 3-tier architecture (React Frontend -> Express Controller/Service -> PostgreSQL Database).

2. **Customer Walkthrough:**
   - Use the **1-Click Customer Demo** button on `/login` (Alice Johnson).
   - Show the Customer Dashboard with upcoming bookings and notifications.
   - Navigate to **Book Table**:
     - Pick a branch (e.g. *Downtown Gourmet Hub*).
     - Show the datepicker enforcing the 30-day window.
     - Select party size of 4 -> observe slots generated.
     - Book a slot -> observe automatic allocation of Table DT-03 (capacity 4).
     - Show the Confirmation Screen with reference code `RES-YYYYMMDD-0001`.
     - Click **Download PDF Pass** and show the generated PDF confirmation.

3. **Concurrency & Business Rule Defense:**
   - Attempt to book another table at the same branch on the same day -> show duplicate booking rejection.
   - Demonstrate double booking prevention: two customers requesting the same slot receive separate tables or an unavailable error once capacity is full.

4. **Staff Desk Walkthrough:**
   - Log in as **Downtown Staff** (`staff.downtown@restaurant.com`).
   - Show how staff only see reservations for *Downtown Gourmet Hub* (never Seaside Bistro).
   - View Today's Run-Sheet with guest names, phone numbers, and special requests.

5. **Admin Master Control Walkthrough:**
   - Log in as **Admin** (`admin@restaurant.com`).
   - Show the Executive Dashboard with live counts and branch summaries.
   - Navigate to **Manage Branches**: Add or deactivate a branch.
   - Navigate to **Manage Tables**: Configure indoor/outdoor capacities.
   - Navigate to **Manage Staff**: Create and assign a staff member to a branch.
   - Navigate to **Analytics & Reports**: Show reservation status breakdown and date timelines.

