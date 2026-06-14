# DESIGN.md
# Theme: Modern Premium Marketplace (Clean, Accessible, Mobile-First)

## Visual Theme and Atmosphere
The platform embodies "trusted simplicity and premium utility." For Sellers (mobile), the interface must feel like an ultra-fast, lightweight utility tool—clutter-free, high-contrast, and intuitive for outdoor or on-the-go photography and entry. For Buyers, it shifts into a polished, elegant, and secure international marketplace with clean lines, ample whitespace, and absolute price transparency.

## Color Palette and Roles
| Role | CSS Variable | Value | Usage Rationale |
| :--- | :--- | :--- | :--- |
| Background (App Canvas) | --bg-primary | #F9FAFB | Clean, bright broadsheet canvas for maximum clarity |
| Surface (Cards, Panels) | --bg-surface | #FFFFFF | Pure white containers to elevate imagery and text |
| Brand Primary | --brand-primary| #0070F3 | Deep trusted blue for main actions, CTAs, and links |
| Brand Accent | --brand-accent | #00DFA2 | Vibrant teal for active status badges, positive states, and logistics flags |
| Text Primary | --text-primary | #111827 | Near black for headlines and deep readability |
| Text Secondary | --text-secondary| #6B7280 | Sophisticated slate for metadata, instructions, and breakdowns |
| Border / Dividers | --border-light  | #E5E7EB | Crisp, faint lines separating UI sections cleanly |

## Typography Rules
* Font Family: Inter, sans-serif (Fallback: system-ui)
* Layouts must scale perfectly from mobile devices (Sellers) to large displays (Buyers).

| Level | Size | Weight | Line-Height | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Display | 32px / 2rem | 700 | 1.2 | Main landing headers, big numbers |
| Heading | 20px / 1.25rem | 600 | 1.4 | Section headers, card titles |
| Body | 15px / 0.93rem | 400 | 1.6 | Product descriptions, inputs |
| Caption | 12px / 0.75rem | 500 | 1.5 | Metadata, individual fee line-items |

## Component Styles
### Cards & Surfaces
* Border Radius: 8px (`rounded-lg` in Tailwind)
* Border: 1px solid var(--border-light)
* Shadow: Faint, modern elevation (`shadow-sm`)

### Form Inputs (Critical for Sellers)
* Inputs must utilize a large touch target area on mobile (minimum height 48px).
* Explicit focus states: Border changes to `var(--brand-primary)` with a subtle ring.

### Buttons
* Primary: Background `var(--brand-primary)`, white text, 8px radius, smooth transition hover state.
* Minimum tap target size of 44x44px for mobile views.
