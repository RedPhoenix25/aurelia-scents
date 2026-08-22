# Aurelia Scents — Haute Parfumerie 👑

> Mobile-First Luxury E-Commerce Storefront & Lightweight Admin Management Portal for Aurelia Scents, Lagos, Nigeria.

---

## 🌟 Overview & Brand Identity

**Aurelia Scents** is a bespoke, mobile-first e-commerce web application inspired by dark obsidian and brushed champagne gold luxury aesthetics. Designed to feel like a high-end French/Middle Eastern haute parfumerie first and an e-commerce store second.

- **Strict Typography Hierarchy**: 30% *Cormorant Garamond* (Serif for product titles, collection titles, hero headlines) + 70% *Inter* (Sans-serif for navigation, descriptions, pricing, buttons, filters, checkout).
- **Design System**: Deep obsidian palette (`#0a0908`), subtle gold accents (`#c9a84c`), borderless product cards, 3-variant button system (Primary / Ghost / WhatsApp).
- **Dual Flow**: Instant web bag checkout with live inventory deduction AND direct WhatsApp concierge ordering.

---

## 🚀 Key Features

### 🛍️ Storefront Experience (`/`)
1. **Full-Bleed Cinematic Hero Section**: Editorial typography, atmospheric fragrance photograph, live category pills, and instant Concierge CTA.
2. **Dynamic Volume Sizes & Multi-Pricing**: Custom ml variants (e.g. `30ml`, `50ml`, `100ml`) with individual Selling Prices and promotional Strikethrough Slash Prices (e.g., `₦38,000` ~~`₦45,000`~~).
3. **Live Customer Order Tracking**: Real-time fulfillment timeline (`Order Received` ➔ `Atelier Preparation` ➔ `Courier Dispatch` ➔ `Delivered`) via Order ID or Phone number.
4. **Instant Atelier Search & Quick Filters**: Search by scent name or character with fast 1-tap category chips.
5. **Interactive Shopping Bag Drawer & Checkout**: Auto-calculating delivery fees, threshold discounts, customer delivery capture, and order confirmation receipts.
6. **Luxury Floating Back-to-Top**: Smooth auto-fading scroll button.
7. **PWA & Social Rich Media**: Progressive Web App manifest (`manifest.json`), Schema.org JSON-LD structured data, and OpenGraph WhatsApp previews.

### 🛡️ Admin Management Portal (`/admin.html`)
*Password-protected portal completely detached from public navigation.*
1. **Real-Time Analytics Dashboard**: Total revenue, order count, active catalog count, and low-stock alerts.
2. **Direct Device Image Upload**: File picker supporting PNG, JPG, and WEBP uploads up to 15MB saved directly to local `/uploads/` storage (no external URLs needed).
3. **Dynamic Volume & Slash Price Builder**: Add, edit, or delete specific bottle sizes (ml) and set custom prices for each.
4. **Real-Time Stock Controls**: Quick numeric quantity editor and 1-tap `IN STOCK` ↔ `OUT OF STOCK` toggles.
5. **1-Click WhatsApp Customer Dispatch Generator**: Instant pre-formatted luxury notification templates (Atelier preparation, Dispatch notice with delivery address, Delivery confirmation) sent directly to customer WhatsApp chats.
6. **Store Configuration**: Live WhatsApp number sync, delivery fees, free delivery threshold, and announcement banner controls.

---

## 🏗️ Technology Stack

- **Backend**: Node.js + Express REST API (lightweight, zero heavy ORM dependencies).
- **Frontend**: Vanilla Modern JavaScript (ES6+), Vanilla CSS Custom Properties (Design Tokens), Semantic HTML5.
- **Icons**: Lucide Icons via CDN (`lucide.createIcons()`).
- **Typography**: Google Fonts (*Cormorant Garamond* & *Inter*).
- **Data Layer**: Persistent JSON database engine (`server/data/`) with automated directory validation.
- **PWA**: Service Worker (`public/sw.js`) and Web App Manifest (`public/manifest.json`).

---

## 📁 Repository Structure

```text
aurelia_scents/
├── public/                     # Static Web Root & Frontend Assets
│   ├── css/
│   │   ├── style.css           # Storefront luxury design system & responsive queries
│   │   └── admin.css           # Admin dashboard stylesheet & desktop sidebar
│   ├── js/
│   │   ├── app.js              # Storefront controller, bag, tracking & search
│   │   ├── admin.js            # Admin controller, dynamic sizes, image upload & auth
│   │   └── whatsapp.js         # WhatsApp receipt builder & phone resolver
│   ├── uploads/                # Uploaded fragrance photographs from device
│   ├── admin.html              # Dedicated password-protected admin portal
│   ├── index.html              # Public luxury mobile-first storefront
│   ├── manifest.json           # PWA Web App Manifest
│   └── sw.js                   # Service Worker for offline asset caching
├── server/                     # Lightweight Express API Backend
│   ├── data/                   # JSON Flat-File Database
│   │   ├── products.json       # Product catalog & volume variants
│   │   ├── orders.json         # Customer orders & fulfillment records
│   │   └── settings.json       # Store settings & WhatsApp concierge number
│   ├── routes/                 # Express API Endpoints
│   │   ├── products.js         # Product CRUD & stock toggles
│   │   ├── orders.js           # Order creation, auto-decrement & safe public tracking
│   │   ├── settings.js         # Store configuration & password management
│   │   └── admin.js            # Admin authentication & dashboard analytics
│   ├── db.js                   # Safe atomic JSON read/write helper
│   └── index.js                # Express app initialization & file upload endpoint
└── package.json                # Project dependencies & scripts
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### 2. Installation
```bash
# Clone or navigate to the project directory
cd aurelia_scents

# Install dependencies (Express, CORS)
npm install
```

### 3. Running Locally
```bash
# Start development server with auto-reload
npm run dev

# Or start standard production server
npm start
```

- **Storefront**: Open [http://localhost:3000](http://localhost:3000)
- **Admin Portal**: Open [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

### Default Admin Credentials:
- **Username**: `royal`
- **Password**: `royal123` *(Can be updated anytime in Admin ➔ Store Settings)*

---

## 🚢 Production Deployment

### Option 1: Deploy on Render / Railway / DigitalOcean (Recommended)
1. Push your repository to GitHub.
2. Link the repository on **Render** or **Railway** as a **Web Service**.
3. Set the build & start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set Environment Variable (Optional):
   - `PORT`: `3000` (or leave default assigned by host).

### Option 2: Linux VPS / Ubuntu with PM2 & NGINX
```bash
# Install PM2 globally
npm install -g pm2

# Start background process
pm2 start server/index.js --name "aurelia-scents"

# Save PM2 process list on reboot
pm2 startup
pm2 save
```

---

## 📞 WhatsApp Concierge Configuration

To change the store's official WhatsApp Concierge phone number:
1. Log in to `/admin.html`.
2. Navigate to **Store Settings**.
3. Enter your phone number in international format without `+` (e.g. `2347080097512`).
4. Click **Save Store Settings**.
5. All storefront buttons (Header, Hero, Product Sheet, Order Inquiries, and Checkout) immediately sync with the new number.

---

## 📜 License & Ownership
Created for **Aurelia Scents — Haute Parfumerie**, Lagos, Nigeria. All rights reserved.
