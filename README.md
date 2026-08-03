````markdown
# 🏢 RentNest — Modern Property Rental Backend & API Platform

RentNest is a robust, type-safe backend platform for property rentals. Built with **Node.js v24**, **Express v5**, **TypeScript**, **Prisma v6**, and **NeonDB (PostgreSQL)**, it supports real-time property management, tenant rental requests, role-based workflows, automated reviews, and payment processing via **Stripe** and **SSLCommerz**.

---

## 🚀 Tech Stack & Core Infrastructure

- **Runtime Engine**: [Node.js v24 (LTS)](https://nodejs.org/)
- **Framework**: [Express v5](https://expressjs.com/) (strict route error safety)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (configured with strict `exactOptionalPropertyTypes: true`)
- **Database ORM**: [Prisma v6](https://www.prisma.io/)
- **Database**: [NeonDB](https://neon.tech/) (Serverless Postgres)
- **Authentication**: JWT (JSON Web Tokens) with hashed passwords using `bcryptjs`
- **Payment Gateways**: [Stripe](https://stripe.com/) & [SSLCommerz](https://sslcommerz.com/)
- **Deployment Platform**: [Vercel Serverless Functions](https://vercel.com/)

---

## 🎯 Key Features & Capabilities

### 🔐 Authentication & Roles

- **Multi-Role RBAC**: Built-in support for `TENANT`, `LANDLORD`, and `ADMIN`.
- **JWT Middleware**: Token-based authorization across protected endpoints with auto-injection capabilities.

### 🏠 Property & Listing Engine

- **Advanced Filtering**: Search by location, price ranges, categories, and keyword queries.
- **Landlord Dashboard**: Real-time property listing lifecycle (create, update, archive/delete).

### 📋 Rental Requests Workflow

- **Application Pipeline**: Tenants submit requests with custom dates; landlords approve or decline requests.
- **Cascade Control**: Automated validation to ensure properties cannot be double-booked across overlapping durations.

### 💳 Payment System

- **Multi-Gateway Ready**: Initiate payment intents or checkout sessions via **Stripe** or **SSLCommerz**.
- **Verification Callbacks**: Webhooks and confirmation handlers to mark bookings active upon successful payment.

### ⭐ Reviews & Admin Management

- **Verified Reviews**: Only tenants with approved/completed rentals can leave ratings and detailed reviews.
- **Admin Moderation**: System-wide control to ban/unban users, delete problematic listings, and audit platform activity.

---

## 🛠️ Project Structure

```text
RentNest-Backend/
├── prisma/
│   ├── schema.prisma         # Database models & relationships
│   └── migrations/           # Database schema migrations
├── src/
│   ├── config/               # Prisma client & environment configuration
│   ├── controllers/          # Express route controllers
│   ├── middlewares/          # Auth, error, and validation middlewares
│   ├── routes/               # API endpoint route definitions
│   ├── services/             # Payment & external integration logic
│   ├── types/                # Custom TypeScript type declarations
│   ├── utils/                # Helper functions & app utilities
│   └── app.ts                # App initialization & server entrypoint
├── postman/
│   ├── postman_collection.json # Ready-to-import Postman API collection
│   └── README.md             # Detailed Postman guide
├── .env.example              # Environment variables template
├── build.js / tsconfig.json  # TypeScript strict compiler configuration
├── vercel.json               # Deployment config for Vercel Serverless
└── package.json
```
````

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root directory based on the template below:

```env
# Node Environment
NODE_ENV=development
PORT=5000

# Database Connection (NeonDB / PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-12345.us-east-2.aws.neon.tech/rentnest?sslmode=require"

# JWT Auth
JWT_SECRET="your_ultra_secure_jwt_secret"
JWT_EXPIRES_IN="7d"

# Stripe Gateway
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SSLCommerz Gateway (Optional)
SSLCOMMERZ_STORE_ID="store_id"
SSLCOMMERZ_STORE_PASSWORD="store_password"
SSLCOMMERZ_IS_LIVE=false

# Client URL (CORS Configuration)
CLIENT_URL="http://localhost:5000" || "https://rentnest-backend-five.vercel.app"

```

---

## 💻 Local Development Setup

### 1. Prerequisites

- **Node.js**: v24.0.0 or higher
- **npm**: v10.0.0 or higher
- **PostgreSQL / NeonDB account**

### 2. Installation

```bash
# Clone the repository
git clone [https://github.com/Souad5/Rentnest-backend.git](https://github.com/Souad5/Rentnest-backend.git)
cd rentnest-backend

# Install dependencies
npm install

```

### 3. Database Migration & Prisma Generation

```bash
# Run migrations to initialize schema on NeonDB
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

```

### 4. Start Local Development Server

```bash
# Start server in watch mode
npm run dev

```

The backend server will run on `http://localhost:5000`.

---

## 📦 Build & Production Deployment

### Local Build Test

Verify that all strict TypeScript checks compile cleanly:

```bash
npm run build

```

### Deploying to Vercel

1. Ensure `vercel.json` is configured for Express serverless routing.
2. Push your code to GitHub.
3. Import the repository into your **Vercel Dashboard**.
4. Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, etc.) in Vercel Project Settings.
5. Deploy! Vercel will run the build script automatically.

---

## 🧪 API Documentation & Postman

A fully functional Postman Collection v2.1.0 with auto-token population is provided in the `docs/` folder.

- **Postman Collection**: `docs/postman_collection.json`
- **Integration Guide**: Refer to `docs/README.md` for import instructions and testing workflows.

---

## 📄 License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

```

```
