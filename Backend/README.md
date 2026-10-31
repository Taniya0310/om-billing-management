# OM Enterprises Backend

Node.js API for authentication and trip management backed by PostgreSQL.

## Run

```bash
npm run dev
```

The API starts at `http://localhost:4000` by default. Copy `.env.example` to `.env`, verify the PostgreSQL connection string, and then start the server.

## API

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/trips`
- `POST /api/trips`
- `PATCH /api/trips/:id`
- `PATCH /api/trips/:id/advance`
- `DELETE /api/trips/:id`

SQL migrations are kept in the root `Migrations/` folder and run in filename order when the server starts.
