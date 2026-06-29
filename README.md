# Akiwa Backend

Express backend using Firebase Realtime Database and Firebase Storage through the Firebase Admin SDK.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Then open `backend/.env` and add Firebase Admin credentials:
- `FIREBASE_SERVICE_ACCOUNT_JSON` (preferred), or
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`, or
- set `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` to a local service account JSON file.

Set `FIREBASE_DATABASE_URL` to your Firebase Realtime Database URL and `FIREBASE_STORAGE_BUCKET` to the Firebase Storage bucket name.

For production on Render, add `FIREBASE_SERVICE_ACCOUNT_JSON` from Firebase Console → Project Settings → Service Accounts → Generate new private key.

## Database

Realtime Database paths used by the API include `products`, `services`, `reviews`, `contactMessages`, `quoteRequests`, `users`, `addresses`, `orders`, and `siteSettings/home`.

Uploaded images are stored in Firebase Storage. The API stores only Firebase download URLs in Realtime Database.

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
