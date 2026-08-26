# AGENTS.md — RentNest Backend

Node.js v24 + Express v5 + TypeScript (strict) + Prisma v6 + NeonDB (Postgres). Payments via Stripe and SSLCommerz. Deployed to Vercel serverless.

## Commands (source of truth: package.json)
- `npm run dev` — tsx watch on `src/server.ts`, server on `http://localhost:5000`.
- `npm run build` — runs `prisma generate` THEN `tsc`. Prisma client must be generated before typechecking/compile.
- `npm start` — `node dist/server.js` (production entry).
- `npm run prisma:migrate` — `prisma migrate dev`. `npm run prisma:seed` — seeds via `tsx prisma/seed.ts`.
- `npm run webhook:stripe` — forwards Stripe webhooks to `localhost:5000/api/payments/webhook`.
- `postinstall` auto-runs `prisma generate`; run it manually after pulling if `@prisma/client` is missing.

There is **no test suite, linter, or formatter configured** — the only verification step is `npm run build` (tsc strict). Do not invent a test/lint command.

## TypeScript gotchas (tsconfig.json)
- `verbatimModuleSyntax: true` — type-only imports MUST use `import type`; mixing value+type requires inline `type` (e.g. `import Stripe from "stripe"` value, `import type { Response }`).
- `exactOptionalPropertyTypes: true` — cannot assign `undefined` to an optional property explicitly.
- `noUncheckedIndexedAccess: true` — indexed access yields `T | undefined`; narrow before use.
- `module: esnext` + `moduleResolution: bundler`, but `package.json` is `"type": "commonjs"`. `tsc` emits ESM (`import`/`export`), so `node dist/server.js` may fail locally under the commonjs type — `npm run dev` (tsx) avoids this. Verify before relying on `npm start`.

## Architecture
- Entry: `src/server.ts` -> `src/app.ts` mounts routers under `/api/*` (`/api/auth`, `/api/properties`, `/api/rentals`, `/api/landlord`, `/api/payments`, `/api/admin`, `/api/reviews`).
- Layering: `routes/` -> `controllers/` -> (Prisma directly, or `services/` for payment/external). Each controller wraps logic in try/catch and calls `next(error)`.
- Global `errorHandler` middleware uses `AppError(status, message)` for all thrown errors.
- Auth: `authenticate` (async) extracts `Authorization: Bearer <token>`, validates Bearer scheme, checks `isBanned` via DB lookup, sets `req.user = { id, role }`. `authorize(...roles)` enforces `TENANT | LANDLORD | ADMIN`.
- Validation convention: `validate(schema)` wraps the request as `{ body, query, params }`, runs a Zod object, and **strips unknown fields** by reassigning `req.body`, `req.query`, `req.params` to the parsed output. This prevents mass-assignment. New schemas must nest fields under `body:`/`query:`/`params:` keys (see `src/validations/auth.validation.ts`), not validate `req.body` directly.
- Env validated in `src/config/env.ts` via Zod: requires `DATABASE_URL` (valid URL), `JWT_SECRET` (>=32 chars), `STRIPE_SECRET_KEY` (starts with `sk_`), `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`). Add new required vars there, not just in `.env`.
- `app.ts` JSON parser preserves `rawBody` via verify callback — required for Stripe webhook signature verification. Do not remove this.

## Database / Prisma
- Schema: `prisma/schema.prisma` (Postgres). `prisma.config.ts` loads `dotenv/config` and points the datasource at `DATABASE_URL`.
- `.env` is gitignored and currently contains real secrets — never commit it.

## Deployment
- Vercel: `vercel.json` routes all paths to `dist/server.js` (built via `npm run build`). Ensure `DATABASE_URL`, `JWT_SECRET`, `STRIPE_*` etc. are set in Vercel project env.
