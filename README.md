<div align="center">

# RentNest

### Modern Property Rental Backend API

A production-grade REST API for property rental marketplaces with Stripe payments, role-based access control, rental workflows with double-booking protection, dashboards, and Claude-powered AI features.

[![Node.js](https://img.shields.io/badge/Node.js-v24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com)

[Live API](https://rentnest-backend-five.vercel.app) · [Postman Collection](./postman/) · [Report Bug](https://github.com/Souad5/Rentnest-backend/issues)

</div>

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                              │
│              (Web, Mobile, Third-party Integrations)            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────┐
│                     VERCEL SERVERLESS                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Express v5 API                         │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   Auth   │  │Property  │  │ Rental   │  │ Payment  │ │  │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  │       │             │             │              │        │  │
│  │  ┌────▼─────────────▼─────────────▼──────────────▼─────┐ │  │
│  │  │              Prisma ORM + PostgreSQL                 │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │   Stripe Payments   │    │  Claude (Anthropic) │            │
│  └─────────────────────┘    └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### Authentication & Authorization
- **JWT-based authentication** with bcrypt password hashing (min 8 chars, letters + digits)
- **Google sign-in** — verifies Google ID tokens (`google-auth-library`) and links existing accounts by email
- **Profile & password management** — `PATCH /auth/me`, `PATCH /auth/password`
- **Role-based access control** (RBAC) for Tenants, Landlords, and Admins
- **Banned user detection** — suspended accounts blocked at middleware level (role/ban re-read from DB on each request)

### Property Management
- **Search, filters, sorting & pagination** — keyword, location, category, price range, bedrooms, minimum rating; sort by newest/oldest/price/rating/popularity
- **Rich listings** — image gallery (`images[]`, `imageUrl` mirrors the first image), bedrooms, bathrooms, area, amenities
- **Ratings on every listing** — `avgRating` and `reviewCount` on list and detail responses
- **Discovery endpoints** — categories with counts, top locations, trending, related listings, public marketplace stats
- **CRUD operations** with ownership verification (one shared handler set for `/properties/landlord/*` and `/landlord/properties/*`)

### Rental Request Workflow
- **Application pipeline** — Tenants submit, Landlords approve/reject (only `PENDING` requests can change)
- **Date validation** — start date today or later, end date after start date
- **Double-booking prevention** — requests and approvals overlapping an `APPROVED`/`ACTIVE` rental of the same property return `409`
- **Duplicate prevention** — One pending request per property per tenant
- **Self-rental protection** — Landlords cannot rent their own properties

### Payment Processing
- **Stripe integration** with PaymentIntents and webhooks
- **Idempotent settlement** — the confirm endpoint and the webhook share one idempotent transaction
- **No double charges** — a rental that is already paid cannot get a new PaymentIntent
- **Ownership verification** — the intent's tenant (or an admin) must match the caller before anything is written
- **Webhook signature verification** — failed processing returns `500` so Stripe retries safely
- **Refund handling** — refunded payments are marked `FAILED` and logged for follow-up

### Dashboards
- **Tenant** — request/payment stats and 6-month spending chart data
- **Landlord** — earnings, requests by status, top properties, payments received
- **Admin** — totals, 6-month users/rentals/revenue series, moderation of users, listings, categories, reviews, contact messages and newsletter subscribers

### AI (Claude via `@anthropic-ai/sdk`)
- **Smart search suggestions** — database matches first, plus natural-language suggestions and extracted filters
- **Rental assistant chat** — answers site questions and recommends only real, available listings
- **Listing description writer** for landlords, and **marketplace insights** for admins
- Degrades gracefully: without `ANTHROPIC_API_KEY` the search still returns database suggestions and the other AI endpoints return `503`

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js v24 | JavaScript execution environment |
| **Framework** | Express v5 | HTTP server with strict error handling |
| **Language** | TypeScript 7.0 | Type safety with strict mode |
| **ORM** | Prisma v6 | Database access with type-safe queries |
| **Database** | PostgreSQL (NeonDB) | Serverless relational database |
| **Authentication** | JWT + bcrypt | Token-based auth with secure hashing |
| **Payments** | Stripe | PaymentIntents + webhooks |
| **AI** | Claude (`@anthropic-ai/sdk`) | Search suggestions, assistant, copywriting, insights |
| **Security** | helmet, express-rate-limit, CORS | Headers, brute-force protection, origin allow-list |
| **Validation** | Zod v4 | Runtime schema validation |
| **Deployment** | Vercel | Serverless Functions with edge network |

---

## Getting Started

### Prerequisites

- **Node.js** v24.0.0 or higher
- **npm** v10.0.0 or higher
- **NeonDB account** (or PostgreSQL database)

### Installation

```bash
# Clone the repository
git clone https://github.com/Souad5/Rentnest-backend.git
cd Rentnest-backend

# Install dependencies
npm install

# Create a .env file with the variables below
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-key-min-32-chars"

# Stripe Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional: AI features (Claude). Unset = AI endpoints degrade gracefully.
ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Google sign-in (OAuth Web client ID). Unset = /auth/google returns 503.
GOOGLE_CLIENT_ID="1234567890-abc.apps.googleusercontent.com"

# Optional: comma-separated allowed CORS origins. Unset = allow all (local dev only).
CLIENT_URL="http://localhost:3000,https://your-frontend.vercel.app"
```

All variables are validated at startup in `src/config/env.ts`.

### Development

```bash
# Start development server with hot reload
npm run dev

# Server runs on http://localhost:5000
```

### Database Setup

The schema changed in this release (user profile/Google fields, property gallery & details, category descriptions, newsletter subscribers, contact messages). Apply it before starting the server:

```bash
# Sync the schema to your database (quickest)
npx prisma db push
# ...or create a migration instead
npm run prisma:migrate

# Seed demo data (idempotent — safe to re-run)
npm run prisma:seed

# Generate Prisma Client
npm run prisma:generate
```

Demo accounts created by the seed: `tenant@example.com` / `password123`, `john.landlord@example.com` / `password123`, `admin@rentnest.com` / `Admin@123456`.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## API Endpoints

All responses use `{ success, message, data, meta? }`; errors use `{ success: false, message, errorDetails }`.

### Authentication (login/register/google rate limited: 20 req / 15 min / IP)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register (TENANT or LANDLORD) | Public |
| `POST` | `/api/auth/login` | Login | Public |
| `POST` | `/api/auth/google` | Sign in with a Google ID token | Public |
| `GET` | `/api/auth/me` | Current user profile | Required |
| `PATCH` | `/api/auth/me` | Update name, phone, avatar, bio | Required |
| `PATCH` | `/api/auth/password` | Change (or set) password | Required |

### Properties
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/properties` | Search/filter/sort/paginate available listings | Public |
| `GET` | `/api/properties/categories` | Categories with available-listing counts | Public |
| `GET` | `/api/properties/locations` | Top locations with counts and a cover image | Public |
| `GET` | `/api/properties/stats` | Public marketplace numbers | Public |
| `GET` | `/api/properties/trending` | Most requested in the last 30 days | Public |
| `GET` | `/api/properties/:id` | Property details with reviews | Public |
| `GET` | `/api/properties/:id/related` | Similar listings | Public |
| `POST` | `/api/properties/landlord` | Create property | Landlord/Admin |
| `PUT` | `/api/properties/landlord/:id` | Update property | Landlord/Admin |
| `DELETE` | `/api/properties/landlord/:id` | Delete property | Landlord/Admin |

### Rentals
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/rentals` | Submit rental request | Tenant |
| `GET` | `/api/rentals/my-requests` | My rental requests | Tenant |
| `GET` | `/api/rentals/stats` | Tenant dashboard stats | Tenant |
| `GET` | `/api/rentals/:id` | Rental details | Tenant/Landlord/Admin |

### Landlord Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/landlord/stats` | Earnings, requests, top properties | Landlord/Admin |
| `GET` | `/api/landlord/payments` | Payments for my properties | Landlord/Admin |
| `GET` | `/api/landlord/properties` | List my properties | Landlord/Admin |
| `POST` | `/api/landlord/properties` | Create property (alias) | Landlord/Admin |
| `PUT` | `/api/landlord/properties/:id` | Update property (alias) | Landlord/Admin |
| `DELETE` | `/api/landlord/properties/:id` | Delete property (alias) | Landlord/Admin |
| `GET` | `/api/landlord/requests` | Requests for my properties | Landlord/Admin |
| `PATCH` | `/api/landlord/requests/:id` | Approve/reject a pending request | Landlord/Admin |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/payments/create` | Create (or resume) payment intent | Tenant |
| `POST` | `/api/payments/confirm` | Confirm payment | Tenant/Admin |
| `GET` | `/api/payments` | Payment history | Required |
| `GET` | `/api/payments/:id` | Payment details | Required |
| `POST` | `/api/payments/webhook` | Stripe webhook | Stripe signature |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/reviews/property/:propertyId` | Reviews + average for a property | Public |
| `GET` | `/api/reviews/latest` | Latest reviews (`limit`, `minRating`) | Public |
| `GET` | `/api/reviews/my` | My reviews | Tenant |
| `POST` | `/api/reviews` | Submit review | Tenant |

### Public forms
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/newsletter` | Subscribe to the newsletter | Public |
| `POST` | `/api/contact` | Send a contact message | Public |

### AI (rate limited: 30 req / min / IP)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/ai/status` | Whether AI is configured | Public |
| `POST` | `/api/ai/search-suggestions` | Search suggestions + extracted filters | Public |
| `POST` | `/api/ai/chat` | Rental assistant | Public |
| `POST` | `/api/ai/property-description` | Draft a listing description | Landlord/Admin |
| `GET` | `/api/ai/admin-insights` | Marketplace insights | Admin |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/stats` | Totals and 6-month series | Admin |
| `GET` | `/api/admin/users` | List users | Admin |
| `PATCH` | `/api/admin/users/:id` | Ban/unban user | Admin |
| `GET` | `/api/admin/properties` | List all properties | Admin |
| `PATCH` | `/api/admin/properties/:id` | Show/hide a listing | Admin |
| `DELETE` | `/api/admin/properties/:id` | Delete a listing | Admin |
| `GET` | `/api/admin/rentals` | List all rentals | Admin |
| `GET` | `/api/admin/payments` | List all payments | Admin |
| `GET` | `/api/admin/categories` | Categories with listing counts | Admin |
| `POST` | `/api/admin/categories` | Create category | Admin |
| `PUT` | `/api/admin/categories/:id` | Update category | Admin |
| `DELETE` | `/api/admin/categories/:id` | Delete category | Admin |
| `GET` | `/api/admin/reviews` | List reviews | Admin |
| `DELETE` | `/api/admin/reviews/:id` | Delete review | Admin |
| `GET` | `/api/admin/messages` | Contact messages | Admin |
| `PATCH` | `/api/admin/messages/:id` | Mark read/unread | Admin |
| `DELETE` | `/api/admin/messages/:id` | Delete message | Admin |
| `GET` | `/api/admin/subscribers` | Newsletter subscribers | Admin |

---

## Security Features

- **Input validation** — All endpoints validated with Zod schemas
- **Mass-assignment protection** — Unknown fields stripped before database operations
- **Ownership verification** — Users can only modify their own resources
- **Banned user enforcement** — Suspended accounts blocked at middleware level
- **Webhook signature verification** — Stripe events cryptographically verified
- **CORS allow-list** — `CLIENT_URL` origins only (all origins allowed when unset, for local dev)
- **Security headers** — `helmet`
- **Rate limiting** — auth (20 / 15 min) and AI (30 / min) endpoints, plus public forms
- **Safe errors** — Prisma errors mapped to 409/404/400; 500s never leak internals in production
- **Environment validation** — Required variables validated at startup

---

## Database Schema

```mermaid
erDiagram
    User ||--o{ Property : owns
    User ||--o{ RentalRequest : submits
    User ||--o{ Payment : makes
    User ||--o{ Review : writes
    Property ||--o{ RentalRequest : receives
    Property ||--o{ Review : receives
    Category ||--o{ Property : classifies
    RentalRequest ||--o| Payment : generates
```

### Models

- **User** — Tenants, Landlords, and Admins with role-based access; optional phone/avatar/bio; local or Google auth
- **Category** — Property classifications with unique names and descriptions
- **Property** — Listings with location, pricing, availability, image gallery, rooms, area and amenities
- **RentalRequest** — Application pipeline with status tracking
- **Payment** — Transaction records with Stripe integration
- **Review** — Tenant feedback with ratings
- **NewsletterSubscriber** / **ContactMessage** — public form submissions for the admin dashboard

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository in Vercel Dashboard
3. Configure environment variables
4. Deploy — Vercel runs `npm run build` automatically

### Manual Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

---

## Testing the API

### Import Postman Collection

A complete Postman collection is available in `/postman/`:

1. Open Postman
2. Click **Import** → **File**
3. Select `postman/postman_collection.json`
4. Set environment variables in Postman
5. Start testing!

### Quick Test with cURL

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123","role":"TENANT"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

---

## Project Structure

```
src/
├── config/
│   ├── env.ts           # Zod-validated environment variables
│   └── site.ts          # Static site facts (support email, ...)
├── lib/
│   └── prisma.ts        # Prisma client singleton
├── controllers/         # Route handlers (auth, property, rental, landlord,
│                        #   payment, admin, review, misc, ai)
├── services/            # Shared logic: property summaries/ratings, overlap
│                        #   checks, dashboard stats, Claude AI (ai.service.ts)
├── middlewares/         # auth (JWT + RBAC), validate (Zod), rateLimit, errorHandler
├── routes/              # Route definitions (one file per area + misc/ai)
├── validations/         # Zod schemas for request validation
├── utils/               # Safe query parsing, month-series helpers
├── app.ts               # Express app configuration
└── server.ts            # Server entry point
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with passion for modern rental management**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Souad5/Rentnest-backend)

</div>
