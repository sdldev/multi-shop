# API Documentation - Multi-Shop Branch Management System

## Overview
RESTful API dengan autentikasi JWT dan dokumentasi Swagger untuk sistem manajemen cabang multi-shop.

## Base URL
```
http://localhost:5000
```

## Swagger Documentation
Akses dokumentasi interaktif Swagger di:
```
http://localhost:5000/api-docs
```

## Authentication

### Login
Mendapatkan access token dan refresh token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Super Admin",
      "role": "admin"
    }
  }
}
```

### Refresh Token
Memperbarui access token yang expired.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
Logout user (client-side token removal).

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

### Get Current User
Mendapatkan informasi user yang sedang login.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

## Branches (Admin Only)

### Get All Branches
**Endpoint:** `GET /api/branches`

**Headers:**
```
Authorization: Bearer <access_token>
```

### Get Branch by ID
**Endpoint:** `GET /api/branches/:id`

### Create Branch
**Endpoint:** `POST /api/branches`

**Request Body:**
```json
{
  "branch_name": "Jakarta Selatan Branch",
  "address": "Jl. Sudirman No. 123",
  "phone_number": "+62 21 1234567",
  "manager_name": "John Doe"
}
```

### Update Branch
**Endpoint:** `PUT /api/branches/:id`

**Request Body:**
```json
{
  "branch_name": "Jakarta Selatan Branch Updated",
  "address": "Jl. Sudirman No. 456",
  "phone_number": "+62 21 7654321",
  "manager_name": "Jane Doe"
}
```

### Delete Branch
**Endpoint:** `DELETE /api/branches/:id`

## Customers (Admin & Staff)

### Get All Customers
**Endpoint:** `GET /api/customers`

**Query Parameters:**
- `branch_id` (optional, admin only) - Filter by branch
- `status` (optional) - Filter by status: "Active" or "Inactive"

**Note:** Staff automatically see only their branch's customers.

### Get Customer by ID
**Endpoint:** `GET /api/customers/:id`

### Create Customer
**Endpoint:** `POST /api/customers`

**Request Body:**
```json
{
  "branch_id": 1,
  "full_name": "John Smith",
  "email": "john.smith@example.com",
  "phone_number": "+62 812 3456789",
  "address": "Jl. Kebon Jeruk No. 1",
  "registration_date": "2024-01-15",
  "status": "Active"
}
```

**Rate Limit:** 20 requests per hour per staff

### Update Customer
**Endpoint:** `PUT /api/customers/:id`

**Request Body:**
```json
{
  "full_name": "John Smith Updated",
  "email": "john.updated@example.com",
  "phone_number": "+62 812 9999999",
  "address": "Jl. Kebon Jeruk No. 2",
  "status": "Inactive"
}
```

### Delete Customer
**Endpoint:** `DELETE /api/customers/:id`

## Staff (Admin Only)

### Get All Staff
**Endpoint:** `GET /api/staff`

**Query Parameters:**
- `branch_id` (optional) - Filter by branch

### Get Staff by ID
**Endpoint:** `GET /api/staff/:id`

### Create Staff
**Endpoint:** `POST /api/staff`

**Request Body:**
```json
{
  "branch_id": 1,
  "username": "staff_new",
  "password": "StaffPass@123",
  "full_name": "New Staff Member"
}
```

### Update Staff
**Endpoint:** `PUT /api/staff/:id`

**Request Body:**
```json
{
  "branch_id": 2,
  "username": "staff_updated",
  "password": "NewPass@123",
  "full_name": "Updated Staff Name"
}
```

### Delete Staff
**Endpoint:** `DELETE /api/staff/:id`

## Users/Admin (Admin Only)

### Get All Admin Users
**Endpoint:** `GET /api/users`

### Get Admin by ID
**Endpoint:** `GET /api/users/:id`

### Create Admin
**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "newadmin",
  "password": "Admin@123456",
  "full_name": "New Admin User"
}
```

**Password Requirements:**
- Minimal 8 karakter
- Minimal 1 huruf kapital
- Minimal 1 angka
- Minimal 1 karakter spesial

### Update Admin
**Endpoint:** `PUT /api/users/:id`

**Request Body:**
```json
{
  "username": "updatedadmin",
  "password": "NewAdmin@123",
  "full_name": "Updated Admin Name"
}
```

### Delete Admin
**Endpoint:** `DELETE /api/users/:id`

## Dashboard

### Get Statistics
**Endpoint:** `GET /api/dashboard/stats`

**Response (Admin):**
```json
{
  "success": true,
  "data": {
    "totalBranches": 5,
    "totalCustomers": 120,
    "activeCustomers": 100,
    "inactiveCustomers": 20,
    "totalStaff": 15,
    "totalAdmins": 2
  }
}
```

**Response (Staff):**
```json
{
  "success": true,
  "data": {
    "totalBranches": 1,
    "totalCustomers": 25,
    "activeCustomers": 20,
    "inactiveCustomers": 5,
    "totalStaff": 3
  }
}
```

### Get Branch Statistics (Admin Only)
**Endpoint:** `GET /api/dashboard/branch-stats`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "branch_id": 1,
      "branch_name": "Jakarta Pusat Branch",
      "address": "Jl. Sudirman No. 123",
      "manager_name": "Budi Santoso",
      "total_customers": 25,
      "active_customers": 20,
      "inactive_customers": 5,
      "total_staff": 3
    }
  ]
}
```

### Get Recent Customers
**Endpoint:** `GET /api/dashboard/recent-customers`

**Query Parameters:**
- `limit` (optional, default: 10) - Number of recent customers

### Get Customer Trends (Admin Only)
**Endpoint:** `GET /api/dashboard/customer-trends`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2024-03",
      "count": 15
    },
    {
      "month": "2024-02",
      "count": 25
    },
    {
      "month": "2024-01",
      "count": 20
    }
  ]
}
```

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Login | 5 attempts per 30 minutes |
| Customer Creation | 20 requests per hour |
| General API | 100 requests per 15 minutes |

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message (development only)"
}
```

## Security Features

1. **JWT Authentication**: Access token (15 min) + Refresh token (7 days)
2. **Password Hashing**: bcrypt dengan salt rounds 10
3. **Input Sanitization**: validator.escape() untuk semua user input
4. **SQL Injection Prevention**: Prepared statements untuk semua queries
5. **Rate Limiting**: Mencegah brute force dan spam
6. **Role-Based Access Control**: Admin dan Staff dengan permissions berbeda

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

### Get Branches (with token)
```bash
curl -X GET http://localhost:5000/api/branches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Customer
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": 1,
    "full_name": "Test Customer",
    "email": "test@example.com",
    "phone_number": "+62 812 1234567",
    "address": "Test Address",
    "registration_date": "2024-01-15",
    "status": "Active"
  }'
```

## Default Credentials (After Seeding)

### Admin Accounts
- Username: `admin` / Password: `Admin@123`
- Username: `admin2` / Password: `Admin@123`

### Staff Accounts
- Username: `staff_jakarta` / Password: `Staff@123`
- Username: `staff_bandung` / Password: `Staff@123`
- Username: `staff_surabaya` / Password: `Staff@123`
- Username: `staff_medan` / Password: `Staff@123`
- Username: `staff_yogya` / Password: `Staff@123`

## Support

Untuk informasi lebih lanjut, lihat dokumentasi Swagger di `/api-docs`.
