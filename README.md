# Deskripsi Aplikasi: Sistem Manajemen Customers Cabang

## Gambaran Umum
**Sistem Manajemen Cabang** adalah aplikasi web lengkap (full-stack) yang dirancang khusus untuk mengelola operasional cabang bisnis **Toko Multi Cabang**. Aplikasi ini memungkinkan **Admin Global** mengelola seluruh cabang, staf, dan pelanggan, sementara **Staf Cabang** hanya dapat mengakses data cabang tempat mereka bekerja.

Sistem ini dibangun dengan arsitektur modern, aman, dan skalabel, menggunakan:
- **Backend**: Node.js + Express + MariaDB
- **Frontend**: React + Vite + Shadcn UI + Tailwind CSS
- **Autentikasi**: JWT (Access + Refresh Token)
- **Keamanan**: Rate Limiting, Input Sanitasi, Bcrypt Hash

---

## Tujuan Aplikasi
1. **Sentralisasi Data**: Semua data cabang, staf, dan pelanggan tersimpan di satu database.
2. **Kontrol Akses Berbasis Role (RBAC)**:
   - **Admin Global**: Akses penuh ke semua cabang.
   - **Staf Cabang**: Hanya akses ke cabang sendiri.
3. **Keamanan Tinggi**: Mencegah serangan XSS, SQL Injection, Brute Force, dan DDoS.
4. **Otomatisasi**: Seeder data awal untuk cabang, admin, staf, dan pelanggan.
5. **Responsif & User-Friendly**: Dashboard mobile-first dengan tema gelap/terang.

---

## Fitur Utama

| Fitur | Deskripsi | Role |
|------|---------|------|
| **Login & Autentikasi** | JWT + Refresh Token | Semua |
| **Dashboard** | Statistik cabang, pelanggan, staf | Admin & Staf |
| **Manajemen Cabang** | CRUD cabang (nama, alamat, manager) | Admin |
| **Manajemen Pelanggan** | CRUD pelanggan per cabang (email unik) | Admin & Staf |
| **Manajemen Staf** | Buat akun staf per cabang | Admin |
| **Manajemen Admin** | Buat admin baru (password kuat) | Admin |
| **Logout** | Hapus token, kembali ke login | Semua |

---

## Teknologi yang Digunakan

### Backend
- **Node.js** + **Express.js**
- **MariaDB** (kompatibel MySQL)
- **Bcrypt** (password hashing)
- **JWT** (autentikasi)
- **Validator** (sanitasi input)
- **Express Rate Limit** (anti-brute force)

### Frontend
- **React 18** + **Vite**
- **Shadcn UI** (komponen UI)
- **Tailwind CSS** (styling)
- **React Router** (navigasi)
- **React Hook Form + Yup** (validasi form)
- **Redux Toolkit** (state management)
- **Axios** (HTTP client)

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

## Alur Pengguna

1. **Login** → `/login` → JWT → Dashboard
2. **Admin** → Kelola semua cabang → Buat staf/admin
3. **Staf** → Hanya lihat cabang sendiri → Kelola pelanggan
4. **Logout** → Hapus token → Kembali ke login

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