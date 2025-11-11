# Frontend Routing Flow

## Role-Based Access Flow

```
┌─────────────┐
│   LOGIN     │
└──────┬──────┘
       │
       ├─ Admin Login ──────────────────┐
       │                                │
       │                         ┌──────▼──────┐
       │                         │   Layout    │
       │                         │  (Desktop)  │
       │                         └──────┬──────┘
       │                                │
       │                         ┌──────▼──────────────────────┐
       │                         │  Navigation Sidebar          │
       │                         │  - Dashboard                 │
       │                         │  - Branches (Admin)          │
       │                         │  - Customers                 │
       │                         │  - Staff (Admin)             │
       │                         │  - Admins (Admin)            │
       │                         └──────────────────────────────┘
       │
       └─ Staff Login ───────────────────┐
                                         │
                                  ┌──────▼──────┐
                                  │ StaffMobile │
                                  │   (Mobile)  │
                                  └──────┬──────┘
                                         │
                                  ┌──────▼──────────────────────┐
                                  │  Bottom Navigation           │
                                  │  - Beranda (Home)            │
                                  │  - Customer (List)           │
                                  │  - Profil (Profile)          │
                                  └──────────────────────────────┘
```

## Component Architecture

### Admin Flow
```
App.jsx
  └─ RoleBasedRoute (checks if admin)
       └─ Layout (Desktop UI)
            └─ Outlet
                 ├─ Dashboard
                 ├─ Branches (adminOnly)
                 ├─ Customers
                 ├─ Staff (adminOnly)
                 └─ Admins (adminOnly)
```

### Staff Flow
```
App.jsx
  └─ RoleBasedRoute (detects staff → redirects)
       └─ Navigate to="/staff-mobile"
            └─ StaffMobile (Standalone, no Layout)
                 ├─ Home View (Dashboard cards)
                 ├─ Customer View (CRUD operations)
                 └─ Profile View (Account info)
```

## Route Protection

### ProtectedRoute Component
- Checks authentication status
- Redirects to `/login` if not authenticated
- `adminOnly` prop restricts access to admin-only routes

### RoleBasedRoute Component
- Checks user role after authentication
- **Admin**: Allows access to Layout (desktop UI)
- **Staff**: Redirects to `/staff-mobile` automatically
- Ensures staff never see desktop UI

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main routing configuration |
| `src/components/RoleBasedRoute.jsx` | Role-based redirect logic |
| `src/components/ProtectedRoute.jsx` | Authentication guard |
| `src/components/Layout.jsx` | Desktop UI (Admin only) |
| `src/pages/StaffMobile.jsx` | Mobile UI (Staff only) |

## Features by Role

### Admin (Desktop UI)
- ✅ Full sidebar navigation
- ✅ Desktop-optimized tables and forms
- ✅ Access to all management pages
- ✅ Branch management
- ✅ Staff and admin management
- ✅ Customer management across all branches

### Staff (Mobile UI)
- ✅ Mobile-first responsive design
- ✅ Bottom navigation (3 tabs)
- ✅ Branch-scoped customer access
- ✅ Add/view customer details
- ✅ Profile and branch information
- ❌ No access to desktop UI
- ❌ No branch/staff/admin management
- ❌ Cannot see other branches' data

## Auto-Redirect Logic

```javascript
// In RoleBasedRoute.jsx
if (user?.role === 'staff') {
  return <Navigate to="/staff-mobile" replace />;
}
// Admin continues to Layout
return children;
```

This ensures:
1. Staff users never see desktop UI
2. Staff cannot manually navigate to `/dashboard`, `/branches`, etc.
3. Staff get optimized mobile experience
4. Admin get full desktop management interface
