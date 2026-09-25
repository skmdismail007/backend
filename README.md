# Akiwa Backend

Express backend using MySQL/MariaDB through mysql2. Uploaded files are stored in the database and served through the API.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Then open `backend/.env` and set the `MYSQL_*` variables. Never commit `MYSQL_PASSWORD`.
Set `API_BASE_URL` to the public API URL when deploying so uploaded file links resolve correctly.

## Database

The API stores products, services, reviews, contact messages, quote requests, users, addresses, orders, site settings, categories, banners, blog posts, and freelance requests in `app_records`. The JSON payload preserves the existing API shapes.

Uploaded files use the `uploads` table. The API stores only `/api/files/:id` URLs in `app_records`.

Run `schema.sql` manually if the database user cannot create tables. The server also creates these tables automatically when it connects.

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
