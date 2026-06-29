# Backend Deployment Guide - Render

## What is the "Start Command" in Render?

The **Start Command** is the command that Render executes when your app is deployed. It's what starts your application on the server.

For your Node.js Express backend:
```
npm start
```

This command runs `node server.js` which:
1. ✅ Loads your environment variables from `.env`
2. ✅ Initializes the Express app
3. ✅ Initializes Firebase Admin SDK for Realtime Database and Storage
4. ✅ Starts listening on port 4000
5. ✅ Outputs: `Backend API running on https://backend-3mp3.onrender.com`

---

## Deployment Steps to Render

### Step 1: Prepare Your Repository
```bash
# Make sure everything is committed to Git
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your GitHub repository

### Step 3: Create New Web Service
1. Click "New +" → "Web Service"
2. Select your repository
3. Fill in the configuration:

| Field | Value |
|-------|-------|
| **Name** | `nexora-backend` |
| **Environment** | `Node` |
| **Region** | Select closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or paid) |

### Step 4: Add Environment Variables
In Render Dashboard:
1. Go to your Web Service
2. Click "Environment"
3. Add these variables:

```
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.onrender.com
FIREBASE_API_KEY=AIzaSyCJ3dtb_nv5zstIVtRgbDbvoJQE7e3cPN4
FIREBASE_AUTH_DOMAIN=ebackend-66bde.firebaseapp.com
FIREBASE_PROJECT_ID=ebackend-66bde
FIREBASE_STORAGE_BUCKET=ebackend-66bde.firebasestorage.app
FIREBASE_DATABASE_URL=https://ebackend-66bde-default-rtdb.firebaseio.com
FIREBASE_MESSAGING_SENDER_ID=172774872527
FIREBASE_APP_ID=1:172774872527:web:a1ed1f7ca9c0499aff6eba
FIREBASE_MEASUREMENT_ID=G-5EDHEHCKQN
FIREBASE_SERVICE_ACCOUNT_JSON=paste-your-service-account-json-here
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render automatically deploys your app
3. View logs in real-time
4. Once deployed, you get a URL like: `https://backend-3mp3.onrender.com`

---

## What Happens During Deployment

### Timeline:
```
1. Build Phase (2-5 minutes)
   └─ npm install
   └─ Install all dependencies
   └─ Compile/prepare application

2. Start Phase
   └─ Execute: npm start
   └─ → node server.js
   └─ Backend API running on https://backend-3mp3.onrender.com
   └─ Render exposes on: https://backend-3mp3.onrender.com

3. Health Check
   └─ Render checks if app responds to requests
   └─ Monitors: GET / (returns status: 'ok')

4. Running
   └─ App serves requests 24/7
   └─ Auto-restarts on crashes
   └─ View logs in Render dashboard
```

---

## Troubleshooting Deployment

### ❌ Build Failed
**Error:** `npm install failed`
- **Fix:** Check `package.json` for syntax errors
- **Fix:** Ensure all dependencies are in `package.json`

### ❌ Service Won't Start
**Error:** `app failed to start`
- **Fix:** Check `.env` variables are all set
- **Check:** Firebase service account JSON is valid
- **Check:** Port is not hardcoded (use env.port)

### ❌ Service Crashes After Start
**Error:** `Service crashed with exit code X`
- **Check:** Database connection issues
- **Check:** Missing environment variables
- **Check:** Node version compatibility

### ✅ View Logs
In Render dashboard:
1. Click your Web Service
2. Scroll to "Logs"
3. See real-time output

---

## Your Current Start Command Configuration

**File:** `package.json`
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

✅ **Ready for Render!** This is correctly configured.

---

## Production Checklist

- [ ] All environment variables set in Render
- [ ] Realtime Database is enabled in Firebase
- [ ] Firebase Storage is enabled in Firebase
- [ ] FIREBASE_SERVICE_ACCOUNT_JSON is set in Render
- [ ] CORS_ORIGIN matches your frontend URL
- [ ] NODE_ENV=production
- [ ] Test health endpoint: `GET /api/health`
- [ ] Monitor first 24 hours for crashes

---

## After Deployment

### Test Your API
```bash
# Replace with your Render URL
curl https://backend-3mp3.onrender.com/api/health

# Expected response:
# {"service": "akiwa-backend", "status": "ok"}
```

### Update Frontend URL
In your React app, update API calls to:
```javascript
const API_URL = 'https://backend-3mp3.onrender.com/api'
```

### Monitoring
- Check Render dashboard regularly
- Set up email alerts for crashes
- Monitor database quota usage

---

## Free vs Paid Plan

| Feature | Free | Paid |
|---------|------|------|
| Uptime | Spins down after 15min inactivity | 24/7 uptime |
| Auto-deploy | ✅ | ✅ |
| Custom Domain | ✅ | ✅ |
| Support | Community | Priority |
| Bandwidth | 100GB/month | Based on plan |
| **Cost** | **Free** | **From $7/mo** |

---

## Next Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Render**
   - Visit https://render.com
   - Create account & connect GitHub

3. **Deploy**
   - Create new Web Service
   - Add environment variables
   - Click Deploy

4. **Verify**
   - Check deployment logs
   - Test API endpoints
   - Update frontend URLs

Your backend will be live in 5-10 minutes! 🚀
