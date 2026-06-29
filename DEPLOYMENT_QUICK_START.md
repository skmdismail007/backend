# Quick Deployment Reference

## Your Start Command
```
npm start
```

## What This Does When You Deploy to Render

### 1. Build Phase (Automatic)
```bash
npm install          # Downloads all dependencies
                     # Takes 2-5 minutes
```

### 2. Start Phase (Your Command Runs)
```bash
npm start            # This is YOUR START COMMAND
  ↓
node server.js       # Starts Express server
  ↓
Backend API running on https://backend-3mp3.onrender.com
  ↓
Render exposes publicly at:
https://backend-3mp3.onrender.com
```

### 3. Health Check
Render automatically checks if your app is healthy:
```
GET https://backend-3mp3.onrender.com/api/health

Expected Response:
{
  "service": "akiwa-backend",
  "status": "ok"
}
```

### 4. Running
Your backend is now live 24/7!

---

## Environment Variables Needed on Render

Copy these to Render Dashboard → Your Service → Environment:

```
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-frontend-url.onrender.com
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

---

## Deployment Timeline

| Stage | Duration | Status |
|-------|----------|--------|
| Code pushed to GitHub | Instant | ✅ Complete |
| Build starts | 0-5 sec | 🔄 Building... |
| npm install | 2-5 min | 📦 Installing deps |
| npm start runs | 2-5 sec | 🚀 Starting server |
| Health checks | 5-10 sec | 💚 Verifying |
| **LIVE!** | - | ✅ **Ready** |

**Total Time: 5-15 minutes**

---

## Real Example Output You'll See

```
[Render Deploy Log]

Build started...

$ npm install
added 85 packages in 3m 42s

npm start...

> nexora-backend@1.0.0 start
> node server.js

Backend API running on https://backend-3mp3.onrender.com

✓ Service is live
✓ Deployed to: https://backend-3mp3.onrender.com
```

---

## After Deployment - Update Your Frontend

Change your API base URL from:
```javascript
// OLD (Local Development)
const API_URL = 'https://backend-3mp3.onrender.com/api'

// NEW (Production on Render)
const API_URL = 'https://backend-3mp3.onrender.com/api'
```

---

## Debugging Common Issues

### Service Won't Start
1. Check logs in Render dashboard
2. Verify all env variables are set
3. Test locally: `npm start`

### 502 Bad Gateway Error
- Firebase Admin credential issue
- Check FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON
- Verify Realtime Database is enabled in Firebase
- Verify Firebase Storage is enabled in Firebase

### CORS Errors
- Update CORS_ORIGIN in env variables
- Match your frontend URL exactly

### Still Broken?
1. Check Render logs (very detailed)
2. Try redeploying
3. Check GitHub Actions for build errors

---

## Your Package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",           // For production (Render uses this)
    "dev": "nodemon server.js"           // For local development
  }
}
```

✅ Your `npm start` is correctly configured for Render!

---

## Quick Checklist for Going Live

- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Create Web Service
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Add environment variables
- [ ] Deploy
- [ ] Check logs
- [ ] Test API endpoints
- [ ] Update frontend URLs

You're ready to deploy! 🚀
