# 🏢 RentNest Backend

> A modern property rental backend built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL (NeonDB)**.

![Node.js](https://img.shields.io/badge/Node.js-v24-green)
![Express](https://img.shields.io/badge/Express-v5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-v6-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-336791)
![License](https://img.shields.io/badge/License-MIT-yellow)

RentNest is a scalable backend API for managing rental properties. It provides authentication, role-based access control, rental request workflows, property management, reviews, and online payment integration using **Stripe** and **SSLCommerz**.

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Password hashing with **bcryptjs**
- Role-based access control (RBAC)
- Supported roles:
  - Tenant
  - Landlord
  - Admin

### 🏠 Property Management

- Create, update, and delete properties
- Property search & filtering
- Category support
- Price filtering
- Location search

### 📋 Rental Requests

- Submit rental requests
- Approve or reject requests
- Prevent overlapping bookings
- Booking validation

### 💳 Payments

- Stripe integration
- SSLCommerz integration
- Payment verification
- Webhook support

### ⭐ Reviews

- Verified tenant reviews
- Ratings & comments
- Review moderation

### 👨‍💼 Admin Features

- User management
- Ban / unban users
- Delete listings
- Platform moderation

---

# 🛠 Tech Stack

| Technology | Description |
|------------|-------------|
| Node.js v24 | Runtime |
| Express v5 | Backend Framework |
| TypeScript | Programming Language |
| Prisma ORM | Database ORM |
| PostgreSQL (NeonDB) | Database |
| JWT | Authentication |
| bcryptjs | Password Hashing |
| Stripe | Payment Gateway |
| SSLCommerz | Payment Gateway |
| Vercel | Deployment |

---

# 📁 Project Structure

```text
RentNest-Backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── app.ts
│
├── postman/
│   ├── postman_collection.json
│   └── README.md
│
├── .env.example
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

SSLCOMMERZ_STORE_ID="store_id"
SSLCOMMERZ_STORE_PASSWORD="store_password"
SSLCOMMERZ_IS_LIVE=false

CLIENT_URL=http://localhost:3000
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Souad5/Rentnest-backend.git

cd Rentnest-backend
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file using `.env.example`.

## 4. Run Database Migrations

```bash
npx prisma migrate dev
```

## 5. Generate Prisma Client

```bash
npx prisma generate
```

## 6. Start the Development Server

```bash
npm run dev
```

The server will start at:

```
http://localhost:5000
```

---

# 📦 Production Build

Build the project:

```bash
npm run build
```

---

# ☁️ Deploy to Vercel

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Configure all required environment variables.
4. Deploy.

---

# 🧪 API Testing

A ready-to-use Postman collection is included.

```
postman/
├── postman_collection.json
└── README.md
```

Import the collection into Postman and follow the guide inside the `postman` folder.

---

# 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Souad**

GitHub: https://github.com/Souad5
