# Replit to Supabase Migration Plan

## Overview
This document outlines the complete migration from Replit to Supabase.

## Migration Steps

### 1. **Supabase Setup**
- Create new Supabase project
- Get API URL and Anon Key
- Get Service Role Key (for server operations)

### 2. **Database Migration**
- Import existing schema using backup.sql
- Push Drizzle migrations
- Verify all tables and data

### 3. **Authentication**
- Replace Replit Auth (OpenID Connect) with Supabase Auth
- Update client-side auth (use supabase-js)
- Update server-side auth middleware
- Migrate user sessions to Supabase Auth

### 4. **File Storage**
- Create Supabase Storage buckets
- Replace Google Cloud Storage integration
- Update file upload/download logic

### 5. **Dependencies & Code**
- Add: `@supabase/supabase-js`, `@supabase/auth-helpers-react`
- Remove: Replit-specific packages
- Update imports across codebase

### 6. **Environment Variables**
- Replace REPLIT_* vars with SUPABASE_* vars
- Update Node.js env config

### 7. **Hosting**
- Deploy to Vercel, Railway, or other Node.js host
- Update webhook configs

## Key Changes

### Before (Replit)
- Auth: OpenID Connect via Replit
- Storage: Google Cloud Storage with Replit sidecar
- Database: PostgreSQL via Replit
- File ACLs: Custom ObjectAclPolicy system
- Sessions: PostgreSQL session store

### After (Supabase)
- Auth: Supabase Auth (JWT-based)
- Storage: Supabase Storage (S3-compatible)
- Database: Same PostgreSQL, hosted on Supabase
- File Permissions: Supabase RLS policies
- Sessions: JWT tokens (no session store needed)

## Environment Variables (New)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
DATABASE_URL=postgresql://...
```
