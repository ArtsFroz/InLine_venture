# InLine — Demo Prototype

**InLine** is a student business idea (Venture course, BINUS University, Jakarta): it predicts food and drink
queues with AI, and lets students get help from a verified fellow student (a *buddy*) who queues for them
(**Joki Antre**) or buys and delivers their order inside campus (**Titip Beli & Antar**). It only covers the BINUS
campus areas Anggrek, Syahdan, Kijang and Binus Square.

This repository contains a **click-through demo prototype** (installable mobile PWA) for presenting to an industry
expert. It has **no backend, no real login and no real payments**: all data is mock data in TypeScript files, and
all state lives in the browser.

Design source: Figma file `5GlnKfS8Vp0ztlCzaCYGF7` ("Untitled"). Reference screenshots of every frame are in
[`docs/figma/`](docs/figma).

## Requirements

- Node.js 20 or newer (tested with Node 22)
- npm

## Install, run, build

```bash
npm install
```

```bash
npm run dev
```

The dev server starts on <http://localhost:5173>. Vite also prints a `Network:` address for your phone (see below).

```bash
npm run build
```

```bash
npm run preview
```

`build` type-checks and writes the production bundle (with the PWA service worker) to `dist/`. `preview` serves
`dist/` on port 4173, also on your local network. **For the actual presentation, use `build` + `preview`:**
it is faster and more stable than the dev server.

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run typecheck` | Type-check only |
| `npm run icons` | Regenerate the PWA icons from `public/icon.svg` |
| `npm run photos` | Re-encode the Figma photos in `docs/figma/raw/` to `public/images/places/*.webp` |

## Opening it on a phone (same Wi‑Fi)

1. Connect the laptop and the phone to the **same Wi‑Fi network** (a phone hotspot works well; campus Wi‑Fi often
   blocks device-to-device traffic).
2. Run `npm run build` and then `npm run preview` (or `npm run dev`).
3. In the terminal, find the line `➜  Network: http://192.168.x.x:4173/` and open that address on the phone.
4. If the phone cannot connect, allow Node.js through the Windows firewall for *Private networks*
   (Windows asks the first time; otherwise: Windows Security → Firewall → Allow an app).
5. Optional: in the phone's browser menu choose **Add to Home Screen** to open it full-screen like an app.
   (Installing as a full PWA with offline support needs HTTPS or `localhost`; over a plain local-network
   address the browser simply opens it as a home-screen bookmark, which is fine for the demo.)

On a laptop the app is shown centered inside a phone-sized frame (390×844), scaled down automatically if the
window is short. On a phone it fills the screen.

## Demo controls (for the presenter)

A hidden panel lets you recover quickly during the presentation.

- **Open it:** long-press the **InLine logo** on the Home screen (about 0.7 s), or press **Shift + D** on a laptop.
- **Reset demo:** restores all mock data (saved places, the A028 queue at Kopi Tepi, buddy orders) and goes Home.
- **Lacak otomatis maju:** turns automatic order tracking on/off (steps advance every 4 seconds).
- **Majukan langkah pelacakan:** pushes every active order one step forward by hand.
- **Lompat ke layar:** jump straight to any screen (Home, Hasil AI, Detail, Antrean Saya, cancel confirmation,
  Joki Antre, Titip Beli, QRIS payment, Lacak Titip, Lacak Joki, Pesanan Selesai, Disimpan, Profil, Mode Buddy).
  Jumps that need an order create one automatically.

The demo state is saved in the browser (localStorage), so a page refresh keeps your place. Use **Reset demo**
before each run-through.

## Suggested demo script

Start with **Reset demo**.

1. **Home** → tap the send button in *AI Rekomendasi* (the example query is used if the box is empty).
2. **Hasil AI** shows "AI memahami: …" and a ranked list with crowd labels → open **Kopi Tepi**.
3. **Detail** shows the AI queue prediction and hourly chart → **Titip Beli & Antar ke Kelas** (menu steppers,
   campus location, cost summary) → **Pesan & Bayar** → fake **QRIS** → **Saya sudah bayar**.
4. **Lacak Pesanan** advances by itself → **Pesanan Sudah Diterima** → confirm (escrow is released to the
   buddy) → **Pesanan Selesai** → rate the buddy.
5. **Antrean** tab shows your queue A028 → **Batalkan Antrean** opens the confirmation sheet → choose
   **Tidak, tetap antre**.
6. **Titipkan ke Joki Antre** → **Pesan Joki** → QRIS → **Lacak Joki Antre** → **Saya sudah dapat giliran**.
   (Finishing a Joki order closes that queue; the empty Antrean tab has a button to take a new one.)
7. **Profil** → **Aktifkan Mode Buddy** → accept/decline incoming orders and watch earnings update
   (try accepting a 4th order to show the max-3 rule).

## Project structure

```
src/
  App.tsx            Routes, wrapped in the state provider and the phone frame
  routes.ts          All route paths
  index.css          Tailwind v4 + design tokens (@theme)
  components/        Design system: Button, Card, Chip, BottomNav, Header, BottomSheet, StepTracker,
                     QueueChart, PhoneFrame, Screen, Toast, DemoControls, …
  screens/           One file per screen (Home, Results, PlaceDetail, Queue, Joki, Titip, Payment,
                     Track, OrderDone, Saved, Profile, BuddyMode)
  data/              Mock data: places, menus, buddies, campus spots, prices, demo user
  state/             Global state (React context + reducer), localStorage persistence, demo timers
  lib/               Fake AI search parser, order tracking steps, formatting helpers
public/
  images/places/     Place photos (from the Figma file)
  icons/             PWA icons
docs/figma/          Figma frame screenshots and layer structure used as the design reference
scripts/             Icon and photo generation scripts
```

## What is real and what is mocked

| Feature | In this demo |
| --- | --- |
| AI queue prediction, crowd level, hourly chart, best time | Fixed mock values per place |
| Natural-language AI search | Keyword-based parser in `src/lib/aiSearch.ts` (no AI model, no network) |
| Buddy matching, NIM verification, ratings | Mock buddies; first buddy with fewer than 3 active orders is assigned |
| QRIS / e-wallet payment and escrow | Fake QR screen; "paying" only changes local state |
| Order tracking | Steps advance on a 4-second timer (can be turned off in demo controls) |
| Mode Buddy incoming orders | Mock requests; a new one appears a few seconds after the list runs empty |
| Login, notifications, chat, order history, payment methods | Not included (buttons show a "demo" message) |

Tech stack: Vite, React, TypeScript, Tailwind CSS v4, React Router, lucide-react icons,
Plus Jakarta Sans (self-hosted, so it works offline), vite-plugin-pwa.
