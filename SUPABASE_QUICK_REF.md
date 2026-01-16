# Supabase Migration - Quick Reference

## Files Created/Modified

### New Files Created
1. **`server/supabase-client.ts`** - Supabase client for server operations
2. **`server/supabase-auth.ts`** - JWT-based authentication middleware (replaces Replit auth)
3. **`server/supabase-storage.ts`** - File storage service (replaces Google Cloud Storage)
4. **`server/supabase-storage-routes.ts`** - Storage API routes
5. **`client/src/lib/supabase.ts`** - Client-side Supabase initialization
6. **`.env.example`** - Environment variables template
7. **`SUPABASE_MIGRATION.md`** - Complete migration guide

### Modified Files
1. **`package.json`**
   - Removed: `openid-client`, `@google-cloud/storage`, `stripe-replit-sync`
   - Added: `@supabase/supabase-js`, `@supabase/auth-helpers-react`, `jsonwebtoken`, `multer`

2. **`server/index.ts`**
   - Removed Stripe replit-sync initialization code
   - Kept core Express setup

3. **`server/routes.ts`**
   - Replaced `replit_integrations/auth` with `supabase-auth`
   - Replaced `replit_integrations/object_storage` with `supabase-storage-routes`

4. **`client/src/hooks/use-auth.ts`**
   - Updated logout to use fetch instead of direct redirect

### Removed Files (Can Delete)
- `server/replit_integrations/` (entire directory)
  - `auth/replitAuth.ts`
  - `auth/routes.ts`
  - `auth/storage.ts`
  - `auth/index.ts`
  - `object_storage/objectStorage.ts`
  - `object_storage/objectAcl.ts`
  - `object_storage/routes.ts`
  - `object_storage/index.ts`

## Key Changes at a Glance

### Authentication Flow
**Before (Replit):**
```
User → Replit OpenID → Passport Session → Express
```

**After (Supabase):**
```
User → Supabase JWT → HTTP Authorization Header → Express
```

### Storage Flow
**Before (Replit):**
```
File Upload → Replit Sidecar → Google Cloud Storage → ACL Policy Management
```

**After (Supabase):**
```
File Upload → Supabase Storage API → S3-Compatible Backend → RLS Policies
```

## Environment Variables (Copy to .env)

```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[copy from Supabase]
SUPABASE_SERVICE_ROLE_KEY=[copy from Supabase]
SUPABASE_JWT_SECRET=[copy from Auth Settings]
DATABASE_URL=postgresql://postgres:password@[host].supabase.co:5432/postgres
NODE_ENV=development
PORT=5000
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[same as SUPABASE_ANON_KEY]
VITE_APP_URL=http://localhost:5173
```

## Next Steps

1. **Create Supabase Project**
   - https://supabase.com
   - Copy API keys to `.env`

2. **Import Database**
   - Create new query in Supabase SQL Editor
   - Paste `backup.sql` contents

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Test Locally**
   ```bash
   npm run dev
   ```

5. **Deploy**
   - Vercel, Railway, Render, or your preferred host
   - Set environment variables

## API Endpoints (Updated)

| Endpoint | Method | Old | New |
|----------|--------|-----|-----|
| `/api/login` | GET | Replit OIDC | Supabase redirect |
| `/api/logout` | GET | Replit session clear | Clear JWT cookie |
| `/api/auth/user` | GET | Passport session | JWT parsing |
| `/api/storage/upload` | POST | GCS + ACL | Supabase Storage |
| `/api/storage/download/:id` | GET | GCS signed URL | Supabase stream |

## Important Notes

✅ All Replit-specific code has been removed
✅ JWT-based authentication (stateless, better for serverless)
✅ Supabase Storage instead of GCS (easier, integrated)
✅ Database connection preserved (same PostgreSQL)
✅ Session store no longer needed (using JWT instead)

⚠️ You need to set up OAuth providers in Supabase if you want Google/GitHub login
⚠️ File storage bucket will be created automatically on first run
⚠️ Existing user sessions from Replit will not carry over (users must re-login)

## Database Migration

The `backup.sql` includes:
- All tables (profiles, vendors, products, orders, etc.)
- User authentication data (from Replit sessions)
- Existing data

To import:
1. Open Supabase SQL Editor
2. Create new query
3. Skip the `_system.replit_database_migrations_v1` table
4. Paste and run the rest

## Troubleshooting

**Q: I see "Missing VITE_SUPABASE_URL"**
A: Set these in `.env`:
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-key]
```

**Q: Login keeps redirecting to Supabase**
A: Check that SUPABASE_JWT_SECRET is correct in .env and matches Supabase settings

**Q: File uploads fail**
A: 
- Run `npm run dev` to initialize buckets
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Verify bucket exists in Supabase Storage

**Q: Users can't authenticate on production**
A: Update redirect URLs in Supabase Auth settings to your production domain

---

See `SUPABASE_MIGRATION.md` for detailed instructions.
