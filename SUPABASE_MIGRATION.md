# Replit to Supabase Migration Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project with PostgreSQL database
3. Wait for the project to initialize
4. In Project Settings, copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Public Key** → `SUPABASE_ANON_KEY` & `VITE_SUPABASE_ANON_KEY`
   - **Service Role Secret** → `SUPABASE_SERVICE_ROLE_KEY`
   - Go to Auth → Settings → JWT Secret → Copy → `SUPABASE_JWT_SECRET`

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database (you can find this in Supabase project settings)
DATABASE_URL=postgresql://postgres:[password]@[host].supabase.co:5432/postgres

# Environment
NODE_ENV=development
PORT=5000

# Client-side
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

## Step 3: Migrate Database Schema

1. **Export data from Replit** (already done with `backup.sql`)

2. **Import into Supabase:**
   ```bash
   # In Supabase Console → SQL Editor → New Query
   # Paste contents of backup.sql (excluding Replit-specific tables like _system.replit_database_migrations_v1)
   ```

3. **Push Drizzle migrations:**
   ```bash
   npm install
   npm run db:push
   ```

## Step 4: Update Dependencies

The code has already been updated to:
- ✅ Remove: `openid-client`, `@google-cloud/storage`, `stripe-replit-sync`
- ✅ Add: `@supabase/supabase-js`, `@supabase/auth-helpers-react`, `jsonwebtoken`, `multer`

Install dependencies:
```bash
npm install
```

## Step 5: Configure Supabase Storage

1. In Supabase Console → Storage
2. Create a new bucket called `app-storage` (public)
3. The app will automatically use this bucket for file uploads

## Step 6: Set Up Authentication

### Option A: Email/Password (Simple)
- Users can sign up with email/password in Supabase Auth
- The app already has endpoints:
  - `GET /api/login` - Redirects to Supabase login
  - `GET /api/auth/callback` - Handles callback
  - `GET /api/logout` - Logs out user

### Option B: OAuth (Google, GitHub, etc.)
1. In Supabase Console → Authentication → Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Add your OAuth credentials
4. Update `REDIRECT_TO` URL to your production domain

### Option C: Magic Links
1. In Supabase Console → Authentication → Providers
2. Enable Email provider
3. Users can sign up/login with just email

## Step 7: Testing Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server will run on http://localhost:5000
# Client will run on http://localhost:5173
```

## Step 8: Deploy to Production

### Option 1: Vercel (Recommended)
```bash
# Connect your repo to Vercel
# Add environment variables in Vercel dashboard
# Deploy with: git push
```

### Option 2: Railway
```bash
# Connect your GitHub repo
# Add environment variables
# Railway auto-deploys on push
```

### Option 3: Render
```bash
# Create new Web Service on Render
# Connect GitHub repo
# Add environment variables
# Deploy
```

### Option 4: Other Node.js Hosts
Make sure to set these environment variables on your host:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
- `NODE_ENV=production`
- `PORT` (usually 3000 or auto-assigned)

## Step 9: Update Production URLs

After deploying, update callback URLs in Supabase:

1. Go to Supabase Console → Authentication → URL Configuration
2. Set:
   - **Site URL**: `https://your-production-domain.com`
   - **Redirect URLs**: 
     - `https://your-production-domain.com/auth/callback`
     - `https://your-production-domain.com/`

## Step 10: Storage Permissions (RLS)

Supabase uses Row Level Security (RLS) for storage. By default:
- Files in `app-storage` bucket are public if RLS is disabled
- To make them private, enable RLS and set policies

For now, the `app-storage` bucket is public. Update in Supabase Console if needed.

## Troubleshooting

### Database Connection Issues
```
Error: ECONNREFUSED
```
- Check `DATABASE_URL` format
- Ensure Supabase project is running
- Verify credentials are correct

### Authentication Not Working
```
Error: Unauthorized
```
- Check `SUPABASE_JWT_SECRET` matches Supabase settings
- Verify token is being sent in Authorization header
- Check browser cookies have `access_token`

### Storage Upload Fails
```
Error: Bucket not found
```
- Run `npm run dev` to initialize buckets
- Or manually create bucket in Supabase Console

### CORS Issues
- Supabase handles CORS automatically for authenticated requests
- If using public bucket, ensure it's configured in Supabase

## Migration Checklist

- [ ] Created Supabase project
- [ ] Copied API keys to `.env`
- [ ] Imported database schema
- [ ] Ran `npm install`
- [ ] Tested locally (`npm run dev`)
- [ ] Set up auth provider (Email/OAuth)
- [ ] Created storage bucket
- [ ] Deployed to production
- [ ] Updated Supabase redirect URLs
- [ ] Tested production auth flow
- [ ] Users can upload/download files
- [ ] Rewards and orders work

## API Changes Summary

### Before (Replit)
```
POST /api/login → Replit OpenID Connect
GET /api/logout → Replit session logout
GET /api/auth/user → Passport session
```

### After (Supabase)
```
GET /api/login → Supabase URL redirect
GET /api/auth/callback?code=... → Exchange code for JWT
GET /api/logout → Clear JWT cookie
GET /api/auth/user → Return user from JWT
```

## File Upload Changes

### Before
```typescript
// Google Cloud Storage via Replit sidecar
POST /api/uploads → GCS + ACL management
```

### After
```typescript
// Supabase Storage
POST /api/storage/upload → Direct Supabase upload
POST /api/storage/public-url → Get public URL
POST /api/storage/signed-url → Get temporary signed URL
```

## Questions?

- Check Supabase docs: https://supabase.com/docs
- Check Drizzle docs: https://orm.drizzle.team
- Create an issue in this repo

---

**Last Updated:** January 16, 2026
