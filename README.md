# Akiwa Backend

Express backend using MongoDB through Mongoose. Uploaded files are stored in MongoDB GridFS and served through the API.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Then open `backend/.env` and set `MONGODB_URI` to your local or MongoDB Atlas connection string.
Set `API_BASE_URL` to the public API URL when deploying so uploaded file links resolve correctly.

## Database

The API uses MongoDB collections for products, services, reviews, contact messages, quote requests, users, addresses, orders, site settings, categories, banners, blog posts, and freelance requests.

Uploaded files use the `uploads` GridFS bucket. The API stores only `/api/files/:id` URLs in MongoDB.

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
