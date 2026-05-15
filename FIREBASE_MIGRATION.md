# Firebase Backend Notes

The backend now uses Firebase Firestore through the Firebase Admin SDK.

## Live API

`https://backend-3mp3.onrender.com/api`

## Collections

- `products`
- `services`
- `reviews`
- `contactMessages`
- `quoteRequests`

## Render Environment

Set these variables in Render:

```bash
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-frontend.onrender.com,http://localhost:5174
FIREBASE_API_KEY=AIzaSyCJ3dtb_nv5zstIVtRgbDbvoJQE7e3cPN4
FIREBASE_AUTH_DOMAIN=ebackend-66bde.firebaseapp.com
FIREBASE_PROJECT_ID=ebackend-66bde
FIREBASE_STORAGE_BUCKET=ebackend-66bde.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=172774872527
FIREBASE_APP_ID=1:172774872527:web:a1ed1f7ca9c0499aff6eba
FIREBASE_MEASUREMENT_ID=G-5EDHEHCKQN
FIREBASE_SERVICE_ACCOUNT_JSON=paste-your-service-account-json-here
```

Use `/admin` in the React app to manage products, services, reviews, messages, and quote requests.
