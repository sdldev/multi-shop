# Deskripsi Aplikasi: Sistem Manajemen Customers Cabang

## Gambaran Umum
**Sistem Manajemen Cabang** adalah aplikasi web lengkap (full-stack) yang dirancang khusus untuk mengelola operasional cabang bisnis **Toko Multi Cabang**. Aplikasi ini memungkinkan **Admin Global** mengelola seluruh cabang, staf, dan pelanggan, sementara **Staf Cabang** hanya dapat mengakses data cabang tempat mereka bekerja.

Sistem ini dibangun dengan arsitektur modern, aman, dan skalabel, menggunakan:
- **Backend**: Node.js + Express + MariaDB + **Swagger API Documentation** ✅
- **Main Frontend (Desktop)**: React + Vite + Shadcn UI + Tailwind CSS - For Admin/Management ✅
- **Branch Frontend (Mobile)**: React + Vite + Mobile-First UI - For Branch Staff ✅
- **Autentikasi**: JWT (Access + Refresh Token)
- **Keamanan**: Rate Limiting, Input Sanitasi, Bcrypt Hash

## Arsitektur Aplikasi

Aplikasi ini memiliki **2 frontend terpisah** yang melayani kebutuhan berbeda:

### 1. Main Frontend (Desktop) - Port 3000
- **Target**: Admin & Management users
- **Interface**: Desktop-optimized with sidebar navigation
- **Features**: Full system management (branches, staff, admins, customers)
- **Access**: All branches and system-wide features

### 2. Branch Frontend (Mobile) - Port 3001
- **Target**: Branch staff (HeadBranch, Admin, Cashier, Staff)
- **Interface**: Mobile-first with bottom navigation
- **Features**: Customer management within assigned branch
- **Access**: Limited to own branch only

## 🚀 Quick Start

### Backend API (✅ Complete)

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Database:**
   ```bash
   mysql -u root -p < schema.sql
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Seed Database:**
   ```bash
   npm run seed
   ```

5. **Start Server:**
   ```bash
   npm run dev
   ```

6. **Access Swagger Documentation:**
   ```
   http://localhost:5000/api-docs
   ```

📖 **Detailed Guide**: [Backend Quick Start](backend/QUICK_START.md)

### Main Frontend - Desktop (✅ Complete)

**For Admin/Management Users**

1. **Install Dependencies:**
   ```bash
   cd main-frontend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Update VITE_API_BASE_URL if needed (default: http://localhost:5000/api)
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Access Application:**
   ```
   http://localhost:3000
   ```

**Default Credentials:**
- Admin: `admin` / `Admin@123`
- Owner: `owner` / `CustPSW11!!`

📖 **Detailed Guide**: [Main Frontend README](main-frontend/README.md)

### Branch Frontend - Mobile (✅ Complete)

**For Branch Staff**

1. **Install Dependencies:**
   ```bash
   cd branch-frontend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Update VITE_API_BASE_URL if needed (default: http://localhost:5000/api)
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Access Application:**
   ```
   http://localhost:3001
   ```

**Default Credentials:**
- Staff: `staff_jakarta` / `Staff@123`
- Staff BTH: `admin_bth` / `Staff@123`

📖 **Detailed Guide**: [Branch Frontend README](branch-frontend/README.md)

---

## Tujuan Aplikasi
1. **Sentralisasi Data**: Semua data cabang, staf, dan pelanggan tersimpan di satu database.
2. **Kontrol Akses Berbasis Role (RBAC)**:
   - **Management Users**: Multiple roles (Owner, Manager, Head Branch Manager, Management, Warehouse, Staff) with full system access
   - **Branch Staff**: Multiple roles (HeadBranch, Admin, Cashier, HeadCounter, Staff) with branch-scoped access
3. **Keamanan Tinggi**: Mencegah serangan XSS, SQL Injection, Brute Force, dan DDoS.
4. **Otomatisasi**: Seeder data awal untuk cabang, management users, staff, dan pelanggan.
5. **Responsif & User-Friendly**: Dashboard mobile-first dengan tema gelap/terang.

📖 **[Role System Documentation](ROLE_SYSTEM_DOCUMENTATION.md)** - Complete guide to the multi-role system

---

## Fitur Utama

| Fitur | Deskripsi | Role |
|------|---------|------|
| **Login & Autentikasi** | JWT + Refresh Token | Semua |
| **Dashboard** | Statistik cabang, pelanggan, staf | Management & Staff |
| **Manajemen Cabang** | CRUD cabang (nama, alamat, manager) | Management |
| **Manajemen Pelanggan** | CRUD pelanggan per cabang (email unik) | Management & Staff |
| **Manajemen Staf** | Buat akun staf per cabang dengan role selection | Management |
| **Manajemen Users** | Buat management user dengan role selection (Owner, Manager, etc) | Management |
| **Multi-Role System** | 6 user roles + 5 staff roles dengan permission berbeda | Semua |
| **Logout** | Hapus token, kembali ke login | Semua |

---

## Teknologi yang Digunakan

### Backend ✅
- **Node.js 20+** + **Express.js**
- **MariaDB/MySQL** (database)
- **Swagger UI** + **Swagger JSDoc** (API documentation)
- **JWT** (autentikasi)
- **Bcrypt** (password hashing)
- **Validator** (sanitasi input)
- **Express Rate Limit** (anti-brute force)

### Frontend ✅
- **React 18+** + **Vite**
- **Shadcn UI** (komponen UI)
- **Tailwind CSS v4** (styling)
- **React Router v6** (navigasi)
- **React Hook Form + Yup** (validasi form)
- **Redux Toolkit** (state management)
- **Axios** (HTTP client dengan interceptors)
- **Recharts** (data visualization)
- **Lucide React** (icons)

---

## Keamanan & Proteksi

| Ancaman | Solusi |
|--------|--------|
| **Brute Force Login** | 5 percobaan / 30 menit |
| **Spam Tambah Pelanggan** | 20 / jam per staf |
| **XSS Attack** | `validator.escape()` |
| **SQL Injection** | Prepared statements + sanitasi |
| **Session Hijacking** | JWT + HTTPS (rekomendasi) |
| **Data Duplikat** | `UNIQUE` constraint + validasi |

---

## 📚 API Endpoints (Backend)

### Authentication
- `POST /api/auth/login` - Login user (admin/staff)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Branches (Admin Only)
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create new branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Customers (Admin & Staff)
- `GET /api/customers` - Get customers (filtered by branch for staff)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer (rate limited: 20/hour)
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Staff Management (Admin Only)
- `GET /api/staff` - Get all staff members
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create new staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Admin Users (Admin Only)
- `GET /api/users` - Get all admin users
- `GET /api/users/:id` - Get admin by ID
- `POST /api/users` - Create new admin (strong password required)
- `PUT /api/users/:id` - Update admin
- `DELETE /api/users/:id` - Delete admin

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get overall statistics
- `GET /api/dashboard/branch-stats` - Get per-branch statistics (admin only)
- `GET /api/dashboard/recent-customers` - Get recent customer registrations
- `GET /api/dashboard/customer-trends` - Get customer trends by month (admin only)

**📖 Complete API Documentation**: 
- Swagger UI: `http://localhost:5000/api-docs`
- [API Documentation](backend/API_DOCUMENTATION.md)
- [Postman Collection](backend/Multi-Shop-API.postman_collection.json)

---

## Alur Pengguna

1. **Login** → `/api/auth/login` → JWT Token → Access API
2. **Admin** → Kelola semua cabang → Buat staf/admin → View analytics
3. **Staf** → Hanya lihat cabang sendiri → Kelola pelanggan cabang
4. **Logout** → `/api/auth/logout` → Hapus token

---

## Struktur Database (ERD)
Lihat [dbdiagram.io](#dbdiagram) di bawah.

---

```
Table branches {
  branch_id int [pk, increment]
  branch_name varchar(100) [not null]
  address varchar(255)
  phone_number varchar(20)
  manager_name varchar(100)
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    (branch_name) [name: 'idx_name']
  }
}

Table users {
  user_id int [pk, increment]
  username varchar(50) [unique, not null]
  password_hash varchar(255) [not null]
  full_name varchar(100)
  role varchar(20) [default: 'admin', not null, note: 'CHECK (role = "admin")']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table staff {
  staff_id int [pk, increment]
  branch_id int [ref: > branches.branch_id, not null]
  username varchar(50) [unique, not null]
  password_hash varchar(255) [not null]
  full_name varchar(100)
  role varchar(20) [default: 'staff', not null, note: 'CHECK (role = "staff")']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    (branch_id) [name: 'idx_branch']
    (username) [name: 'idx_username']
  }
}

Table customers {
  customer_id int [pk, increment]
  branch_id int [ref: > branches.branch_id, not null]
  full_name varchar(50) [not null]
  email varchar(100) [unique, not null]
  phone_number varchar(20)
  addrss text(500)
  registration_date date [not null]
  status varchar(20) [default: 'Active', note: 'CHECK IN ("Active", "Inactive")']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    (branch_id) [name: 'idx_branch']
    (email) [name: 'idx_email']
    (status) [name: 'idx_status']
  }
}

```