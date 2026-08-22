# Aurelia Scents - Agent Instructions & Project Context

All agents working on this repository must adhere to the rules defined in `.agents/rules/project_rules.md`.

## Core Directives:
1. **Hero Section is Mandatory**: The site MUST have a full-bleed cinematic hero section modelled on `perfume inspo.webp` — atmospheric bottle photograph, editorial headline in Cormorant Garamond, Inter subtext, and a CTA button. Never remove it.
2. **Mobile Priority, Desktop Responsive**: Design mobile-first (360px–430px). Desktop must be fully responsive and polished (1024px+). Both must work beautifully.
3. **Strict Typography Ratio — 30% Serif / 70% Sans**: Cormorant Garamond for product names, hero headlines, collection titles only. Inter for everything else: nav, prices, buttons, descriptions, labels, filters.
4. **Luxury Aesthetics**: Match the dark obsidian and gold luxury perfume aesthetic of `perfume inspo.webp`. The site should feel like a premium perfume brand first, a store second.
5. **E-Commerce Standard**: Bumpa-style shopping flow with dual-column mobile grid, borderless open product cards, 3-variant button system (Primary / Ghost / WhatsApp), and direct WhatsApp sync (`+2347080097512`).
6. **Lightweight Backend**: Fast Express REST API with persistent local JSON data storage and real-time inventory management.
7. **No Admin in Public Navigation**: Admin portal is a fully separate password-protected page (`/admin.html`). Never link to it from the public site.
8. **Lucide Icons only**: Use `lucide.createIcons()` via CDN for all icons. No emojis in UI.
9. **Phase-by-Phase Execution**: Implement and verify each phase methodically before moving on.
