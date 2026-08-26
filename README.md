<div align="center">

# RentNest

### Modern Property Rental Backend API

A production-grade REST API for property rental marketplaces with real-time payment processing, role-based access control, and automated rental workflows.

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
│  │   Stripe Gateway    │    │   SSLCommerz         │            │
│  └─────────────────────┘    └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### Authentication & Authorization
- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** (RBAC) for Tenants, Landlords, and Admins
- **Banned user detection** — suspended accounts blocked at middleware level
- **Token validation** with proper Bearer scheme enforcement

### Property Management
- **Advanced search & filtering** — location, price range, category, keyword
- **CRUD operations** with ownership verification
- **Image upload support** via URL
- **Category management** with referential integrity checks

### Rental Request Workflow
- **Application pipeline** — Tenants submit, Landlords approve/reject
- **Date validation** — End date must follow start date
- **Duplicate prevention** — One pending request per property per tenant
- **Self-rental protection** — Landlords cannot rent their own properties

### Payment Processing
- **Stripe integration** with PaymentIntents and webhooks
- **Idempotent session handling** — Prevents duplicate payment intents
- **Ownership verification** — Only payment initiator can confirm
- **Webhook signature verification** — Secure event processing
- **Refund handling** with payment status updates

### Admin Dashboard
- **User management** — View all users, ban/unban accounts
- **System oversight** — Monitor all properties and rentals
- **Category CRUD** — Manage property classifications
- **Admin protection** — Prevents self-banning and admin-to-admin conflicts

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
| **Payments** | Stripe + SSLCommerz | Multi-gateway payment processing |
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

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
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

# Optional: SSLCommerz
SSLCOMMERZ_STORE_ID="your-store-id"
SSLCOMMERZ_STORE_PASSWORD="your-password"

# CORS
CLIENT_URL="http://localhost:5000"
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Server runs on http://localhost:5000
```

### Database Setup

```bash
# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Generate Prisma Client
npm run prisma:generate
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login user | Public |
| `GET` | `/api/auth/me` | Get current user profile | Required |

### Properties
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/properties` | List properties (search/filter) | Public |
| `GET` | `/api/properties/:id` | Get property details | Public |
| `GET` | `/api/properties/categories` | List categories | Public |
| `POST` | `/api/properties/landlord` | Create property | Landlord/Admin |
| `PUT` | `/api/properties/landlord/:id` | Update property | Landlord/Admin |
| `DELETE` | `/api/properties/landlord/:id` | Delete property | Landlord/Admin |

### Rentals
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/rentals` | Submit rental request | Tenant |
| `GET` | `/api/rentals/my-requests` | Get my rental requests | Tenant |
| `GET` | `/api/rentals/:id` | Get rental details | Tenant/Landlord/Admin |

### Landlord Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/landlord/properties` | List my properties | Landlord/Admin |
| `POST` | `/api/landlord/properties` | Create property | Landlord/Admin |
| `PUT` | `/api/landlord/properties/:id` | Update property | Landlord/Admin |
| `DELETE` | `/api/landlord/properties/:id` | Delete property | Landlord/Admin |
| `GET` | `/api/landlord/requests` | Get rental requests | Landlord/Admin |
| `PATCH` | `/api/landlord/requests/:id` | Approve/reject request | Landlord/Admin |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/payments/create` | Create payment intent | Tenant |
| `POST` | `/api/payments/confirm` | Confirm payment | Tenant/Admin |
| `GET` | `/api/payments` | Get payment history | Required |
| `GET` | `/api/payments/:id` | Get payment details | Required |
| `POST` | `/api/payments/webhook` | Stripe webhook | Public |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/reviews/property/:id` | Get property reviews | Public |
| `POST` | `/api/reviews` | Submit review | Tenant |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/users` | List all users | Admin |
| `PATCH` | `/api/admin/users/:id` | Ban/unban user | Admin |
| `GET` | `/api/admin/properties` | List all properties | Admin |
| `GET` | `/api/admin/rentals` | List all rentals | Admin |
| `POST` | `/api/admin/categories` | Create category | Admin |
| `PUT` | `/api/admin/categories/:id` | Update category | Admin |
| `DELETE` | `/api/admin/categories/:id` | Delete category | Admin |

---

## Security Features

- **Input validation** — All endpoints validated with Zod schemas
- **Mass-assignment protection** — Unknown fields stripped before database operations
- **Ownership verification** — Users can only modify their own resources
- **Banned user enforcement** — Suspended accounts blocked at middleware level
- **Webhook signature verification** — Stripe events cryptographically verified
- **CORS configuration** — Configurable allowed origins
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

- **User** — Tenants, Landlords, and Admins with role-based access
- **Category** — Property classifications with unique names
- **Property** — Listings with location, pricing, and availability
- **RentalRequest** — Application pipeline with status tracking
- **Payment** — Transaction records with Stripe integration
- **Review** — Tenant feedback with ratings

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
├── config/              # Environment and Prisma configuration
│   ├── env.ts           # Zod-validated environment variables
│   └── prisma.ts        # Prisma client singleton
├── controllers/         # Route handlers with business logic
│   ├── auth.controller.ts
│   ├── property.controller.ts
│   ├── rental.controller.ts
│   ├── landlord.controller.ts
│   ├── payment.controller.ts
│   ├── admin.controller.ts
│   └── review.controller.ts
├── middlewares/          # Express middleware
│   ├── auth.ts          # JWT verification and RBAC
│   ├── validate.ts      # Zod schema validation
│   └── errorHandler.ts  # Global error handling
├── routes/              # API route definitions
│   ├── auth.routes.ts
│   ├── property.routes.ts
│   ├── rental.routes.ts
│   ├── landlord.routes.ts
│   ├── payment.routes.ts
│   ├── admin.routes.ts
│   └── review.routes.ts
├── validations/         # Zod schemas for request validation
│   ├── auth.validation.ts
│   ├── property.validation.ts
│   ├── rental.validation.ts
│   ├── payment.validation.ts
│   ├── admin.validation.ts
│   └── review.validation.ts
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
