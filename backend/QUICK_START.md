# Quick Start Guide - Multi-Shop Backend API

Panduan cepat untuk menjalankan backend API Multi-Shop dengan Swagger documentation.

## 📋 Prerequisites

- **Node.js** 20 atau lebih tinggi
- **MariaDB** atau **MySQL** (versi 10.x atau 8.x)
- **npm** atau **yarn**
- **Terminal/Command Prompt**

## 🚀 Setup dalam 5 Langkah

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

**A. Login ke MariaDB/MySQL:**
```bash
mysql -u root -p
```

**B. Jalankan schema SQL:**
```sql
source schema.sql
```

Atau dari terminal:
```bash
mysql -u root -p < schema.sql
```

### 3. Konfigurasi Environment

**A. Copy file .env:**
```bash
cp .env.example .env
```

**B. Edit .env dengan credentials database Anda:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=multi_shop_db

JWT_SECRET=ganti-dengan-secret-key-anda
JWT_REFRESH_SECRET=ganti-dengan-refresh-secret-key-anda
```

### 4. Seed Database (Opsional tapi Direkomendasikan)

Populate database dengan data sample:
```bash
npm run seed
```

**Default credentials setelah seeding:**
- **Admin**: `admin` / `Admin@123`
- **Staff**: `staff_jakarta` / `Staff@123`

### 5. Jalankan Server

```bash
npm run dev
```

Server akan berjalan di: `http://localhost:5000`

## 📚 Akses Dokumentasi Swagger

Buka browser dan akses:
```
http://localhost:5000/api-docs
```

## ✅ Test API

### Option 1: Menggunakan Swagger UI

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
7. Klik tombol **"Authorize"** di pojok kanan atas
8. Paste: `Bearer YOUR_ACCESS_TOKEN`
9. Klik "Authorize"
10. ✅ Sekarang Anda bisa test semua endpoints!

### Option 2: Menggunakan cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

**Get Branches (ganti YOUR_TOKEN):**
```bash
curl -X GET http://localhost:5000/api/branches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 3: Menggunakan Postman

1. Import file: `Multi-Shop-API.postman_collection.json`
2. Jalankan request "Login" 
3. Token akan otomatis tersimpan di collection variables
4. Test endpoints lainnya!

## 📊 Struktur Database

Setelah seeding, database akan berisi:
- **5 cabang** di berbagai kota (Jakarta, Bandung, Surabaya, Medan, Yogyakarta)
- **2 admin users**
- **8 staff members** tersebar di cabang
- **20 customers** dengan status Active/Inactive

## 🔍 Endpoint Utama

| Kategori | Endpoint | Method | Access |
|----------|----------|--------|--------|
| **Auth** | `/api/auth/login` | POST | Public |
| **Auth** | `/api/auth/me` | GET | Authenticated |
| **Branches** | `/api/branches` | GET, POST | Admin |
| **Customers** | `/api/customers` | GET, POST, PUT, DELETE | Admin & Staff |
| **Staff** | `/api/staff` | GET, POST, PUT, DELETE | Admin |
| **Users** | `/api/users` | GET, POST, PUT, DELETE | Admin |
| **Dashboard** | `/api/dashboard/stats` | GET | Admin & Staff |

## 🛠️ Troubleshooting

### Error: Cannot connect to database

**Solusi:**
1. Pastikan MariaDB/MySQL sudah running
2. Cek credentials di file `.env`
3. Test connection: `mysql -u root -p`

### Error: Database 'multi_shop_db' doesn't exist

**Solusi:**
```bash
mysql -u root -p < schema.sql
```

### Error: npm install gagal

**Solusi:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5000 sudah digunakan

**Solusi:**
Edit `.env`:
```env
PORT=3000
```

## 📱 Testing Tips

1. **Selalu login dulu** untuk mendapatkan access token
2. **Admin** bisa akses semua endpoint
3. **Staff** hanya bisa akses data cabang mereka
4. **Rate limiting aktif**: 
   - Login: 5 percobaan / 30 menit
   - Customer creation: 20 / jam
5. **Token expires**: Access token 15 menit, refresh token 7 hari

## 📖 Dokumentasi Lengkap

- **Backend README**: `backend/README.md`
- **API Documentation**: `backend/API_DOCUMENTATION.md`
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Database Schema**: `backend/schema.sql`

## 🎯 Next Steps

1. ✅ Backend API sudah berjalan
2. 🔜 Build Frontend (React + Vite + Shadcn UI)
3. 🔜 Deploy ke server

## 💡 Tips Development

**Watch mode untuk auto-restart:**
```bash
npm run dev
```

**Check syntax tanpa run:**
```bash
node --check server.js
```

**View logs:**
Console akan menampilkan:
- 🚀 Server running on port
- 📚 API Documentation URL
- 🔗 API Base URL

## 🔐 Security Notes

- ✅ JWT authentication implemented
- ✅ Password hashing with bcrypt
- ✅ Input sanitization active
- ✅ SQL injection prevention
- ✅ Rate limiting enabled
- ✅ CORS ready (konfigurasi sesuai kebutuhan)

## 🤝 Support

Jika ada pertanyaan atau issue:
1. Cek dokumentasi di `backend/README.md`
2. Review Swagger documentation
3. Cek API_DOCUMENTATION.md untuk contoh request/response

---

**Happy Coding! 🚀**
