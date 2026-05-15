# Akiwa Backend

Express + Prisma backend for Supabase Postgres.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and replace `YOUR-PASSWORD` with your real Supabase database password.

## Database

```bash
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

For local development with migration creation:

```bash
npm run prisma:migrate
```

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
