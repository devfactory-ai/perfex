# Perfex ERP - Complete Setup Guide

This guide will walk you through setting up Perfex ERP from scratch, including all prerequisites, configuration, and first-time setup.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Creating Your First Organization](#creating-your-first-organization)
7. [Cloudflare Deployment](#cloudflare-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version  # Should be v18+
   ```
   Download from: https://nodejs.org/

2. **pnpm** (v8.0.0 or higher)
   ```bash
   npm install -g pnpm
   pnpm --version  # Should be 8+
   ```

3. **Git**
   ```bash
   git --version
   ```
   Download from: https://git-scm.com/

4. **Cloudflare Account** (for deployment)
   - Sign up at: https://dash.cloudflare.com/sign-up

5. **Wrangler CLI** (Cloudflare's CLI tool)
   ```bash
   npm install -g wrangler
   wrangler --version
   ```

### Optional Tools

- **VS Code** with recommended extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Drizzle ORM

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/perfex.git
cd perfex
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for:
- Frontend (`apps/web`)
- API Worker (`apps/workers/api`)
- Database package (`packages/database`)
- Shared package (`packages/shared`)

### 3. Verify Installation

```bash
# Check that all packages are installed
pnpm list --depth=0
```

## Database Configuration

### Local Development Database

Perfex uses Cloudflare D1 (SQLite) for the database. For local development, we use a local SQLite file.

#### 1. Configure Wrangler for Local Development

The `wrangler.toml` file is already configured in `apps/workers/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "perfex-db"
database_id = "your-database-id"
```

For local development, Wrangler automatically creates a local `.wrangler` directory with a SQLite file.

#### 2. Run Database Migrations

```bash
# Navigate to database package
cd packages/database

# Generate migration (only if you've made schema changes)
pnpm generate

# Apply migrations locally
pnpm migrate:local
```

This will create all 88 tables across 12 migrations.

#### 3. Verify Database

```bash
# Check the local database
wrangler d1 execute perfex-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see all 88 tables listed.

### Production Database Setup

For production deployment:

```bash
# Create D1 database
wrangler d1 create perfex-db

# Copy the database_id from the output
# Update wrangler.toml with the database_id

# Apply migrations to production
cd packages/database
pnpm migrate:remote
```

## Environment Variables

### Frontend Environment Variables

Create `apps/web/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:8787/api/v1

# App Configuration
VITE_APP_NAME=Perfex ERP
VITE_APP_VERSION=1.0.0

# Environment
VITE_ENVIRONMENT=development

# Optional: Analytics
# VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### API Environment Variables

The API worker uses environment variables configured in `wrangler.toml` and Cloudflare dashboard.

For local development, create `apps/workers/api/.dev.vars`:

```env
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-super-secret-access-key-here-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-min-32-chars

# Environment
ENVIRONMENT=development

# Optional: External Services
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASSWORD=your-password
```

**Important**: Never commit `.dev.vars` or `.env` files to version control!

### Generating JWT Secrets

```bash
# Generate random secrets
openssl rand -base64 32  # For JWT_ACCESS_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

## Running the Application

### Start All Services

From the root directory:

```bash
# Start both frontend and API
pnpm dev
```

This runs:
- Frontend dev server at http://localhost:5173
- API worker at http://localhost:8787

### Start Services Individually

```bash
# Terminal 1: Start API only
pnpm --filter @perfex/api dev

# Terminal 2: Start frontend only
pnpm --filter @perfex/web dev
```

### Verify Everything is Running

1. **API Health Check**
   ```bash
   curl http://localhost:8787/
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "perfex-api",
     "version": "0.1.0"
   }
   ```

2. **Frontend**
   Open http://localhost:5173 in your browser

## Creating Your First Organization

### 1. Register an Account

1. Navigate to http://localhost:5173/register
2. Fill in the registration form:
   - **Organization Name**: Your company name
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Email**: Your email address
   - **Password**: Strong password (min 8 characters)

3. Click "Create Account"

### 2. Login

1. Navigate to http://localhost:5173/login
2. Enter your email and password
3. Click "Sign In"

### 3. Explore the Dashboard

You'll be redirected to the main dashboard where you can:
- View system stats
- Access all 12 modules
- Create your first records

### 4. Set Up Initial Data

**Recommended First Steps:**

1. **Finance Module**
   - Create chart of accounts
   - Set up tax rates
   - Configure bank accounts

2. **CRM Module**
   - Add your first company
   - Create contacts
   - Set up pipeline stages

3. **Inventory Module**
   - Create warehouses
   - Add inventory items
   - Set reorder points

4. **HR Module**
   - Create departments
   - Add employees
   - Configure leave types

## Cloudflare Deployment

### Prerequisites

1. Cloudflare account
2. Wrangler CLI installed and authenticated
3. Domain name (optional, but recommended)

### Step 1: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### Step 2: Create D1 Database

```bash
# Create production database
wrangler d1 create perfex-db

# Output will show database_id
# Copy this ID
```

Update `apps/workers/api/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "perfex-db"
database_id = "paste-your-database-id-here"
```

### Step 3: Run Migrations on Production

```bash
cd packages/database
pnpm migrate:remote
```

### Step 4: Create KV Namespaces

```bash
# For sessions
wrangler kv:namespace create SESSIONS

# For cache
wrangler kv:namespace create CACHE
```

Update `wrangler.toml` with the KV namespace IDs.

### Step 5: Configure Environment Variables

In Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings > Environment Variables
4. Add:
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ENVIRONMENT=production`

### Step 6: Deploy API Worker

```bash
cd apps/workers/api
pnpm deploy
```

Your API will be available at: `https://perfex-api.<your-subdomain>.workers.dev`

### Step 7: Deploy Frontend

#### Option A: Cloudflare Pages

```bash
cd apps/web

# Build the frontend
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=perfex-web
```

#### Option B: Manual Upload

1. Build: `pnpm build`
2. Go to Cloudflare Pages dashboard
3. Create new project
4. Upload the `dist` folder

### Step 8: Configure Frontend Environment

Update your frontend deployment's environment variables:
```env
VITE_API_URL=https://perfex-api.<your-subdomain>.workers.dev/api/v1
VITE_ENVIRONMENT=production
```

Rebuild and redeploy the frontend.

### Step 9: Custom Domain (Optional)

1. In Cloudflare Pages, go to Custom Domains
2. Add your domain (e.g., app.yourcompany.com)
3. Update DNS records as instructed
4. Update `VITE_API_URL` to use your custom API domain

## Troubleshooting

### Common Issues

#### 1. Database Migration Fails

**Problem**: Migration fails with "database locked"

**Solution**:
```bash
# Stop the dev server
# Remove local database
rm -rf apps/workers/api/.wrangler

# Restart and migrate
pnpm --filter @perfex/database migrate:local
```

#### 2. API Worker Won't Start

**Problem**: `Error: No such module`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf apps/workers/api/node_modules
pnpm install
```

#### 3. Frontend Can't Connect to API

**Problem**: CORS errors in browser console

**Solution**:
- Verify `VITE_API_URL` in `.env`
- Check API is running at correct port
- Restart both servers

#### 4. TypeScript Errors

**Problem**: Type errors after pulling latest changes

**Solution**:
```bash
# Rebuild all packages
pnpm build

# Or just rebuild shared types
pnpm --filter @perfex/shared build
```

#### 5. Migration Already Applied Error

**Problem**: "Migration already applied" error

**Solution**:
```bash
# Check migration status
wrangler d1 migrations list perfex-db --local

# If needed, manually rollback or fix the migration table
```

### Getting Help

1. Check the [documentation](./SYSTEM_OVERVIEW.md)
2. Search existing GitHub issues
3. Create a new issue with:
   - Exact error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

## Development Tips

### Hot Module Replacement

Both frontend and API support hot reloading:
- Frontend: Vite HMR (instant updates)
- API: Wrangler watches for changes

### Database Changes

When modifying the schema:
1. Update schema files in `packages/database/src/schema/`
2. Generate migration: `pnpm --filter @perfex/database generate`
3. Review the generated SQL
4. Apply locally: `pnpm --filter @perfex/database migrate:local`
5. Test thoroughly before deploying to production

### Testing Changes

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format
```

### Debugging

**Frontend:**
- Use React DevTools browser extension
- Check Network tab for API calls
- Console.log is your friend

**API:**
- Use `console.log()` in worker code
- Check Wrangler tail for logs:
  ```bash
  wrangler tail
  ```
- Use Cloudflare dashboard for production logs

## Next Steps

After setup:

1. **Customize Branding**
   - Update app name and logo
   - Configure theme colors
   - Add your company information

2. **Set Up Initial Data**
   - Import existing data (if applicable)
   - Configure default settings
   - Set up user roles and permissions

3. **Configure Integrations**
   - Set up email (SMTP)
   - Configure webhooks
   - Add external API keys

4. **Invite Team Members**
   - Create user accounts
   - Assign roles
   - Set permissions per module

5. **Explore Features**
   - Try each module
   - Create sample records
   - Test workflows

6. **Read Documentation**
   - [System Overview](./SYSTEM_OVERVIEW.md)
   - [API Documentation](./docs/api.md)
   - Module-specific guides

## Security Checklist

Before going to production:

- [ ] Changed all default secrets and passwords
- [ ] Configured HTTPS/SSL
- [ ] Set up proper CORS policies
- [ ] Enabled rate limiting
- [ ] Configured backups
- [ ] Set up monitoring and alerts
- [ ] Reviewed user permissions
- [ ] Tested authentication flows
- [ ] Enabled audit logging
- [ ] Configured data retention policies

---

**Need Help?** Contact support@perfex.com or check our [documentation](./SYSTEM_OVERVIEW.md)

**Status**: ✅ Ready for Production | **Last Updated**: January 2025
