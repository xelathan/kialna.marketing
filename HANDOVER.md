# Kialna Marketplace - Team Handover & Architecture Guide

Welcome to the **Kialna** repository. This document outlines the current architecture, what has been implemented, how to run and test the project, and recommended next steps for incoming team members.

---

## 1. Project Overview & Architecture

Kialna is an international marketplace connecting Vietnamese artisans and craftsmen directly with global buyers, featuring complete price transparency and hub-based fulfillment logistics.

* **Tech Stack**: Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4, Prisma ORM with SQLite, Lucide Icons.
* **Pricing & Transparency Philosophy**:
  * Sellers list items in Vietnamese Đồng (**VND**).
  * Buyers checkout in **USD** (converted dynamically, currently 25,000 VND = $1.00 USD).
  * Orders itemize base artisan price, shipping hub logistics fee (120,000 VND), and custom packaging fee (30,000 VND).
* **Three Primary Personas**:
  1. **Seller (Artisan)**: Mobile-optimized inventory and listing manager with camera photo capture.
  2. **Buyer (Customer)**: Craft catalog, transparent pricing breakdown, cart, checkout simulation, and order status tracking.
  3. **Admin (Hub Logistics)**: District 1 Shipping Hub dispatch and fulfillment pipeline (`Ready for Pickup` $\rightarrow$ `Driver Assigned` $\rightarrow$ `Picked Up` $\rightarrow$ `In Packaging` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered`), and live platform fee adjustments.

---

## 2. What Has Been Implemented

### Phase 1: Database & Data Modeling
* **Prisma Schema (`prisma/schema.prisma`)**: Models for `User`, `Product`, `Order`, `OrderItem`, and `Fee`.
* **Seed Script (`prisma/seed.js`)**: Seeds realistic craft products, platform fees, and accounts for all three roles.

### Phase 2: Seller Portal & Mobile Studio
* **Listings & Inventory (`src/components/SellerDashboard.tsx`, `src/app/actions/products.ts`)**: Real-time stats (total listings, active, out of stock), search, filtering, and status toggle.
* **Product Form (`src/components/ProductForm.tsx`)**: Responsive craft creation/editing with dynamic price transparency breakdown.

### Phase 3: Buyer Marketplace & Ordering
* **Buyer Experience (`src/components/BuyerDashboard.tsx`, `src/app/actions/orders.ts`)**:
  * Product grid with category tabs and search.
  * Interactive modal displaying exact price breakdowns in VND and USD.
  * Multi-item cart drawer with stock validation.
  * Checkout flow updating stock and creating orders in a transactional Prisma block.
  * Real-time order tracking tab for buyers.

### Phase 4: Admin Hub & Logistics Fulfillment
* **Hub Dashboard (`src/components/AdminDashboard.tsx`, `src/app/actions/admin.ts`)**:
  * Live pipeline tracker across 6 logistics stages with stage-filtering.
  * Fee configuration modal to dynamically adjust domestic packaging and international shipping rates in VND.

### Phase 5: Live Image Uploading
* **Upload API (`src/app/api/upload/route.ts`)**: Server-side MIME validation (JPEG, PNG, WebP, GIF, AVIF), 10MB size limit, UUID file generation stored in `public/uploads/`.
* **Mobile Camera & Gallery Integration (`src/components/ProductForm.tsx`)**:
  * "Take Photo" button triggering mobile camera capture (`capture="environment"`).
  * Multi-file picker and drag-and-drop dropzone with live upload spinners.
  * "Cover Photo" badge and one-tap reordering.
  * Fallback manual URL input.

### Phase 6: Authentication & Session Management
* **Crypto Utility (`src/lib/auth-crypto.ts`)**: `scrypt` password hashing and HMAC-signed session tokens.
* **Session Layer (`src/lib/session.ts`, `src/app/actions/auth.ts`)**: Signed HTTP-only session cookies (`kialna_session_token`) with localhost compatibility.
* **Auth Pages**:
  * `/login`: Email & password sign-in plus one-click demo login buttons.
  * `/register`: Dedicated registration allowing selection between **Buyer** and **Artisan/Seller**.
* **Role Switcher Widget (`src/components/RoleSwitcher.tsx`)**: Floating bottom-right widget for instant role toggling during development, plus explicit Sign Out buttons on all dashboards.

### Phase 7: UI & Layout Polish
* Fixed CSS layer priority in `src/app/globals.css` (`@layer components`) to prevent input padding collapse.
* Updated all text inputs across search, forms, and modals with `pl-11` and `pointer-events-none` on icons to eliminate placeholder overlap.

### Phase 8: Multi-Device Responsive Transformation
* Freed entire application from artificial `max-w-md` mobile frame.
* Implemented fluid multi-column responsive grids across Mobile, Tablet, and Desktop:
  * 4-column artisan catalog on desktop, 3-column on tablet, 2-column on mobile.
  * Desktop top navigation headers with tab switchers paired with mobile bottom navigation bars.
  * Split 2-column artisan studio for product creation and editing.
  * Side-sliding cart drawer and wide centered dialog modals on desktop.

### Phase 9: Stripe Payment Gateway Integration
* Installed official `stripe`, `@stripe/stripe-js`, and `@stripe/react-stripe-js` SDKs.
* Updated Prisma schema (`Order` model) with `paymentStatus`, `stripeSessionId`, `stripePaymentIntentId`, and recipient delivery fields.
* Created Stripe singleton (`src/lib/stripe.ts`) and client-side loader (`src/lib/stripe-client.ts`).
* **In-Portal Embedded Payment Flow (Stripe Elements)**:
  * Implemented `createPaymentIntent` and `confirmPaymentIntentOrder` in `src/app/actions/orders.ts`.
  * Created `EmbeddedStripeCheckout.tsx` rendering embedded `<PaymentElement />` with 256-bit encryption.
  * 2-Step In-Portal Checkout in `BuyerDashboard.tsx` (`Step 1: Delivery Details` $\rightarrow$ `Step 2: Embedded Card Payment`).
  * Direct client confirmation via `stripe.confirmPayment({ redirect: "if_required" })` with in-app confirmation modal—buyers never leave Kialna.
* **External Hosted Checkout Flow (Stripe Checkout)**:
  * Transparent itemized line items (Artisan Base Price + Packaging Hub Fee + Shipping Hub Fee).
  * Webhook route (`src/app/api/webhooks/stripe/route.ts`).
  * Dedicated confirmation (`/checkout/success`) and cancellation (`/checkout/cancel`) pages.
* Added Sandbox Test Card helper badge directly in the in-portal checkout UI.

---

## 3. Seed Accounts & Credentials

The seed script creates the following default accounts (password: `password123`):

| Persona | Name | Email (Login ID) | Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Seller** | Nguyen Van A | `seller@kialna.shop` | `password123` | Artisan catalog & camera uploads |
| **Buyer** | John Doe | `buyer@kialna.shop` | `password123` | Marketplace browsing, cart, and orders |
| **Admin** | Kialna Shipping Hub | `admin@kialna.shop` | `password123` | Logistics pipeline & fee management |

---

## 3.1 Stripe Sandbox Test Cards

Use these official test cards on the Stripe Hosted Checkout page:

### Standard Successful Payments

| Brand | Card Number | Expiry | CVC | Billing Postal Code |
| :--- | :--- | :--- | :--- | :--- |
| **Visa (Default)** | `4242 4242 4242 4242` | Any future date (e.g. `12/30`) | `123` | `90210` or any ZIP |
| **Mastercard** | `5555 5555 5555 4444` | Any future date (e.g. `12/30`) | `123` | `90210` or any ZIP |
| **American Express** | `3782 8224 6310 005` | Any future date (e.g. `12/30`) | `1234` | `90210` or any ZIP |

### Payment Edge Cases & Failure Testing

| Test Scenario | Card Number | Expiry | CVC | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **Declined (Generic)** | `4000 0000 0000 0002` | `12/30` | `123` | Card declined prompt |
| **Insufficient Funds** | `4000 0000 0000 9995` | `12/30` | `123` | Insufficient funds error |
| **Expired Card** | `4000 0000 0000 0069` | `12/30` | `123` | Expired card validation error |
| **3D Secure Challenge** | `4000 0000 0000 3063` | `12/30` | `123` | Prompts OTP/SMS modal challenge |

---

## 4. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Synchronize Prisma Database & Seed initial data
npx prisma db push
node prisma/seed.js

# 3. Run development server
npm run dev
# Or build and start production
npm run build
npm start
```

Access the app at `http://localhost:3000`.

---

## 5. File Structure Map

```
kialna.shop/
├── prisma/
│   ├── schema.prisma       # Database schema (User, Product, Order, OrderItem, Fee)
│   └── seed.js             # Initial mock data and password hashes
├── public/
│   └── uploads/            # Stored user-uploaded images (.gitignore configured)
├── src/
│   ├── app/
│   │   ├── actions/        # Server Actions (admin, auth, orders, products)
│   │   ├── api/upload/     # Multipart image upload route
│   │   ├── login/          # Sign-in page
│   │   ├── register/       # Account creation (Buyer vs Seller)
│   │   ├── seller/         # Seller product creation / editing pages
│   │   ├── globals.css     # Design tokens and component utility layers
│   │   └── page.tsx        # Dynamic role-based router
│   ├── components/
│   │   ├── AdminDashboard.tsx   # Hub fulfillment & fee configuration
│   │   ├── BuyerDashboard.tsx   # Shop catalog, cart, checkout & buyer orders
│   │   ├── SellerDashboard.tsx  # Seller inventory, stats & order overview
│   │   ├── ProductForm.tsx      # Craft editor with camera & upload controls
│   │   └── RoleSwitcher.tsx     # Floating development test switcher
│   └── lib/
│       ├── auth-crypto.ts  # scrypt password hashing & HMAC token signing
│       ├── db.ts           # Prisma client singleton
│       └── session.ts      # Cookie session utilities
└── DESIGN.md               # Visual theme, typography, color palette specifications
```

---

## 6. Recommended Next Steps for Incoming Team

1. **Payment Gateway Integration**:
   * Replace simulated checkout in `src/app/actions/orders.ts` with real Stripe Checkout or PayPal SDK.
   * Add a webhook handler (e.g., `src/app/api/webhooks/stripe/route.ts`) to mark orders as paid.
2. **Cloud Storage for Uploads**:
   * Replace/augment local storage in `src/app/api/upload/route.ts` with AWS S3, Cloudinary, or Uploadthing for production deployments (e.g. Vercel).
3. **Notifications & Tracking Numbers**:
   * Add carrier tracking number input when admin advances orders to `Shipped`.
   * Trigger email notifications to buyers (e.g., via Resend or SendGrid) on fulfillment status changes.
4. **Seller Payouts**:
   * Build a payout ledger tracking accumulated artisan balances upon `Delivered` status.
