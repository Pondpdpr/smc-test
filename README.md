# SMC Fullstack Engineer Take-Home

A chat app where signed-in users ask questions about the revenue/income of US public companies. Answers are strictly grounded in a Postgres table — the model can only cite numbers it actually queried, tool calls are rendered live in the UI as they happen, and replies stream token-by-token over SSE.

## What it does

- **Grounded Q&A, not vibes**: the model has exactly one tool, `query_financial_data`. It can't answer from general knowledge — every number in a reply comes from a real SQL query you can see in the UI. Zero rows back means "not available," never a guessed figure.
- **Streaming + live tool calls**: replies stream token-by-token; the SQL a tool call runs, and the rows it returns, render in the chat as they happen, not just at the end.
- **Stop mid-generation**: aborts the actual OpenAI connection (not just the local read), and still bills for the partial output actually generated (token-counted via `tiktoken`, not guessed from character counts).
- **Per-user spending limits**: configurable cap (default $1), resets on a rolling window (default 1h) via Redis key expiry — no cron job, Redis's own `EXPIRE` does the reset.
- **Auth with email verification**: sign-up requires clicking a verification link (sent via a RabbitMQ-backed worker) before sign-in works. Sessions use short-lived JWT access tokens (1h) plus a rotating httpOnly refresh cookie (7d) — the frontend silently refreshes on a 401 before ever bouncing someone back to a password prompt.
- **Chat management**: revisit past conversations, delete with confirmation, mobile-responsive sidebar.

## Architecture

**Backend** — NestJS, Kysely (not TypeORM/Prisma) over Postgres, Redis, RabbitMQ, OpenAI SDK.
```
backend/src/
  app/api/v1/<domain>/<action>/   REST endpoints - one folder per operation (dto + query|command)
  app/worker/                      RabbitMQ consumers (e.g. sending the verification email)
  domain/base/<entity>/            plain-object domain types + services per DB table
  domain/logic/<concern>/          cross-cutting business logic (chat orchestration, usage tracking)
  domain/queue/                    AMQP producers
  infra/global/<integration>/      external service wrappers (email, openai, amqp, cache)
```

**Frontend** — React + Vite + TypeScript, TanStack Query, Tailwind v4, shadcn/ui (on Base UI, not Radix).
```
frontend/src/
  pages/<page>/          one folder per page: <Page>.tsx (render only) + use-<page>.ts (hook, all logic)
  shared/api/<domain>/    <domain>.api.ts (fetch calls) + .hook.ts (useQuery/useMutation) + .type.ts
  shared/domain/          types mirroring the backend's DB-table shapes
  shared/lib/             axios client, auth context, query keys, utils
  components/             presentational components (Sidebar, MessageBubble, etc.)
```

## Prerequisites

- Docker + Docker Compose
- Node — pinned in `backend/package.json`'s `engines` field as a guideline; a patch mismatch is fine, `npm install` won't block on it
- An OpenAI API key

## Setup

Runs across 4 separate terminals (API, worker, and frontend are all long-running
processes that hold their terminal; the one-off seed commands can run from any
terminal once the API is up).

**Terminal 1 — infra (from repo root)**
```bash
docker compose up -d   # Postgres, Redis, RabbitMQ, Mailhog
```

**Terminal 2 — backend API**
```bash
cd backend
cp .env.example .env
# edit .env and set OPENAI_API_KEY
npm install
npm run build
npm run start
```

**Terminal 3 — backend worker** (sends the verification email — sign-up won't complete without it)
```bash
cd backend
npm run start:worker
```

**One-off, from `backend/`, once the API is up (either terminal above, or a new one)**
```bash
npm run cli financial-data:seed    # loads data/financial_data.sql - 48 companies, 2022-2025
npm run cli initials:seed          # optional: seeds superadmin@example.com / password, already verified
```

**Terminal 4 — frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run build
npm run preview
```

Then open **http://localhost:4173**. Either register a new account (the verification email lands in **Mailhog at http://localhost:8025** — no real inbox needed) or sign in with the seeded `superadmin@example.com` / `password`.

Migrations run automatically on backend boot (`main.ts`) — no separate migrate step needed.

For active development instead, `npm run dev` (backend, runs the API + worker together) and `npm run dev` (frontend, port 5173) give hot-reload without the build step.

## Key environment variables

**Backend (`backend/.env`)**

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Required for chat to work at all; model defaults to `gpt-4o-mini` |
| `USAGE_LIMIT_USD` / `USAGE_RESET_INTERVAL_SECONDS` | Per-user spend cap and reset window - lower these (e.g. `0.001` / `180`) for fast manual testing of the limit |
| `DATABASE_URL` / `REDIS_URL` / `AMQP_URL` | Point at the docker-compose services; defaults already match |
| `FRONTEND_URL` | Used to build the verification-email link |
| `JWT_SALT` | Signs access tokens - already set to a dev value in `.env.example` |
| `CORS_ORIGIN` | Comma-separated allowed origins; must include the frontend's origin(s) - defaults already cover `:5173` (dev) and `:4173` (preview) |

**Frontend (`frontend/.env`)** — `VITE_API_URL` (see `frontend/.env.example`) points the frontend straight at the backend (defaults to `http://localhost:3000`), rather than relying on Vite's dev/preview proxy. Every API call, including the SSE stream (raw `fetch`, not axios), is prefixed with it, which makes each request cross-origin from the browser's point of view - hence why the backend's `CORS_ORIGIN` above needs to list the frontend's port(s). For a real deployment with the frontend and backend on separate hosts, change `VITE_API_URL` to the backend's public URL and add the frontend's real origin to `CORS_ORIGIN`.

## Testing

```bash
cd backend && npm test     # vitest - spins up an ephemeral Postgres via testcontainers, needs Docker
```

The frontend has no automated test suite yet; changes were verified live via a real browser during development.

## Notable implementation details

- **Tool-calling grounding**: the model is forced (`tool_choice: 'required'`) to call the query tool on every turn rather than "recalling" a number from earlier context, and the tool description explicitly tells it to omit company filters for cross-company comparisons rather than only checking companies it already recognizes — both were real bugs found through live testing, not hypothetical.
- **SSE over `@Sse()`**: hand-rolled via raw Fastify `reply.raw.write()` calls, since Nest's built-in decorator doesn't fit a POST-triggered, non-`EventSource` stream (browsers can't `EventSource` a POST body).
- **Stop = a real abort**: clicking Stop calls `.abort()` on the OpenAI SDK's own request controller, which tears down the actual upstream connection — OpenAI stops generating and billing further tokens, it's not just the browser giving up on reading.
