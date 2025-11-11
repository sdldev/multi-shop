# Multi-Shop Frontend

React-based frontend for the Multi-Shop Branch Management System built with Vite, Shadcn UI, and Tailwind CSS.

## Features

- 🔐 JWT-based authentication with automatic token refresh
- 📊 Dashboard with statistics and charts
- 🏢 Branch management (Admin only)
- 👥 Customer management (Admin & Staff)
- 👨‍💼 Staff management (Admin only)
- 🛡️ Admin user management (Admin only)
- 🎨 Modern UI with Shadcn components
- 📱 Responsive design
- 🌗 Dark mode support
- 🔒 Role-based access control (RBAC)

## Tech Stack

- **Framework:** React 18+
- **Build Tool:** Vite
- **UI Library:** Shadcn UI
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** Redux Toolkit
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Yup
- **Charts:** Recharts
- **Icons:** Lucide React

## Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and set your API base URL:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

3. Start development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Default Credentials

- **Admin:** `admin` / `Admin@123`
- **Staff:** `staff_jakarta` / `Staff@123`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   ├── Layout.jsx       # Main layout with sidebar
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Branches.jsx
│   │   ├── Customers.jsx
│   │   ├── Staff.jsx
│   │   └── Admins.jsx
│   ├── redux/
│   │   ├── store.js
│   │   └── authSlice.js
│   ├── utils/
│   │   └── api.js           # API client with interceptors
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── .env.example
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Available Routes

- `/login` - Login page
- `/dashboard` - Dashboard with statistics
- `/customers` - Customer management (Admin & Staff)
- `/branches` - Branch management (Admin only)
- `/staff` - Staff management (Admin only)
- `/admins` - Admin user management (Admin only)

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`. All API calls include automatic:

- JWT token attachment
- Token refresh on expiration
- Error handling
- Loading states

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API base URL | http://localhost:5000/api |

## Security Features

- JWT authentication with access and refresh tokens
- Automatic token refresh
- Protected routes
- Role-based access control
- Secure storage of tokens in localStorage
- XSS prevention through proper sanitization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

