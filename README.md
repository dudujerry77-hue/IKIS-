# Iya Kudinka Iya Shagalinka Restaurants

A modern, responsive restaurant ordering website for a Nigerian food business — built with
plain HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step, no backend required.

## Features

- Animated full-screen intro with a skip button
- Home page with hero, category browsing, search and popular dishes
- Favorites, Cart and Order History, all persisted in `localStorage`
- Full checkout flow with order confirmation and a generated order ID
- Hidden admin dashboard (`admin.html`) with its own login and session check,
  food management (add/edit/delete) and order management (status updates)
- Fully responsive: mobile bottom navigation, tablet and desktop layouts
- Toast notifications and tasteful CSS animations throughout

## Running it

No build step. Either:

- Open `index.html` directly in a browser, or
- Serve the folder with any static file server, e.g. `python -m http.server`, then visit
  `http://localhost:8000`

It also deploys as-is to **GitHub Pages** — every path is relative, there's no server or
database dependency.

Food photography is loaded from Wikimedia Commons at runtime, so an internet connection is
needed to see the dish photos; if a photo can't load, the app falls back to a drawn icon
instead of a broken image.

## Admin access

Go to `admin.html` (it is not linked from the customer-facing site). Demo credentials:

- **Username:** `admin`
- **Password:** `admin123`

## Project structure

```
index.html          Customer-facing site (SPA-style: Home / Favorites / Orders / Cart)
admin.html           Admin dashboard (separate page, own auth gate)
css/
  style.css          Design system + all component styles
  responsive.css      Breakpoint overrides
  admin.css           Admin dashboard styles
js/
  data.js            Seed data + localStorage read/write helpers
  icons.js           Inline SVG icon set + offline image fallback
  favorites.js       Favorites store
  cart.js            Cart store
  orders.js          Orders store
  auth.js            Admin session/auth helpers
  app.js             Customer site wiring
  admin.js           Admin dashboard wiring
```

## Data & limitations

Everything is stored in the browser's `localStorage` — foods, favorites, cart, orders and the
admin session all live under separate `ikis_*` keys, structured so a real backend could later
replace each store's read/write functions without touching the UI code.

This is a first version, not a production system:

- **Admin login is not secure.** Credentials and the session token are stored in plain
  `localStorage`, with no encryption or server-side verification. Anyone with access to the
  browser's dev tools can read them or fabricate a session. Do not use this for a real
  business without replacing it with real server-side authentication (e.g. a backend issuing
  signed sessions over HTTPS).
- **Data is per-browser.** Orders, favorites and the cart don't sync across devices — they
  only exist in the browser/profile that created them, and clearing site data erases them.
- **No real payments or delivery tracking** — checkout captures the order and contact details
  only.
