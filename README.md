# Kialna.shop - International Vietnamese Craft Marketplace

Kialna connects authentic Vietnamese artisans directly with global buyers, featuring complete fee transparency (artisan base price + District 1 hub logistics + custom packaging) and dual-currency checkout (VND catalog to USD Stripe payment).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Database Setup & Seeding
npx prisma db push
node prisma/seed.js

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketplace.

---

## Seed Accounts (Password: `password123`)

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Artisan / Seller** | `seller@kialna.shop` | `password123` | Mobile studio, live camera uploads, inventory management |
| **Buyer** | `buyer@kialna.shop` | `password123` | Multi-item cart, transparent breakdown, Stripe checkout, order tracking |
| **Hub Admin** | `admin@kialna.shop` | `password123` | District 1 Logistics Hub 6-stage dispatch pipeline, fee config |

---

## 💳 Stripe Sandbox Test Cards

When testing the **"Pay with Card via Stripe"** checkout flow:

| Card Brand | Card Number | Expiration Date | CVC | Billing Postal Code |
| :--- | :--- | :--- | :--- | :--- |
| **Visa (Default)** | `4242 4242 4242 4242` | Any future date (e.g. `12/30`) | `123` | `90210` |
| **Mastercard** | `5555 5555 5555 4444` | Any future date (e.g. `12/30`) | `123` | `90210` |
| **American Express** | `3782 8224 6310 005` | Any future date (e.g. `12/30`) | `1234` | `90210` |

### Edge Case / Failure Testing

* **Declined (Generic)**: `4000 0000 0000 0002`
* **Insufficient Funds**: `4000 0000 0000 9995`
* **Expired Card**: `4000 0000 0000 0069`
* **3D Secure OTP Challenge**: `4000 0000 0000 3063`

