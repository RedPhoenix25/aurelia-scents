# Aurelia Scents - Strict Project Rules & Standards

## 1. Core Architecture & Stack
- **Stack**: Lightweight Node.js Express REST API backend with persistent JSON/SQLite database storage, paired with modern, modular Vanilla JS/CSS for zero bloated dependencies and maximum mobile performance.
- **Currency**: Nigerian Naira (`₦` NGN) formatted cleanly with thousand separators (e.g. `₦15,000`).
- **Primary Channel**: WhatsApp business integration connected to `+2347080097512`.
- **Iconography**: **Use Lucide Icons** (`lucide.createIcons()` via CDN) consistently for ALL iconography across both the public storefront and the admin backend. Never use emojis or mismatched icon libraries where clean Lucide SVG icons belong.

---

## 2. Responsive Layout — Mobile Priority, Desktop Supported
- **Mobile-First, Desktop-Responsive**: The site must look and function beautifully on both mobile (360px–430px) AND desktop (1024px+). Mobile is the priority breakpoint. Desktop must never feel broken or misaligned.
- All layouts must be fluid and responsive using CSS custom properties and media queries (`min-width: 768px`, `min-width: 1024px`).
- On desktop: content is max-width contained (`max-width: 1200px`, centered), product grid expands to 3–4 columns, and the hero becomes a full-bleed cinematic layout.
- On mobile: 2-column product grid, sticky bottom navigation bar, bottom-sheet modals, and single-column checkout.
- Touch-friendly tap targets (minimum 44px height) on all interactive elements.
- Fast load times with zero layout shifts and smooth CSS transitions.

---

## 3. Hero Section — Required, Mandatory
- **The site MUST have a hero section** modelled directly on `perfume inspo.webp`.
- The hero is a **full-bleed atmospheric perfume photograph** (dark, cinematic, bottle-forward) with editorial text overlaid or placed immediately below the image.
- Hero content:
  - Eyebrow label: small Inter uppercase label (e.g. `BEYOND SCENT, AN EXPERIENCE`)
  - Headline: large Cormorant Garamond headline (e.g. `Timeless Luxury, Uniquely Yours`)
  - Subheading: a single line of Inter body copy
  - One primary CTA button: `DISCOVER COLLECTION`
  - Optional: scent family filter pills below (`Floral · Woody · Amber · Citrus`)
- **Do NOT remove the hero section.** It is a core brand identity element of this storefront.

---

## 4. Storefront Navigation & Protection
- **Public Navigation**:
  - Desktop: horizontal top navbar with brand logo centered or left-aligned, nav links, and icon buttons (search, bag).
  - Mobile: sticky bottom navigation bar with **Home**, **Shop**, **Catalog**, **Search**, **Bag** (with live badge counter).
  - **NO ADMIN LINK** anywhere in the public navigation, header, or footer.
- **Admin Portal Access**:
  - Separate secured page at `/admin.html`.
  - Requires Username & Password authentication before exposing any management UI.

---

## 5. Typography System (Strict 30% Serif / 70% Sans Ratio)
- **Cormorant Garamond** (serif, ~30% of text) — used ONLY for:
  - Hero headline
  - Product names
  - Collection titles
  - Section editorial headings
- **Inter** (sans-serif, ~70% of text) — used for:
  - Navigation labels
  - Product descriptions
  - Prices
  - Buttons (`ADD TO BAG`, `PROCEED TO CHECKOUT`)
  - Filter pills and category tabs
  - Checkout form fields and labels
  - All small/utility text, eyebrow labels, stock badges
- **Do NOT use serif fonts for buttons, prices, descriptions, or UI labels.**
- **Do NOT use Playfair Display** — Cormorant Garamond is the sole editorial serif.

### Typography Hierarchy Reference
| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow label | Inter | 10px | 600 | uppercase, letter-spacing 2px |
| Hero headline | Cormorant Garamond | 40px–52px | 500 | normal or italic |
| Product name | Cormorant Garamond | 18px–26px | 400–500 | normal |
| Section title | Cormorant Garamond | 20px–24px | 500 | |
| Description copy | Inter | 13px | 400 | |
| Price | Inter | 15px | 600 | |
| Button label | Inter | 11px–12px | 600 | uppercase, letter-spacing 1.5px |
| Navigation | Inter | 11px | 500 | |

---

## 6. Design Aesthetics & Visual Identity
- **Design Inspiration**: Strictly adhere to the dark obsidian and brushed gold luxury styling of `perfume inspo.webp`. The site should feel like a luxury perfume brand first, an e-commerce store second.
- **Palette**:
  - Background: Deep Obsidian / Onyx (`#0a0908`, `#12110f`, `#1a1816`)
  - Accent / Gold: Brushed Champagne Gold (`#d4af37`, `#c5a880`, `#e6ca65`)
  - Text: Warm Off-White / Ivory (`#f8f6f0`, `#ded8cf`, `#8e877e`)
  - Status: In Stock `#10b981` · Low Stock `#f59e0b` · Out of Stock `#71717a`
- **Button System — 3 variants only, no exceptions**:
  1. **Primary**: Dark bg (`#1a1816`), gold border (`rgba(212,175,55,0.4)`), Inter 11px uppercase. No gradients.
  2. **Secondary / Ghost**: Transparent bg, gold border, gold text.
  3. **WhatsApp**: Solid `#25D366`, white Inter text.
  - No gradient fills on buttons. No icons inside CTA buttons. No pill-shaped CTAs.
- **Product Cards**: Open, borderless cards. Image fills top. Clean editorial text stack below.
- **Micro-animations**: Subtle transitions on hover and tap. No gratuitous animations.

---

## 7. E-Commerce & Checkout Flow (Bumpa-Style)
- Dual-column mobile product grid, 3–4 column on desktop.
- Live stock status: In Stock (default, no badge), Low Stock (amber text line), Out of Stock (disabled button labeled `SOLD OUT`).
- Volume size switcher: `30ml · 50ml · 100ml` — minimal underline-style active state.
- Slide-over Cart Drawer from bottom on mobile, side on desktop.
- Dual checkout: **On-site checkout** + **Direct WhatsApp order** to `+2347080097512`.

---

## 8. Lightweight Admin Backend
- Touch-friendly dashboard with real-time analytics (Revenue, Orders, Low-Stock items).
- Live stock toggles (`IN STOCK` ↔ `OUT OF STOCK`) and numeric quantity editor.
- Dynamic Volume Variant & Price manager (custom volume sizes e.g., 50ml, 100ml, discovery 10ml with individual pricing).
- Direct device image upload only (PNG, JPG, WEBP saved to `/uploads/` — no external URL inputs).
- Full product CRUD (Title, Subtitle, Description, Volume Variants, Category, Photograph Upload).
- Order fulfillment manager (Status: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).

---

## 9. Admin Portal Design System (Must Match Storefront)
- **Same font stack**: Cormorant Garamond (serif) for admin brand name and modal headings only; Inter for all labels, values, buttons, tabs, table text.
- **Same token set**: Use the identical CSS custom properties (`--bg-base`, `--gold`, `--font-serif`, `--font-sans`, `--r-xs`, etc.) — do NOT introduce separate admin-only tokens that diverge from the storefront.
- **Same button system (3 variants)**: Primary (dark + gold border), Ghost (transparent + gold border), WhatsApp (solid green). No gradient fills on any button.
- **Themed `<select>` dropdowns**: All `<select>` elements must use the obsidian background (`var(--bg-elevated)`), gold border on focus, and Inter font. No browser-default unstyled dropdowns.
- **Toast notifications replace browser alerts**: Never use `window.alert()`, `window.confirm()`, or `window.prompt()` in the admin UI. Replace with an in-page themed toast/notification system that matches the storefront's gold-bordered toast style. Destructive actions (e.g., delete) must use an in-page confirmation card/modal, not `confirm()`.
- **Tabs use underline-active style**: Active admin tab shows gold `border-bottom`, matching the filter strip pattern from the storefront.
- **Consistent icon usage**: Lucide icons only, `lucide.createIcons()` after every dynamic render.
- **Desktop-first layout**: Admin is primarily used on desktop. Use a two-column sidebar layout at `≥ 768px` (sidebar nav + main content area). On mobile, keep the current top-tabs approach.
