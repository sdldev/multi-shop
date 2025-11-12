# Branch Frontend - Mobile Application for Staff

This is the **mobile frontend** for the Multi-Shop application. It's designed specifically for branch staff to manage customers within their assigned branch.

## Target Users
- **Branch Staff Roles**: HeadBranch, Admin, Cashier, HeadCounter, Staff
- Mobile-first design optimized for smartphones
- Access limited to assigned branch only

## Features
- ✅ Mobile-optimized UI with bottom navigation
- ✅ Customer management (branch-scoped)
- ✅ Search customers by name, phone, code, or address
- ✅ Add new customers to branch
- ✅ View customer details with WhatsApp integration
- ✅ Branch and profile information
- ✅ Quick access to common tasks

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
cd branch-frontend
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

The application will be available at: **http://localhost:3001**

### Build for Production

```bash
npm run build
npm run preview
```

## Default Login Credentials

**Staff Users:** (all password: `Staff@123`)
- `headbranch_bth` - HeadBranch at BTH branch
- `admin_bth` - Admin at BTH branch
- `cashier_bth` - Cashier at BTH branch
- `staff_psw` - Staff at PSW branch

## Mobile Interface

### Bottom Navigation
The app uses a bottom navigation bar with 3 main sections:

1. **Beranda (Home)** 🏠
   - Quick access menu cards
   - Data Customer - View customer list
   - Tambah Customer - Add new customer
   - Laporan - Reports (under development)
   - TO-DO - Feature roadmap

2. **Customer** 👥
   - Search customers (min 3 characters)
   - Infinite scroll pagination
   - View customer details
   - WhatsApp integration
   - Copy phone numbers

3. **Profil (Profile)** 👤
   - Staff information
   - Branch details
   - Logout button

## Key Features

### Customer Search
- **Smart Search**: Type minimum 3 characters to search
- **Multi-field**: Searches name, phone, code, and address
- **Live Results**: Auto-updates as you type (500ms debounce)
- **Infinite Scroll**: Load more results as you scroll

### Add Customer
- **Quick Form**: Mobile-optimized form
- **Required Fields**: Name, email, registration date
- **Optional Fields**: Phone, code, address
- **Validation**: Email format and duplicate checking

### Customer Details
- **Full Information**: View all customer data
- **Quick Actions**:
  - Copy phone number to clipboard
  - Open WhatsApp chat directly
  - View status (Active/Inactive)

### Branch Information
- Branch name and ID
- Branch address (if available)
- Staff assignment info

## Access Restrictions
Staff users can ONLY:
- ✅ View customers in their assigned branch
- ✅ Add customers to their branch
- ✅ View their own branch information
- ❌ Cannot access other branches
- ❌ Cannot manage staff or admins
- ❌ Cannot view desktop admin pages

## Mobile Optimization
- **Responsive Design**: Optimized for screens 320px - 768px
- **Touch-Friendly**: Large tap targets, swipe gestures
- **Performance**: Lazy loading, debounced search
- **Offline-Ready**: Graceful error handling
- **PWA-Ready**: Can be installed as mobile app

## Project Structure

```
branch-frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Shadcn UI components
│   │   └── ProtectedRoute.jsx
│   ├── pages/           # Page components
│   │   ├── StaffMobile.jsx  # Main mobile interface
│   │   ├── Customers.jsx    # Customer management
│   │   └── Login.jsx        # Login page
│   ├── redux/           # State management
│   ├── utils/           # API utilities
│   ├── App.jsx          # Main app with routing
│   └── main.jsx         # Entry point
├── package.json
└── vite.config.js
```

## Styling
- Uses **Tailwind CSS v4** for styling
- Mobile-first responsive design
- Orange color scheme (#F97316) for branding
- Dark mode support
- Card-based layout for touch interaction

## API Integration
- All API calls go through `/api` proxy to backend
- Automatic branch filtering based on staff's branch_id
- Token-based authentication with JWT
- Error handling with toast notifications

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, modify `vite.config.js`:
```js
server: {
  port: 3002, // or any available port
}
```

### API Connection Issues
Verify backend is running on port 5000 and check staff has valid branch_id.

### Build Errors
Clear cache and reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Future Features (TO-DO)
1. **WA Gateway Integration** - Automated WhatsApp notifications
2. **Card Scanner** - Scan member cards with phone camera
3. **Transaction Recording** - Track customer transactions

## Related Documentation
- [Backend API Documentation](../backend/API_DOCUMENTATION.md)
- [Role System Documentation](../ROLE_SYSTEM_DOCUMENTATION.md)
- [Main Frontend (Desktop)](../main-frontend/README.md)
