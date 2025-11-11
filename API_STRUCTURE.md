# Multi-Shop API Structure

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend/Postman)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   SWAGGER UI (/api-docs)                     │
│              Interactive API Documentation                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER (Port 5000)                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Rate Limiter Middleware                │    │
│  │  • Login: 5/30min                                   │    │
│  │  • Customer: 20/hour                                │    │
│  │  • General: 100/15min                               │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Authentication Middleware (JWT)             │    │
│  │  • Verify access token                              │    │
│  │  • Check user role                                  │    │
│  │  • Validate branch access (staff)                   │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│         ┌─────────────┴──────────────┐                     │
│         │                             │                     │
│         ▼                             ▼                     │
│  ┌───────────┐                 ┌──────────┐                │
│  │  PUBLIC   │                 │ PROTECTED│                │
│  │  ROUTES   │                 │  ROUTES  │                │
│  └───────────┘                 └──────────┘                │
│         │                             │                     │
│         ▼                             ▼                     │
│  /api/auth/login            ┌──────────────────┐           │
│                             │   Admin Routes   │           │
│                             │  • /api/branches │           │
│                             │  • /api/staff    │           │
│                             │  • /api/users    │           │
│                             └──────────────────┘           │
│                                      │                     │
│                             ┌──────────────────┐           │
│                             │ Admin+Staff      │           │
│                             │  • /api/customers│           │
│                             │  • /api/dashboard│           │
│                             └──────────────────┘           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER (MariaDB)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ branches │  │  users   │  │  staff   │  │customers │  │
│  │   (PK)   │  │   (PK)   │  │(PK, FK)  │  │(PK, FK)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                  Prepared Statements                         │
│              (SQL Injection Prevention)                      │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoint Tree

```
/api
├── /auth (Public)
│   ├── POST   /login          → Login user (admin/staff)
│   ├── POST   /refresh        → Refresh access token
│   ├── POST   /logout         → Logout (authenticated)
│   └── GET    /me             → Get current user (authenticated)
│
├── /branches (Admin Only)
│   ├── GET    /               → List all branches
│   ├── GET    /:id            → Get branch by ID
│   ├── POST   /               → Create new branch
│   ├── PUT    /:id            → Update branch
│   └── DELETE /:id            → Delete branch
│
├── /customers (Admin + Staff)
│   ├── GET    /               → List customers (filtered by branch for staff)
│   ├── GET    /:id            → Get customer by ID
│   ├── POST   /               → Create customer (rate limited: 20/hour)
│   ├── PUT    /:id            → Update customer
│   └── DELETE /:id            → Delete customer
│
├── /staff (Admin Only)
│   ├── GET    /               → List all staff
│   ├── GET    /:id            → Get staff by ID
│   ├── POST   /               → Create new staff
│   ├── PUT    /:id            → Update staff
│   └── DELETE /:id            → Delete staff
│
├── /users (Admin Only)
│   ├── GET    /               → List all admin users
│   ├── GET    /:id            → Get admin by ID
│   ├── POST   /               → Create new admin
│   ├── PUT    /:id            → Update admin
│   └── DELETE /:id            → Delete admin
│
└── /dashboard (Admin + Staff)
    ├── GET    /stats                → Overall statistics
    ├── GET    /branch-stats         → Per-branch stats (admin only)
    ├── GET    /recent-customers     → Recent registrations
    └── GET    /customer-trends      → Customer trends (admin only)
```

## Authentication Flow

```
┌──────────┐                                              ┌──────────┐
│  Client  │                                              │  Server  │
└────┬─────┘                                              └────┬─────┘
     │                                                          │
     │  POST /api/auth/login                                   │
     │  { username, password }                                 │
     ├────────────────────────────────────────────────────────►│
     │                                                          │
     │                                    Validate credentials  │
     │                                    Hash comparison       │
     │                                    Generate JWT tokens   │
     │                                                          │
     │  200 OK                                                  │
     │  { accessToken, refreshToken, user }                    │
     │◄────────────────────────────────────────────────────────┤
     │                                                          │
     │  Store tokens in memory/storage                         │
     │                                                          │
     │  GET /api/branches                                      │
     │  Header: Authorization: Bearer <accessToken>            │
     ├────────────────────────────────────────────────────────►│
     │                                                          │
     │                                    Verify JWT            │
     │                                    Check role            │
     │                                    Execute query         │
     │                                                          │
     │  200 OK                                                  │
     │  { success: true, data: [...] }                         │
     │◄────────────────────────────────────────────────────────┤
     │                                                          │
     │  (Token expires after 15 minutes)                       │
     │                                                          │
     │  POST /api/auth/refresh                                 │
     │  { refreshToken }                                       │
     ├────────────────────────────────────────────────────────►│
     │                                                          │
     │                                    Verify refresh token  │
     │                                    Generate new access   │
     │                                                          │
     │  200 OK                                                  │
     │  { accessToken }                                        │
     │◄────────────────────────────────────────────────────────┤
     │                                                          │
```

## Data Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN USER                                │
│  • Full access to all endpoints                             │
│  • Can view all branches                                    │
│  • Can manage all customers                                 │
│  • Can create/modify staff and admins                       │
│  • Can view global analytics                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
           ┌───────────────┴────────────────┐
           │                                 │
           ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│   STAFF USER         │          │   STAFF USER         │
│   Branch A           │          │   Branch B           │
│  • Limited access    │          │  • Limited access    │
│  • See only Branch A │          │  • See only Branch B │
│  • Manage customers  │          │  • Manage customers  │
│    in Branch A       │          │    in Branch B       │
│  • View Branch A     │          │  • View Branch B     │
│    statistics        │          │    statistics        │
└──────────────────────┘          └──────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Rate Limiting                                       │
│  • Prevents brute force attacks                             │
│  • Throttles API abuse                                      │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: JWT Authentication                                  │
│  • Verifies user identity                                   │
│  • Validates token expiry                                   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Role-Based Authorization                            │
│  • Checks user permissions                                  │
│  • Enforces branch-scoped access                            │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Input Validation & Sanitization                     │
│  • Validates data types and formats                         │
│  • Sanitizes inputs (XSS prevention)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Database Security                                   │
│  • Prepared statements (SQL injection prevention)            │
│  • Foreign key constraints                                  │
│  • Data integrity checks                                    │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────────┐
│    branches      │
│  ┌────────────┐  │
│  │ branch_id  │◄─┼──────┐
│  └────────────┘  │      │
│  branch_name     │      │ FK
│  address         │      │
│  phone_number    │      │
│  manager_name    │      │
└──────────────────┘      │
                          │
         ┌────────────────┴────────────────┐
         │                                  │
         │                                  │
    ┌────┴───────────┐            ┌────────┴──────┐
    │     staff      │            │   customers   │
    │  ┌──────────┐  │            │  ┌──────────┐ │
    │  │ staff_id │  │            │  │customer_id│ │
    │  └──────────┘  │            │  └──────────┘ │
    │  branch_id ───┼┘            │  branch_id ──┼┘
    │  username      │             │  full_name   │
    │  password_hash │             │  email (UNIQUE)
    │  full_name     │             │  phone_number│
    │  role='staff'  │             │  address     │
    └────────────────┘             │  status      │
                                   └──────────────┘
┌──────────────────┐
│      users       │
│  ┌────────────┐  │
│  │  user_id   │  │
│  └────────────┘  │
│  username        │
│  password_hash   │
│  full_name       │
│  role='admin'    │
└──────────────────┘
```

## Request/Response Flow

```
Client Request
      │
      ▼
┌──────────────┐
│ Rate Limiter │  ─── Check request count
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Auth Check   │  ─── Verify JWT token
└──────┬───────┘      Check role
       │              Validate branch access
       ▼
┌──────────────┐
│ Input Valid. │  ─── Sanitize inputs
└──────┬───────┘      Validate formats
       │
       ▼
┌──────────────┐
│  Controller  │  ─── Business logic
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Database    │  ─── Prepared statement
└──────┬───────┘      Execute query
       │
       ▼
┌──────────────┐
│  Response    │  ─── Format JSON
└──────┬───────┘      Return to client
       │
       ▼
Client receives JSON response
```

## Technology Stack Diagram

```
┌─────────────────────────────────────────────┐
│           Frontend (Coming Soon)            │
│  React 18 + Vite + Shadcn UI + Tailwind    │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST API
               ▼
┌─────────────────────────────────────────────┐
│              Backend Layer                   │
│  ┌────────────────────────────────────┐     │
│  │  Swagger UI (Documentation)        │     │
│  └────────────────────────────────────┘     │
│  ┌────────────────────────────────────┐     │
│  │  Express.js Server                 │     │
│  │  • Routes                          │     │
│  │  • Middleware (Auth, Rate Limit)   │     │
│  │  • Controllers                     │     │
│  └────────────────────────────────────┘     │
│  ┌────────────────────────────────────┐     │
│  │  Security Layer                    │     │
│  │  • JWT (jsonwebtoken)              │     │
│  │  • bcrypt                          │     │
│  │  • validator                       │     │
│  │  • express-rate-limit              │     │
│  └────────────────────────────────────┘     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          Database Layer                      │
│  MariaDB/MySQL                               │
│  • Connection Pool (mariadb)                │
│  • Prepared Statements                      │
│  • Constraints & Indexes                    │
└─────────────────────────────────────────────┘
```

---

**Dokumentasi ini menggambarkan struktur lengkap dari Multi-Shop Backend API**
