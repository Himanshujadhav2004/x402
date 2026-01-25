# Vercel Deployment Guide

## ⚠️ Important Limitations

### WebSocket Support
**CRITICAL**: Vercel serverless functions do **NOT** support persistent WebSocket connections. Your backend uses Socket.io for real-time features, which will **NOT work** on Vercel's serverless platform.

**Solutions:**
1. **Use a separate WebSocket service** (recommended):
   - Deploy WebSocket server on Railway, Render, or DigitalOcean
   - Use Pusher, Ably, or similar WebSocket-as-a-Service
   - Use Vercel's Edge Functions with a different approach

2. **Use Server-Sent Events (SSE)** instead of WebSocket
3. **Use polling** as a fallback (already configured in your frontend)

## Deployment Steps

### 🎯 Recommended Order: Backend First, Then Frontend

**Why?** The frontend needs the backend URL to function, so deploy backend first to get its URL.

---

### Step 1: Deploy Backend (First)

1. **Navigate to backend directory:**
   ```bash
   cd x402/backend
   ```

2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy backend (preview):**
   ```bash
   vercel
   ```
   - This will give you a preview URL like: `https://your-backend-xxx.vercel.app`
   - **Save this URL** - you'll need it for the frontend!

5. **Set Initial Environment Variables in Vercel Dashboard:**
   - Go to your backend project → Settings → Environment Variables
   - Add these **before** production deploy:
     - `MONGODB_URI` - Your MongoDB connection string
     - `CORS_ORIGINS` - Set temporarily to `*` or `http://localhost:3000` (we'll update this later)
     - `NODE_ENV` - Set to `production`
     - `PLATFORM_WALLET` - (Optional) Your platform wallet address

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```
   - This gives you the production URL: `https://your-backend.vercel.app`
   - **Copy this URL** - you'll need it for frontend!

7. **Test backend:**
   - Visit: `https://your-backend.vercel.app/health`
   - Should return: `{"status":"ok","service":"x402-gateway"}`

---

### Step 2: Deploy Frontend (Second)

1. **Navigate to frontend directory:**
   ```bash
   cd x402/x402/frontend
   ```

2. **Deploy frontend (preview):**
   ```bash
   vercel
   ```
   - This will give you a preview URL like: `https://your-frontend-xxx.vercel.app`

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your frontend project → Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_API_URL` - Your backend production URL (from Step 1.6)
     - `NEXT_PUBLIC_WS_URL` - Same as API URL (or separate WebSocket service if you have one)
     - `NEXT_PUBLIC_TEMPLATE_CLIENT_ID` - Your Thirdweb client ID: `fe761f417614ce3ae4277baa4cfbf3e0`

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```
   - This gives you the production URL: `https://your-frontend.vercel.app`
   - **Copy this URL** - you'll need it for backend CORS!

---

### Step 3: Update Backend CORS (Final Step)

1. **Go back to Backend Vercel Dashboard:**
   - Settings → Environment Variables
   - Update `CORS_ORIGINS` to include your frontend URL:
     ```
     https://your-frontend.vercel.app,http://localhost:3000
     ```
   - Replace `your-frontend.vercel.app` with your actual frontend domain

2. **Redeploy backend:**
   ```bash
   cd x402/x402/backend
   vercel --prod
   ```

3. **Test everything:**
   - Frontend should load: `https://your-frontend.vercel.app`
   - API calls from frontend should work
   - Check browser console for any CORS errors

## Alternative: Deploy Backend Elsewhere

Since WebSocket won't work on Vercel, consider deploying the backend on:

### Option 1: Railway (Recommended for WebSocket)
- Supports persistent connections
- Easy MongoDB integration
- Free tier available

### Option 2: Render
- Supports WebSocket
- Free tier available
- Easy deployment

### Option 3: DigitalOcean App Platform
- Full Node.js support
- WebSocket support
- Pay-as-you-go

## Hybrid Approach (Recommended)

1. **Deploy Frontend on Vercel** ✅ (Perfect for Next.js)
2. **Deploy Backend on Railway/Render** ✅ (For WebSocket support)
3. **Update CORS_ORIGINS** in backend to include your Vercel frontend URL

## Post-Deployment Checklist

- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] CORS configured correctly
- [ ] MongoDB connection working
- [ ] API endpoints accessible
- [ ] Frontend can connect to backend API
- [ ] WebSocket alternative implemented (if needed)

## Testing

After deployment, test:
1. Health endpoint: `https://your-backend.vercel.app/health`
2. API docs: `https://your-backend.vercel.app/api/docs`
3. Frontend loads correctly
4. API calls from frontend work

## Troubleshooting

### Backend Issues
- **500 errors**: Check MongoDB connection string
- **CORS errors**: Verify `CORS_ORIGINS` includes your frontend URL
- **WebSocket not working**: Expected on Vercel - use alternative service

### Frontend Issues
- **API calls failing**: Check `NEXT_PUBLIC_API_URL` is set correctly
- **Build errors**: Check all environment variables are set
- **WebSocket connection fails**: Expected - implement fallback or use separate service
