# DESIGN.md
# Theme: Meta Design System (Hardware Commerce, Photography-First, Cobalt Blue & Ink Pills)
# Source Reference: https://getdesign.md/meta/design-md

## 1. Visual Theme and Atmosphere
Meta's design system represents a confident, product-forward hardware commerce standard (Meta Quest, Ray-Ban Meta smart glasses). The system pairs a stark white canvas with full-bleed photographic product cards, pill-shaped buttons (100px radius), generous 24px-32px card rounding, and a saturated cobalt blue (`#0064E0`) for primary commerce and purchase actions. Marketing and navigation surfaces leverage deep black (`#000000` / `#0A1317`) ink pills and stark minimalist contrast.

---

## 2. Color Palette & Roles

| Role | Token / CSS Variable | Hex Value | Usage Rationale |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-primary` / `--canvas` | `#FFFFFF` | Stark, pristine white canvas letting photography lead |
| **Soft Surface** | `--bg-surface-soft` | `#F1F4F7` | Soft cloud background for thumbnails, search pills, cards |
| **Surface Card** | `--bg-surface` | `#FFFFFF` | Pure white container with subtle hairline border |
| **Cobalt Primary** | `--brand-primary` | `#0064E0` | Saturated cobalt blue for purchase CTAs, checkout, add to cart |
| **Deep Cobalt** | `--brand-primary-deep` | `#0457CB` | Hover and active pressed state for cobalt CTAs |
| **Ink Button / Deep Ink** | `--ink-button` / `--ink-deep` | `#000000` / `#0A1317` | Black pill buttons for marketing CTAs, dark promo strips |
| **Text Primary** | `--text-primary` / `--ink` | `#1C1E21` | Standard crisp high-contrast body & headline text |
| **Text Secondary** | `--text-secondary` / `--steel` | `#5D6C7B` | Secondary metadata, subtitles, transparent fee labels |
| **Hairline Border** | `--border-hairline` | `#CED0D4` | 1px input borders and form control outlines |
| **Hairline Soft** | `--border-light` | `#DEE3E9` | Soft dividers, card borders, and section separators |
| **Success** | `--color-success` | `#31A24C` | In-stock badges, completed order status, verified receipts |
| **Warning / Attention** | `--color-warning` | `#F7B928` | Limited stock tags, promotional callout badges |
| **Critical** | `--color-critical` | `#E41E3F` | Validation errors, out of stock alerts |

---

## 3. Typography & Hierarchy
* **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
* **Geometry**: Snug, tight negative letter spacing on body and buttons (`-0.01em` to `-0.015em`). Confident, bold display headlines.

| Level | Size | Weight | Line Height | Letter Spacing | Use |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | 40px - 56px | 700 / 800 | 1.15 | -0.02em | Landing page hero, big product headlines |
| **Heading Large** | 28px - 32px | 700 | 1.25 | -0.015em | Dashboard titles, section headers |
| **Heading Medium** | 20px - 24px | 600 | 1.3 | -0.01em | Product names, modal titles |
| **Body Standard** | 15px - 16px | 400 | 1.5 | -0.01em | Descriptions, form inputs |
| **Button / Pill** | 14px - 15px | 700 | 1.4 | -0.01em | Pill button labels |
| **Caption / Badge** | 11px - 12px | 600 / 700 | 1.35 | 0 | Category tags, price breakdown details |

---

## 4. Geometric Shapes & Rounding Scale
* **Buttons & Badges**: Full pill rounding `rounded-full` (`100px`).
* **Showcase & Product Cards**: `rounded-[24px]` to `rounded-[32px]`.
* **Form Inputs & Search**: `rounded-full` for search pills; `rounded-xl` (`12px`) for text inputs.
* **Aspect Ratios**: Photography-first `aspect-square` or `aspect-[4/3]` product showcases with soft `#F1F4F7` background containers.

---

## 5. Core Components

### 5.1 Buttons
* **Commerce Buy CTA (`.btn-primary` / `.btn-cobalt`)**:
  - Background: `#0064E0`, Text: `#FFFFFF`, Radius: `9999px` (Pill), Font: 700, Padding: `12px 24px`.
  - Hover / Active: `#0457CB`.
* **Marketing Primary CTA (`.btn-ink`)**:
  - Background: `#000000`, Text: `#FFFFFF`, Radius: `9999px` (Pill), Font: 700, Padding: `12px 24px`.
  - Hover: `#1C1E21` / `#444950`.
* **Ghost Outlined CTA (`.btn-secondary`)**:
  - Background: Transparent, Border: `2px solid #0A1317`, Text: `#0A1317`, Radius: `9999px`.
  - Hover: Background `#F1F4F7`.
* **Category Pill Tabs (`.btn-pill-tab`)**:
  - Inactive: Background `#FFFFFF`, Border: `1px solid #CED0D4`, Text: `#1C1E21`.
  - Active: Background `#0A1317`, Border: `1px solid #0A1317`, Text: `#FFFFFF`, Font: 700.

### 5.2 Cards & Surfaces
* **Product Card (`.card-product`)**:
  - Background: `#FFFFFF`, Border: `1px solid #DEE3E9`, Radius: `24px` (`rounded-3xl`), Overflow: hidden.
  - Image container: `#F1F4F7` soft cloud background with subtle zoom on hover.
* **Dark Promo Strip (`.card-promo-strip`)**:
  - Background: `#0A1317`, Text: `#FFFFFF`, Radius: `28px` to `32px`, Padding: `32px` to `48px`.
* **Checkout & Summary Panels**:
  - Background: `#FFFFFF`, Border: `1px solid #DEE3E9`, Radius: `20px` to `24px`, Shadow: `0 1px 4px rgba(20, 22, 26, 0.08)`.

### 5.3 Form Inputs
* **Search Pill (`.search-pill`)**:
  - Background: `#F1F4F7`, Border: `1px solid transparent`, Radius: `9999px`, Height: `44px`.
  - Focus: Background `#FFFFFF`, Border: `1px solid #0064E0`, Shadow: `0 0 0 3px rgba(0, 100, 224, 0.15)`.
* **Text Input (`.input-primary`)**:
  - Background: `#FFFFFF`, Border: `1px solid #CED0D4`, Radius: `12px`, Height: `46px`.
  - Focus: Border `2px solid #0064E0`, Shadow: `none`.
