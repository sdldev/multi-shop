# Multi-Shop Backend API

Backend API untuk sistem manajemen cabang Multi-Shop dengan autentikasi JWT, role-based access control, dan dokumentasi Swagger.

## 🚀 Fitur Utama

- **RESTful API** dengan Express.js
- **Dokumentasi API Swagger** yang lengkap dan interaktif
- **Autentikasi JWT** dengan access token dan refresh token
- **Role-Based Access Control (RBAC)** untuk admin dan staff
- **Rate Limiting** untuk keamanan endpoint
- **Input Sanitization** untuk mencegah XSS
- **Prepared Statements** untuk mencegah SQL Injection
- **Password Hashing** dengan bcrypt
- **Database MariaDB/MySQL**

## 📋 Persyaratan

- Node.js 20+
- MariaDB/MySQL
- npm atau yarn

## 🔧 Instalasi

1. Install dependencies:
```bash
cd backend
npm install
```

2. Buat file `.env` dari template:
```bash
cp .env.example .env
```

3. Konfigurasi `.env` sesuai dengan setup database Anda:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=multi_shop_db

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

4. Buat database dan jalankan schema:
```bash
mysql -u root -p < schema.sql
```

5. Seed database dengan data awal:
```bash
npm run seed
```

6. Jalankan server:
```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📚 Dokumentasi API

Setelah server berjalan, buka browser dan akses:

**Swagger UI**: `http://localhost:5000/api-docs`

Dokumentasi Swagger menyediakan:
- Daftar lengkap semua endpoint API
- Deskripsi parameter dan response
- Try it out feature untuk testing langsung
- Schema definitions
- Authentication requirements

## 🔐 Autentikasi

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Super Admin",
      "role": "admin"
    }
  }
}
```

### Menggunakan Token
Sertakan access token di header untuk endpoint yang memerlukan autentikasi:

```bash
Authorization: Bearer <your_access_token>
```

## 🛣️ Endpoint API

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Branches (Admin only)
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create new branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Customers (Admin & Staff)
- `GET /api/customers` - Get all customers (filtered by branch for staff)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Staff (Admin only)
- `GET /api/staff` - Get all staff
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create new staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Users/Admin (Admin only)
- `GET /api/users` - Get all admin users
- `GET /api/users/:id` - Get admin by ID
- `POST /api/users` - Create new admin
- `PUT /api/users/:id` - Update admin
- `DELETE /api/users/:id` - Delete admin

### Dashboard
- `GET /api/dashboard/stats` - Get overall statistics
- `GET /api/dashboard/branch-stats` - Get statistics per branch (Admin only)
- `GET /api/dashboard/recent-customers` - Get recent customer registrations
- `GET /api/dashboard/customer-trends` - Get customer trends (Admin only)

## 👥 Default Credentials

Setelah seeding, gunakan kredensial berikut untuk login:

### Admin
- Username: `admin`
- Password: `Admin@123`

### Staff (contoh)
- Username: `staff_jakarta`
- Password: `Staff@123`

## 🔒 Keamanan

### Rate Limiting
- Login: 5 percobaan per 30 menit
- Customer creation: 20 per jam per staff
- General API: 100 request per 15 menit

### Password Policy (Admin)
- Minimal 8 karakter
- Minimal 1 huruf kapital
- Minimal 1 angka
- Minimal 1 karakter spesial

### Input Sanitization
Semua input user di-sanitize menggunakan `validator.escape()` untuk mencegah XSS attacks.

### SQL Injection Prevention
Semua query menggunakan prepared statements dengan parameterized queries.

## 🏗️ Struktur Project

```
backend/
├── config/
│   ├── db.js              # Database connection
│   └── swagger.js         # Swagger configuration
├── middleware/
│   ├── auth.js            # JWT authentication & authorization
│   └── rateLimiter.js     # Rate limiting configurations
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── branches.js        # Branch CRUD routes
│   ├── customers.js       # Customer CRUD routes
│   ├── staff.js           # Staff CRUD routes
│   ├── users.js           # Admin user CRUD routes
│   └── dashboard.js       # Dashboard & analytics routes
├── .env.example           # Environment variables template
├── package.json           # Dependencies
├── schema.sql             # Database schema
├── seed.js                # Database seeder
└── server.js              # Express app entry point
```

## 🧪 Testing dengan Swagger

1. Buka `http://localhost:5000/api-docs`
2. Klik endpoint `/api/auth/login`
3. Klik "Try it out"
4. Masukkan credentials:
   ```json
   {
     "username": "admin",
     "password": "Admin@123"
   }
   ```
5. Klik "Execute"
6. Copy `accessToken` dari response
7. Klik tombol "Authorize" di pojok kanan atas Swagger UI
8. Paste token dengan format: `Bearer <your_token>`
9. Klik "Authorize"
10. Sekarang Anda bisa test semua protected endpoints!

## 📊 Database Schema

### Tables
- **branches**: Branch information
- **users**: Admin accounts
- **staff**: Staff accounts (branch-scoped)
- **customers**: Customer data (branch-scoped)

### Key Relationships
- Staff → Branch (Many-to-One)
- Customer → Branch (Many-to-One)

### Constraints
- Email unique globally across all branches
- Username unique across users and staff tables
- Customer status: 'Active' or 'Inactive'
- User role: 'admin' only
- Staff role: 'staff' only

## 🐛 Troubleshooting

### Connection Error
Pastikan MariaDB/MySQL berjalan dan credentials di `.env` sudah benar.

### Seeding Error
Pastikan database sudah dibuat dan schema sudah dijalankan sebelum seeding.

### Token Error
Pastikan JWT_SECRET dan JWT_REFRESH_SECRET di `.env` sudah dikonfigurasi.

## 📝 Notes

- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Staff can only access data from their assigned branch
- Admin has full access to all data
- Email must be unique globally (not per-branch)

## 🤝 Contributing

Untuk berkontribusi pada project ini:
1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

## 📄 License

MIT License
