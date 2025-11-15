# Tenant Frontend

Multi-tenant frontend application for Dorex App, configured to work with TenantBackend.

## Features

- **Automatic Tenant Detection**: Automatically detects tenant from subdomain
- **Dynamic API URLs**: API base URL is automatically constructed from current domain
- **Subdomain-based Routing**: Works with tenant subdomains (e.g., `tenant1.localhost`, `tenant2.yourdomain.com`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment (optional):
Create a `.env` file if you need to override API settings:
```env
VITE_API_BASE_URL=http://localhost:8000/api  # Optional: override auto-detection
VITE_API_PORT=8000  # Optional: backend port (default: 8000)
```

3. Run development server:
```bash
npm run dev
```

## How It Works

### Tenant Subdomain Access
- Access via tenant subdomain: `http://tenant1.localhost:5173`
- API calls automatically go to: `http://tenant1.localhost:8000/api`
- Each tenant gets isolated data from their own database

### Central Domain Access
- Access via central domain: `http://localhost:5173`
- API calls automatically go to: `http://localhost:8000/api`
- Used for tenant management and central operations

## API URL Detection

The frontend automatically constructs the API URL based on:
1. Current `window.location.hostname` (preserves subdomain)
2. Backend port (default: 8000, configurable via `VITE_API_PORT`)
3. Protocol (http/https)

This means:
- Frontend can run on any port (e.g., 5173 for Vite dev server)
- API calls always go to the correct backend port (8000)
- Subdomain is preserved for tenant identification

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

### Development
- Frontend dev server: Usually runs on port 5173
- Backend API: Runs on port 8000
- Auto-detection handles the port difference

### Production
- Configure your web server to serve the frontend
- Ensure subdomain routing is set up correctly
- API will be accessed via the same domain/subdomain on port 8000 (or your configured port)
