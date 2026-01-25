# Fixing 404 Error on Vercel

## The Problem
You're getting a 404 error because Vercel is not detecting your Next.js app correctly. This usually happens when:
1. Deploying from the wrong directory
2. Vercel project has wrong root directory configured

## Solution 1: Deploy from Frontend Directory (Recommended)

### Option A: Using Vercel CLI

1. **Navigate to the frontend directory:**
   ```bash
   cd x402/frontend
   ```

2. **Make sure you're in the right directory:**
   ```bash
   # You should see package.json, next.config.mjs, src/ folder
   ls
   ```

3. **Deploy from this directory:**
   ```bash
   vercel
   ```

4. **If you already have a project linked, unlink and redeploy:**
   ```bash
   vercel unlink
   vercel
   ```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your repository
4. **IMPORTANT**: In project settings, set:
   - **Root Directory**: `/x402/frontend`
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install` (or leave default)

5. Add environment variables:
   - `NEXT_PUBLIC_API_URL` - Your backend URL
   - `NEXT_PUBLIC_WS_URL` - Your WebSocket URL
   - `NEXT_PUBLIC_TEMPLATE_CLIENT_ID` - `fe761f417614ce3ae4277baa4cfbf3e0`

6. Click "Deploy"

## Solution 2: Fix Existing Project

If you already deployed and it's showing 404:

1. Go to your Vercel project dashboard
2. Go to **Settings** → **General**
3. Find **Root Directory** setting
4. Change it to: `/x402/frontend`
5. Click **Save**
6. Go to **Deployments** tab
7. Click the **three dots** (⋯) on the latest deployment
8. Click **Redeploy**

## Solution 3: Check Build Logs

1. Go to your Vercel project
2. Click on the failed deployment
3. Check the **Build Logs** tab
4. Look for any errors like:
   - "Cannot find module"
   - "Build failed"
   - "Missing dependencies"

## Common Issues

### Issue: "Cannot find module 'next'"
**Fix**: Make sure `package.json` is in the root directory that Vercel is using.

### Issue: Build succeeds but 404 on site
**Fix**: Check that Root Directory is set to `x402/x402/frontend` in Vercel settings.

### Issue: Environment variables not working
**Fix**: Make sure all `NEXT_PUBLIC_*` variables are set in Vercel dashboard.

## Quick Test

After fixing, test your deployment:
1. Visit: `https://your-project.vercel.app`
2. Should see your landing page, not 404
3. Check browser console for any errors

## Still Not Working?

1. Check if build is successful in Vercel dashboard
2. Verify `package.json` has correct build script: `"build": "next build"`
3. Make sure `next.config.mjs` exists in the frontend directory
4. Try creating a new Vercel project from scratch
