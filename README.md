# InLine

**InLine** helps BINUS University students (Jakarta) eat without wasting their break in a queue. It predicts how
crowded each canteen and café is from the BINUS class schedule, recommends a place through an AI chat, and lets
students get help from a verified fellow student (a *buddy*) who queues for them (**Joki Antre**) or buys and
delivers their order inside campus (**Titip Beli & Antar**). It covers the BINUS campus areas Anggrek, Syahdan,
Kijang and Binus Square.

Built as a student venture (Venture course, BINUS University). Live at <https://inlineventure.netlify.app>.
The app is an installable mobile web app (PWA).

## Features

- **Crowd prediction** (`src/lib/crowdModel.ts`): each place shows Sepi / Sedang / Ramai / Penuh, an hourly chart
  and the best time to come. The estimate follows the BINUS class schedule: spikes at every 20-minute break, the
  lunch peak (11.00–14.00), students with a free session waiting between classes, quiet afternoons, busier
  Tue–Thu, the Friday-prayer dip and quiet Saturdays. Open/closed comes from each place's opening hours. The
  constants are assumptions that will be calibrated with field observation.
- **AI Rekomendasi chat** (`/chat`): students describe what they want in casual Indonesian ("laper, kelas 30 menit
  lagi, budget 20 ribu"). Google Gemini turns the message into filters, picks up to 3 places and writes a short
  reply, asks one question back when the message is too vague, and suggests follow-ups. Each message sends the
  time and the app's own table of places (status, crowd, prices, menu; no user data). The server drops any reply
  that names a place it did not pick or quotes a price not in the table (`netlify/lib/grounding.ts`); the app then
  shows its own summary. The prompt is in `netlify/lib/prompt.ts`. Without the AI (rate limit, offline) the app
  falls back to its keyword parser.
- **AI search** (Hasil AI screen): the same function turns a search sentence into filters and a ranked list.
- **Login and signup** (`src/state/Auth.tsx`): Firebase Authentication with Google, Microsoft (campus account) or
  email + password, with an email verification link and password reset.
- **Buddy verification** (`src/screens/BuddyApplyScreen.tsx`, `src/screens/AdminReviewScreen.tsx`): any account
  can apply from Profil with full name, NIM (format check), campus, WhatsApp, a KTM photo and a selfie holding the
  KTM, and can link the BINUS Microsoft account. InLine admins approve or reject at `/admin`; the photos are
  deleted on review (UU No. 27/2022 on personal data protection). Mode Buddy opens only for approved buddies.
  Access is enforced by `firestore.rules`.
- **Joki Antre and Titip Beli & Antar**: order flow with menu selection, campus delivery spot, cost summary,
  QRIS payment screen, order tracking, buddy rating, and Mode Buddy for accepting orders.

## Setup

Requirements: Node.js 20 or newer (tested with Node 22) and npm.

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill it in. The live build reads the public `VITE_*` values from
`.env.production` (committed); add `GEMINI_API_KEY` in Netlify → Site configuration → Environment variables.

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Firebase web app config (public by design) |
| `VITE_MICROSOFT_TENANT` | Microsoft tenant for campus sign-in (default `binus.ac.id`) |
| `VITE_MICROSOFT_LOGIN` | Set to `off` to hide Microsoft sign-in (e.g. while the campus tenant requires admin consent) |
| `GEMINI_API_KEY` | Google AI Studio key for the AI chat and search. Server only: never prefix it with `VITE_` |
| `INLINE_AI_MODEL` | Optional Gemini model (default `gemini-3.5-flash-lite`) |

Step-by-step setup for Firebase (Authentication, Firestore, rules, admin accounts) and Microsoft sign-in:
**[docs/SETUP-LOGIN.md](docs/SETUP-LOGIN.md)**.

The Gemini free tier has rate limits, and Google may use free-tier prompts to improve its products; only the
message text and public place data are sent.

## Run and build

```bash
npm run dev
```

The dev server starts on <http://localhost:5173>. The AI function only runs on Netlify (or with `netlify dev`);
locally the app uses the keyword parser.

```bash
npm run build
```

```bash
npm run preview
```

`build` type-checks and writes the production bundle (with the PWA service worker) to `dist/`. `preview` serves
`dist/` on port 4173, also on your local network.

| Script | What it does |
| --- | --- |
| `npm run typecheck` | Type-check only |
| `npm run icons` | Regenerate the PWA icons from `public/icon.svg` |
| `npm run photos` | Re-encode the photos in `docs/figma/raw/` to `public/images/places/*.webp` |

## Deploying (Netlify)

Connect the Netlify project to this GitHub repository. `netlify.toml` sets the build command, the `dist` publish
folder and Node 22; Netlify builds the AI function from `netlify/functions/`. Every push to `main` deploys automatically. `VITE_*` values are read
at build time, so trigger a new deploy after changing them. Deploy from GitHub, not by dragging `dist`, so the AI
function is built too.

## Using it on a phone

Open <https://inlineventure.netlify.app> and choose **Add to Home Screen** in the browser menu to install it
full-screen like an app. On a laptop the app is shown centered in a phone-sized frame (390×844).

## Presenter controls

A hidden panel helps during presentations and exhibitions: press **Shift + D** on a laptop, or long-press the
InLine logo on Home (about 0.7 s).

- **Waktu prediksi keramaian:** set a day and time (e.g. Selasa 12.55) to show the crowd pattern outside class
  hours, or return to the real clock.
- **Reset data:** restores the starting orders, queue and saved places.
- **Lacak otomatis maju / Majukan langkah pelacakan:** control how order tracking advances.
- **Lompat ke layar:** jump straight to any screen.

## Current scope

| Area | Status |
| --- | --- |
| Login, signup, email verification, buddy verification and admin review | Live (Firebase Auth + Firestore) |
| AI chat and AI search | Live (Gemini via Netlify Function), keyword fallback |
| Crowd prediction | Live, schedule-based model; calibration with field data is next |
| Place list and menus | Being updated to the actual BINUS canteen tenants |
| Orders, payment (QRIS), order tracking, Mode Buddy incoming orders | Run in the app on the device; server-side orders and a licensed payment gateway (escrow) are next |

## Project structure

```
src/
  App.tsx            Routes, auth gate, Mode Buddy gate
  routes.ts          All route paths
  index.css          Tailwind v4 + design tokens (@theme)
  components/        Design system: Button, Card, Chip, BottomNav, Header, BottomSheet, StepTracker,
                     QueueChart, PhoneFrame, Screen, Toast, presenter controls, …
  screens/           One file per screen (Auth, Home, Results, Chat, PlaceDetail, Queue, Joki, Titip,
                     Payment, Track, OrderDone, Saved, Profile, BuddyApply, BuddyMode, AdminReview)
  data/              Places, menus, buddies, campus spots, prices
  state/             Auth, buddy verification hooks, app state (React context + reducer)
  lib/               Crowd model, AI client and keyword parser, Firebase, buddy applications, formatting
netlify/
  functions/         ai-search (Gemini)
  lib/               AI prompt and grounding checks
public/              Place photos, PWA icons, _redirects
docs/                Setup guide (SETUP-LOGIN.md), design reference
firestore.rules      Firestore security rules
```

Tech stack: Vite, React, TypeScript, Tailwind CSS v4, React Router, Firebase (Auth, Firestore), Netlify
Functions, Google Gemini, zod, lucide-react icons, Plus Jakarta Sans (self-hosted), vite-plugin-pwa.
