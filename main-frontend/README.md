# Main Frontend - Desktop Application for Admin/Management

This is the **desktop frontend** for the Multi-Shop application. It's designed for admin and management users to manage all branches, staff, and customers.

## Target Users
- **Admin/Management Roles**: Owner, Manager, Head Branch Manager, Management, Warehouse
- Requires desktop/laptop interface
- Full access to all system features

## Features
- ✅ Desktop-optimized UI with sidebar navigation
- ✅ Full CRUD for branches, staff, admins, and customers
- ✅ Dashboard with analytics and statistics
- ✅ Role-based access control
- ✅ Multi-branch management
- ✅ Data export and reporting

## Technology Stack
- **React 19** + **Vite**
- **Shadcn UI** + **Tailwind CSS v4**
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Axios** for API calls

## Getting Started

### Prerequisites
- Node.js 20+
- Backend API running on `http://localhost:5000`

### Installation

```bash
cd main-frontend
npm install
```

### Configuration

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Development

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Build for Production

```bash
npm run build
npm run preview
```

## Default Login Credentials

**Admin User:**
- Username: `admin`
- Password: `Admin@123`

**Management Users:** (all password: `CustPSW11!!`)
- `owner` - Owner role
- `manager` - Manager role

## Available Routes

- `/login` - Login page
- `/dashboard` - Main dashboard with statistics
- `/branches` - Branch management (Admin only)
- `/customers` - Customer management (all branches)
- `/staff` - Staff management (Admin only)
- `/admins` - Admin user management (Admin only)

## Related Documentation
- [Backend API Documentation](../backend/API_DOCUMENTATION.md)
- [Role System Documentation](../ROLE_SYSTEM_DOCUMENTATION.md)
- [Branch Frontend (Mobile)](../branch-frontend/README.md)
