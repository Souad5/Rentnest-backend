# AGENTS.md — RentNest Backend

Node.js v24 + Express v5 + TypeScript (strict) + Prisma v6 + NeonDB (Postgres). Payments via Stripe. AI via Claude (`@anthropic-ai/sdk`). Deployed to Vercel serverless.

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
- Entry: `src/server.ts` (local) and `api/index.ts` (serverless) -> `src/app.ts`, which imports `env` (validation runs for both entries), applies `helmet`, CORS (allow-list from `CLIENT_URL`, allow-all when unset) and mounts routers under `/api/*` (`/api/auth`, `/api/properties`, `/api/rentals`, `/api/landlord`, `/api/payments`, `/api/admin`, `/api/reviews`, `/api/ai`, and `/api` for `/newsletter` + `/contact`). Unknown routes -> JSON 404.
- Layering: `routes/` -> `controllers/` -> Prisma or `services/`. Each controller wraps logic in try/catch and calls `next(error)`.
- **Prisma singleton**: always `import { prisma } from "../lib/prisma"`. Never `new PrismaClient()` in `src/` (each instance opens its own pool; exhausts Neon connections). Only `prisma/seed.ts` creates its own client.
- Services: `property.service.ts` (PropertySummary shape, `getRatingMap` via `review.groupBy`, `resolveImages` keeps `imageUrl` = `images[0]`), `rental.service.ts` (`findOverlappingRental` for APPROVED/ACTIVE date overlap), `stats.service.ts` (admin stats, reused by AI insights), `ai.service.ts` (Claude client + prompts).
- Property create/update/delete handlers live only in `property.controller.ts`; `/landlord/properties/*` routes reuse them.
- Global `errorHandler`: `AppError(status, message)` for thrown errors; maps Zod -> 400, Prisma `P2002` -> 409, `P2025` -> 404, `P2003` -> 400, Stripe errors -> 402/502. Status codes from other third-party errors are NOT forwarded (500). In production, non-AppError 500s return "Internal Server Error".
- Auth: `authenticate` (async) extracts `Authorization: Bearer <token>`, re-reads `role`/`isBanned` from the DB, sets `req.user = { id, role }`. `authorize(...roles)` enforces `TENANT | LANDLORD | ADMIN`.
- Rate limits (`middlewares/rateLimit.ts`): `authLimiter` (20/15 min) on login/register/google, `aiLimiter` (30/min) on `/api/ai`, `publicFormLimiter` on newsletter/contact. `trust proxy` is 1 (Vercel).
- Validation convention: `validate(schema)` wraps the request as `{ body, query, params }`, runs a Zod object, and **strips unknown fields** by reassigning `req.body` and `req.params`. New schemas must nest fields under `body:`/`query:`/`params:` keys. **Express 5 `req.query` is a getter — never assign to it**; parse query params in controllers with `utils/query.ts` (`queryInt`, `queryNumber`, `queryString`, `queryEnum`; invalid values are ignored).
- Chart data: `utils/months.ts` builds zero-filled "last 6 calendar months" `MonthPoint` series (`month: 'YYYY-MM'`, `label: 'May'`, UTC). Revenue/earnings = COMPLETED payments bucketed by `paidAt`.
- Env validated in `src/config/env.ts` via Zod: requires `DATABASE_URL` (valid URL), `JWT_SECRET` (>=32 chars), `STRIPE_SECRET_KEY` (starts with `sk_`), `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`); optional `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `CLIENT_URL` (comma-separated origins). Use `env.X`, not `process.env.X`. Add new vars there, not just in `.env`.
- `app.ts` JSON parser preserves `rawBody` via verify callback — required for Stripe webhook signature verification. Do not remove this.
- Payments: `applySucceededPayment` is the single idempotent settlement path (confirm endpoint + webhook); it only flips APPROVED -> ACTIVE. `createPaymentIntent` refuses rentals whose payment is already COMPLETED. Webhook processing errors return 500 so Stripe retries.

## AI (`src/services/ai.service.ts`)
- Model `claude-opus-5-5` (no date suffix). Thinking is always on for this model: never send `thinking: {type:"disabled"}`, `budget_tokens`, `temperature`/`top_p`, or an assistant prefill (all 400). Cost/latency is controlled with `output_config.effort` (`low` for search suggestions and chat, `medium` for descriptions and admin insights).
- Calls go through `client.beta.messages.create` with `betas: ["server-side-fallback-2026-07-01"]` + `fallbacks: "default"` (server-side refusal fallback) and structured output via `output_config.format` built from `betaZodOutputFormat(schema)`. `stop_reason === "refusal"` is checked before reading content; output is re-validated with Zod.
- Client is created lazily only when `ANTHROPIC_API_KEY` is set (`timeout: 20_000` ms, `maxRetries: 1`). Errors are classified with typed SDK classes (`Anthropic.RateLimitError`, `APIConnectionError`, `APIError`, ...), never string matching. Failures return a typed reason; controllers map them to 503/502/422 (chat refusals return a polite reply).
- Stable system prompts first (site facts), volatile catalog snapshot (≤30 available listings, cached 60s) in the user turn. Chat only returns property ids present in the snapshot.

## Database / Prisma
- Schema: `prisma/schema.prisma` (Postgres). `prisma.config.ts` loads `dotenv/config` and points the datasource at `DATABASE_URL`.
- After schema changes run `npx prisma db push` (or `npm run prisma:migrate`) against the target DB; there is no migrations folder yet.
- `prisma/seed.ts` is idempotent (properties matched by title, rentals by tenant+property, payments by rental, reviews by tenant+property). Dates are relative to "now" so charts have data. Image URLs in the seed were verified to return HTTP 200.
- `.env` is gitignored and currently contains real secrets — never commit it.

## Deployment
- Vercel: `vercel.json` routes all paths to `dist/server.js` (built via `npm run build`). Ensure `DATABASE_URL`, `JWT_SECRET`, `STRIPE_*` etc. are set in Vercel project env.
