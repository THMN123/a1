# Complete Replit → Supabase Migration Checklist

## Phase 1: Preparation ✅ DONE

- [x] Audit existing Replit integrations
- [x] Created Supabase Auth implementation (JWT-based)
- [x] Created Supabase Storage implementation  
- [x] Updated dependencies (package.json)
- [x] Updated import statements in routes.ts
- [x] Created environment configuration template
- [x] Created comprehensive migration guides

## Phase 2: Setup (DO THIS NEXT)

### Part A: Supabase Project Creation
- [ ] Go to https://supabase.com
- [ ] Sign up / Log in
- [ ] Create new project
- [ ] Note down: Project URL, Anon Key, Service Role Key, JWT Secret

### Part B: Environment Configuration
- [ ] Create `.env` file in root directory
- [ ] Copy variables from `.env.example`
- [ ] Fill in SUPABASE_URL
- [ ] Fill in SUPABASE_ANON_KEY
- [ ] Fill in SUPABASE_SERVICE_ROLE_KEY
- [ ] Fill in SUPABASE_JWT_SECRET
- [ ] Fill in DATABASE_URL (from Supabase project settings)
- [ ] Verify NODE_ENV=development for local testing

### Part C: Database Migration
- [ ] Open Supabase SQL Editor
- [ ] Create new blank query
- [ ] Open `backup.sql` file from your repo
- [ ] Skip the `_system.replit_database_migrations_v1` table section
- [ ] Paste remaining SQL and run it
- [ ] Wait for completion (usually <1 minute)
- [ ] Verify tables exist in Supabase Tables view

### Part D: Local Testing
- [ ] Run `npm install` in terminal
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173 in browser
- [ ] Test login flow (click "Login")
- [ ] Verify you can reach Supabase auth
- [ ] Test creating a profile
- [ ] Test file upload if available
- [ ] Run `npm run check` to verify no TypeScript errors

## Phase 3: Production Deployment

### Option A: Vercel (Easiest)
- [ ] Push code to GitHub
- [ ] Go to https://vercel.com
- [ ] Import project from GitHub
- [ ] Add environment variables in Vercel dashboard:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] SUPABASE_JWT_SECRET
  - [ ] DATABASE_URL
  - [ ] NODE_ENV=production
- [ ] Click Deploy
- [ ] Wait 3-5 minutes
- [ ] Visit your deployed URL

### Option B: Railway
- [ ] Push code to GitHub
- [ ] Go to https://railway.app
- [ ] Create new project
- [ ] Import from GitHub
- [ ] Add environment variables (same as above)
- [ ] Railway auto-deploys
- [ ] Visit your Railway URL

### Option C: Render
- [ ] Push code to GitHub
- [ ] Go to https://render.com
- [ ] Create new Web Service
- [ ] Connect GitHub
- [ ] Add environment variables
- [ ] Render auto-deploys
- [ ] Visit your render URL

### Option D: Manual/Dedicated Server
- [ ] Deploy code to your server
- [ ] Set environment variables (export in shell)
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run start`
- [ ] Use PM2 or similar for process management
- [ ] Configure domain DNS

## Phase 4: Post-Deployment Configuration

### Supabase Auth Settings
- [ ] Go to Supabase Dashboard → Authentication
- [ ] Go to Settings
- [ ] Update "Site URL" to your production domain
- [ ] Add "Redirect URL" entries:
  - [ ] https://yourdomain.com/auth/callback
  - [ ] https://yourdomain.com/
  - [ ] http://localhost:5173 (for local dev)

### Optional: OAuth Providers
- [ ] Go to Supabase → Authentication → Providers
- [ ] Enable "Email Provider" (simple email/password)
- [ ] (Optional) Add Google OAuth:
  - [ ] Create Google OAuth app
  - [ ] Copy Client ID and Secret to Supabase
  - [ ] Users can now sign in with Google
- [ ] (Optional) Add GitHub OAuth:
  - [ ] Create GitHub OAuth app
  - [ ] Copy credentials to Supabase
  - [ ] Users can now sign in with GitHub

### Storage Configuration
- [ ] Verify `app-storage` bucket exists in Supabase Storage
- [ ] Test file upload on production
- [ ] Verify files are publicly accessible
- [ ] (Optional) Set up RLS policies if you want private files

## Phase 5: Data Verification

- [ ] Verify all users can be seen in Supabase Auth users list
- [ ] Verify all profiles in database
- [ ] Verify all vendors in database
- [ ] Verify all products in database  
- [ ] Test creating a new order
- [ ] Test uploading a profile image
- [ ] Test vendor dashboard functionality
- [ ] Test rewards system
- [ ] Test wallet functionality

## Phase 6: Cleanup (Optional)

- [ ] Delete `server/replit_integrations/` folder (no longer needed)
- [ ] Remove any Replit-specific environment variables from your system
- [ ] Archive backup.sql or store safely
- [ ] Document your final deployment process

## Phase 7: User Communication

- [ ] Send email to users: "New login required (30 seconds)"
- [ ] Update login page with helpful message
- [ ] Monitor error logs for first week
- [ ] Be ready to help users reset passwords if needed

## Rollback Plan (If Needed)

If something goes wrong:
1. [ ] Stop production deployment
2. [ ] Roll back to previous version (if using Vercel/Railway, one-click rollback)
3. [ ] Or redeploy old code to your server
4. [ ] Database is unaffected, can try again

---

## Files to Review

Before starting, read these in order:
1. **START_HERE.md** ← You are here
2. **SUPABASE_MIGRATION.md** ← Detailed guide
3. **SUPABASE_QUICK_REF.md** ← Quick reference

## Quick Command Reference

```bash
# Local development
npm install          # Install all dependencies
npm run dev         # Start dev server

# Type checking
npm run check       # Check TypeScript errors

# Database
npm run db:push     # Push Drizzle migrations

# Production
npm run build       # Build for production
npm run start       # Start production server
```

## Environment Variables Summary

```
SUPABASE_URL                 → Your Supabase project URL
SUPABASE_ANON_KEY           → Anon/Public key (safe for client)
SUPABASE_SERVICE_ROLE_KEY   → Service key (server only!)
SUPABASE_JWT_SECRET         → For JWT verification
DATABASE_URL                → PostgreSQL connection string
NODE_ENV                    → development or production
PORT                        → Server port (default 5000)
VITE_SUPABASE_URL           → (Client) Your Supabase URL
VITE_SUPABASE_ANON_KEY      → (Client) Anon key
VITE_APP_URL                → (Client) Your app URL
```

## Estimated Timeline

- Phase 1 (Prep): ✅ Already done!
- Phase 2 (Setup): 20-30 minutes
- Phase 3 (Deploy): 5-15 minutes  
- Phase 4 (Config): 10 minutes
- Phase 5 (Verify): 10-20 minutes
- Phase 6 (Cleanup): 5 minutes
- Phase 7 (Users): 5 minutes

**Total: ~1-1.5 hours**

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Auth Guide: https://supabase.com/docs/guides/auth
- Supabase Storage: https://supabase.com/docs/guides/storage
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Express.js: https://expressjs.com
- React Docs: https://react.dev

---

## Getting Help

If you get stuck:
1. Check the error message carefully
2. Search Supabase docs for the specific error
3. Review the relevant section in SUPABASE_MIGRATION.md
4. Check environment variables are set correctly
5. Verify Supabase project is active and running

---

**Status: Ready to Launch!** 🚀

Start with Phase 2 Part A.
