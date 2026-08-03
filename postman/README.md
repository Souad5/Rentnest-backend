# 🚀 Property Rental System — API Documentation & Postman Guide

This repository contains the complete **Postman Collection** for the Property Rental System API. It includes pre-configured routes, sample request bodies, dynamic environment variables, and automated authentication scripts.

---

## 📌 Features Included in Postman Collection

- **Automated Authentication**: Registering or logging in automatically sets the `{{token}}` collection variable for seamless protected endpoint requests.
- **Role-Based Workflows**: Separate folders organized by permissions (**Public**, **Landlord**, **Tenant**, **Admin**).
- **Comprehensive Coverage**: Covers property management, filtering, rental applications, Stripe/SSLCommerz payments, reviews, and admin user/listing moderation.

---

## 🚀 Quick Start Guide

### 1. Import Collection into Postman

1. Open **Postman**.
2. Click the **Import** button in the top-left corner.
3. Choose **Files** and select `property_rental_api.postman_collection.json` (or paste the raw JSON contents under the **Raw text** tab).
4. Click **Import**.

---

### 2. Configure Collection Variables

Click on the imported **Property Rental API** collection name and navigate to the **Variables** tab. Ensure your environment matches:

| Variable     | Default Value                               | Description                            |
| :----------- | :------------------------------------------ | :------------------------------------- |
| `baseUrl`    | `https://rentnest-backend-five.vercel.app/` | Backend server URL                     |
| `token`      | _(auto-updated)_                            | Bearer JWT generated on login/register |
| `propertyId` | `your_property_id`                          | Active property ID for testing         |
| `requestId`  | `your_request_id`                           | Active rental request ID for testing   |
| `paymentId`  | `your_payment_id`                           | Active payment ID for testing          |
| `userId`     | `your_user_id`                              | Target user ID for Admin actions       |

---

### 3. Authentication Workflow

1. Execute **`Authentication -> Register User`** or **`Authentication -> Login User`**.
2. Upon success ($200 \text{ OK}$ or $201 \text{ Created}$), a test script automatically extracts the JWT token from the response payload and sets `{{token}}`.
3. All protected endpoints inside the collection will automatically inherit and supply the header:
   ```http
   Authorization: Bearer {{token}}
   ```
