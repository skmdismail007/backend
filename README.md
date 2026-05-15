# Akiwa Backend

Express backend using Firebase Firestore through the Firebase Admin SDK.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

For production on Render, add `FIREBASE_SERVICE_ACCOUNT_JSON` from Firebase Console → Project Settings → Service Accounts → Generate new private key.

## Database

Firestore collections used by the API: `products`, `services`, `reviews`, `contactMessages`, and `quoteRequests`.

## Run

```bash
npm run dev
```

## API Routes

- `GET /api/health`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/services`
- `POST /api/services`
- `GET /api/services/:id`
- `PATCH /api/services/:id`
- `DELETE /api/services/:id`
- `GET /api/customers/reviews`
- `POST /api/customers/reviews`
- `GET /api/customers/messages`
- `POST /api/customers/messages`
- `GET /api/customers/quotes`
- `POST /api/customers/quotes`
- `GET /api/search?q=cctv`

Admin authentication and the separate admin panel can be added next on top of these routes.
