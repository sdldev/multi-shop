# Multi-Shop Branch Management System

## Architecture Overview

Full-stack multi-branch customer management system with role-based access control:
- **Backend**: Node.js + Express + MariaDB (RESTful API)
- **Frontend**: React 18 + Vite + Shadcn UI + Tailwind CSS
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing
- **State Management**: Redux Toolkit
- **Deployment**: Docker containers + Nginx reverse proxy (local server)

## Database Schema

4 core tables with strict relationships:
- `branches`: Main branch entities
- `users`: Admin accounts (role='admin' CHECK constraint)
- `staff`: Branch-scoped staff (role='staff' CHECK constraint, FK to branches)
- `customers`: Branch customers (FK to branches, UNIQUE email globally)

**Key Constraints**:
- Email uniqueness across ALL branches (not per-branch)
- Staff accounts MUST have branch_id (non-null FK)
- Use prepared statements + validator.escape() for all inputs

## Role-Based Access Control (RBAC)

**Admin Global**:
- Full CRUD on all branches, staff, customers, and admins
- No branch_id restriction in queries

**Staff**:
- Read-only access to assigned branch (`WHERE branch_id = staff.branch_id`)
- CRUD customers only for their branch
- Cannot create/modify other staff or branches

## Security Implementation Requirements

| Layer | Implementation |
|-------|---------------|
| **Rate Limiting** | Login: 5 attempts/30min, Customer Add: 20/hour/staff |
| **XSS Prevention** | `validator.escape()` on ALL user inputs before DB/render |
| **SQL Injection** | Prepared statements (parameterized queries) only |
| **Password Storage** | bcrypt with salt rounds ≥10 |
| **Token Security** | Access token (15min), refresh token (7d), httpOnly cookies recommended |

## Authentication Flow

1. POST `/login` → Validate credentials → Issue JWT (access + refresh)
2. All protected routes: `Authorization: Bearer <token>` header
3. Token verification middleware checks role before allowing operations
4. POST `/logout` → Invalidate refresh token + clear client storage

## Frontend Patterns

**UI Components**: Use Shadcn UI + Tailwind utilities
- Forms: React Hook Form + Yup validation (validate before submit)
- Tables: Include branch filter for admins, auto-filter for staff
- Modals: Confirm destructive actions (delete branch/customer)

**State Management**:
- Redux slices for: auth, branches, customers, staff
- API calls via RTK Query or Axios with interceptors for token refresh

## Development Commands

```bash
# Backend setup
cd backend
npm install
npm run seed    # Seed initial data (branches, admin, staff, customers)
npm run dev     # Start Express server (nodemon)

# Frontend setup
cd frontend
npm install
npm run dev     # Start Vite dev server

# Docker deployment
docker-compose up -d          # Start all containers (backend, frontend, MariaDB, nginx)
docker-compose logs -f        # View container logs
docker-compose down           # Stop all containers
```

## Data Seeding Strategy

Initial seed data should include:
- 3-5 sample branches (different cities/regions)
- 1 global admin (username: admin)
- 2-3 staff per branch
- 10-20 customers per branch (mix Active/Inactive status)

All seeded passwords should be documented or use default pattern.

## Error Handling Standards

**Backend**:
- Return consistent JSON: `{ success: false, message: "...", error: "..." }`
- HTTP codes: 400 (validation), 401 (auth), 403 (forbidden), 404, 500

**Frontend**:
- Display user-friendly messages (not raw API errors)
- Toast notifications for success/error actions
- Form field-level validation errors

## Critical Business Rules

1. **Branch deletion**: Must check for dependent staff/customers first
2. **Email validation**: Must be unique globally (not just per-branch)
3. **Staff access**: Filter all queries by `branch_id` from JWT payload
4. **Password policy**: Min 8 chars, 1 uppercase, 1 number, 1 special char (for admins)
5. **Customer status**: Only "Active" or "Inactive" (CHECK constraint)

## File Structure (Expected)

```
backend/
  ├── config/db.js           # MariaDB connection pool
  ├── middleware/
  │   ├── auth.js            # JWT verification + role check
  │   └── rateLimiter.js     # Express-rate-limit configs
  ├── routes/
  │   ├── auth.js            # Login/logout/refresh
  │   ├── branches.js        # Admin-only CRUD
  │   ├── customers.js       # Branch-scoped CRUD
  │   ├── staff.js           # Admin manages staff
  │   └── reports.js         # Analytics endpoints (branch stats, customer trends)
  ├── seed.js                # Database seeder script
  └── server.js              # Express app entry

frontend/
  ├── src/
  │   ├── components/        # Shadcn UI components
  │   ├── pages/
  │   │   ├── Dashboard.jsx  # Stats charts + branch overview
  │   │   ├── Reports.jsx    # Analytics & data export
  │   │   └── ...
  │   ├── redux/             # Store + slices
  │   ├── utils/api.js       # Axios instance with interceptors
  │   └── App.jsx            # React Router setup
  └── vite.config.js

docker-compose.yml           # Services: backend, frontend, mariadb, nginx
nginx/
  └── nginx.conf             # Reverse proxy config (API + static files)
```

## Reporting & Analytics Features

**Admin Analytics** (all branches):
- Total customers per branch
- Active vs Inactive customer ratio
- Registration trends (daily/weekly/monthly)
- Top branches by customer count

**Staff Reports** (own branch only):
- Branch customer statistics
- New registrations this month
- Customer status breakdown

**Export Formats**: CSV, Excel (using libraries like `xlsx` or `csv-writer`)

## Testing Focus Areas

- Role-based query filtering (staff cannot see other branches)
- Rate limiting enforcement (automated retry attempts)
- XSS payloads in form inputs (should be escaped)
- Duplicate email registration (should fail with clear message)
- Token expiration and refresh flow
