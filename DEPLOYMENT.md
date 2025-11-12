# Frontend Separation Deployment Guide

## Architecture Overview

The application now consists of **3 separate applications**:

```
┌─────────────────────────────────────────────────────────────┐
│                         Backend API                          │
│                    http://localhost:5000                     │
│         (Node.js + Express + MariaDB + JWT Auth)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│   Main Frontend       │           │  Branch Frontend      │
│   (Desktop - Admin)   │           │   (Mobile - Staff)    │
│  http://localhost:3000│           │ http://localhost:3001 │
│                       │           │                       │
│  • Sidebar Navigation │           │  • Bottom Navigation  │
│  • Full Management    │           │  • Customer Only      │
│  • All Branches       │           │  • Own Branch Only    │
└───────────────────────┘           └───────────────────────┘
```

## Quick Start (All Services)

### 1. Start Backend API

```bash
cd backend
npm install
npm run seed    # First time only
npm run dev
```

Backend runs at: `http://localhost:5000`

### 2. Start Main Frontend (Desktop)

Open a new terminal:

```bash
cd main-frontend
npm install
npm run dev
```

Main frontend runs at: `http://localhost:3000`

**Login as Admin:**
- Username: `admin`
- Password: `Admin@123`

### 3. Start Branch Frontend (Mobile)

Open another terminal:

```bash
cd branch-frontend
npm install
npm run dev
```

Branch frontend runs at: `http://localhost:3001`

**Login as Staff:**
- Username: `admin_bth`
- Password: `Staff@123`

## Access Points

| Application | URL | Target Users | Features |
|------------|-----|--------------|----------|
| **Backend API** | http://localhost:5000 | - | REST API + Swagger Docs |
| **Main Frontend** | http://localhost:3000 | Admin/Management | Desktop UI - Full Management |
| **Branch Frontend** | http://localhost:3001 | Branch Staff | Mobile UI - Customer Management |

## User Credentials

### Admin/Management Users (Main Frontend)
| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | Admin |
| `owner` | `CustPSW11!!` | Owner |
| `manager` | `CustPSW11!!` | Manager |

### Staff Users (Branch Frontend)
| Username | Password | Branch | Role |
|----------|----------|--------|------|
| `admin_bth` | `Staff@123` | BTH | Admin |
| `cashier_bth` | `Staff@123` | BTH | Cashier |
| `headbranch_sbr` | `Staff@123` | SBR | HeadBranch |

## Development Workflow

### Running All Services Concurrently

You can use a terminal multiplexer or multiple terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Main Frontend:**
```bash
cd main-frontend && npm run dev
```

**Terminal 3 - Branch Frontend:**
```bash
cd branch-frontend && npm run dev
```

## Building for Production

### Build Backend
```bash
cd backend
npm install --production
# Run with PM2 or similar
```

### Build Main Frontend
```bash
cd main-frontend
npm run build
# Output in: dist/
# Serve with nginx or any static file server
```

### Build Branch Frontend
```bash
cd branch-frontend
npm run build
# Output in: dist/
# Serve with nginx or any static file server
```

## Nginx Configuration Example

```nginx
# Backend API
upstream backend_api {
    server localhost:5000;
}

# Main Frontend (Desktop)
server {
    listen 80;
    server_name admin.example.com;
    
    root /path/to/main-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Branch Frontend (Mobile)
server {
    listen 80;
    server_name staff.example.com;
    
    root /path/to/branch-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=multi_shop_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Main Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
# or in production:
# VITE_API_BASE_URL=https://api.example.com/api
```

### Branch Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
# or in production:
# VITE_API_BASE_URL=https://api.example.com/api
```

## Troubleshooting

### Port Already in Use

**Main Frontend (port 3000):**
Edit `main-frontend/vite.config.js`:
```js
server: {
  port: 3002, // change to available port
}
```

**Branch Frontend (port 3001):**
Edit `branch-frontend/vite.config.js`:
```js
server: {
  port: 3003, // change to available port
}
```

### Backend Connection Issues

1. Verify backend is running: `curl http://localhost:5000/api/health`
2. Check CORS settings in `backend/server.js`
3. Verify proxy settings in vite configs

### Database Issues

1. Check MariaDB is running: `sudo systemctl status mariadb`
2. Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`
3. Run seed script: `cd backend && npm run seed`

## Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Frontend Dockerfiles
Both frontends use similar Dockerfile:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=password
    depends_on:
      - db

  main-frontend:
    build: ./main-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000/api

  branch-frontend:
    build: ./branch-frontend
    ports:
      - "3001:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000/api

  db:
    image: mariadb:10.11
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=multi_shop_db
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

## Testing Checklist

- [ ] Backend API responds on port 5000
- [ ] Main frontend loads on port 3000
- [ ] Branch frontend loads on port 3001
- [ ] Admin login works on main frontend
- [ ] Staff login works on branch frontend
- [ ] Admin can see all branches and features
- [ ] Staff can only see their branch customers
- [ ] Both frontends can add/edit/delete customers
- [ ] Mobile UI works on smartphones (branch frontend)
- [ ] Desktop UI works on desktop/laptop (main frontend)

## Performance Optimization

### Frontend
- Enable gzip compression in nginx
- Use CDN for static assets
- Implement service workers for offline support
- Add code splitting for large components

### Backend
- Use Redis for session storage
- Implement database connection pooling
- Add caching for frequently accessed data
- Use PM2 cluster mode for multiple instances

## Security Checklist

- [ ] Change default JWT secrets in production
- [ ] Use HTTPS for all production deployments
- [ ] Enable CORS only for trusted origins
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Implement rate limiting on API endpoints
- [ ] Regular security audits with `npm audit`
- [ ] Keep dependencies up to date
- [ ] Use environment-specific configurations

## Monitoring

### Recommended Tools
- **Backend**: PM2, Winston (logging), NewRelic
- **Frontend**: Google Analytics, Sentry (error tracking)
- **Database**: MariaDB slow query log, Percona Monitoring
- **Infrastructure**: Prometheus + Grafana

## Support

For issues or questions:
1. Check logs in respective directories
2. Review API documentation: http://localhost:5000/api-docs
3. Check frontend READMEs: `main-frontend/README.md`, `branch-frontend/README.md`
4. Review backend documentation: `backend/README.md`
