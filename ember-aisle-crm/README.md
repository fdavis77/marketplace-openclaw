# Ember & Aisle CRM

The operating system for Ember & Aisle's wedding planning: bookings, tier-driven task timelines, vendor directory with vetting, per-wedding budgets and payment schedules, and a morning dashboard. Built for Fabian and Davinia, and made to work on a phone at a venue.

**Status:** MVP (sessions 1–5.5 of the build plan) complete. Phase 2 is not started, on purpose (see below).

## Stack

Matches the Axom AI infrastructure already used by the marketplace in this repo: **Postgres on Supabase**, deployed on **Vercel (London, `lhr1`)**.

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Drizzle ORM → Postgres (Supabase's transaction pooler in production)
- Auth: email + password, bcrypt-hashed, signed httpOnly session cookie (30 days)
- Motion (`motion/react`, formerly Framer Motion) for the few animations that earn their place

It's a single deployable app with no other services.

## What it does

| Area | Where | Notes |
|---|---|---|
| Dashboard | `/` | Upcoming weddings, tasks overdue + next 7 days (tick off in place), overdue/due payments, weddings awaiting "delivered". **Mine / All** toggle, where *mine* includes joint work. |
| Clients | `/clients` | Search + filter by stage, tier and country. Cards on phone, table on desktop. |
| Booking | `/clients/new` | Tier, Food & Wine add-on, fee (flat, or Tier 1's 10% of budget with a £5,500 minimum) + destination surcharge, previewed live. |
| Client workspace | `/clients/[id]` | Tabs: Timeline · Vendors · Budget · Payments · Details (+ Wrap-up once delivered). |
| Vendors | `/vendors` | Filter by country, category and status. Vetting checklist as dated fields with one-tap "done today". |

### Timelines (`src/lib/timeline-templates.ts`)

Picking a tier generates the tasks from the brief's templates:

- **Tier 3:** the 7 day-of steps.
- **Tier 2:** audit → shortlists → confirmation → styling/timeline, then Tier 3 from 8 weeks out.
- **Tier 1:** discovery → venue & core suppliers → remaining suppliers & design (+ monthly check-ins) → budget & logistics, then the Tier 2 confirmation phase and Tier 3.
- **Food & Wine add-on:** Fabian's brief, tasting and sign-off tasks.

Rules I chose where the brief gave a window, so they're easy to change:

- A task is due at the **end** of its window ("months 6–4" → 4 months out). The exception is *Secure venue*, due at the start, because everything depends on it.
- Nothing is due before the booking date. Short-notice bookings get a front-loaded list; monthly check-ins that would be in the past are skipped.
- Shortlist and sourcing steps are **split by who leads the category** (Davinia bride-side, Fabian groom-side + food & wine, joint for venue/photo), so "mine" is meaningful.
- Destination permits are only added for non-UK weddings.

**Changing the tier, wedding date or add-ons re-syncs the timeline without losing work.** New tasks are added and open ones re-dated. Tasks you've dated by hand (📌), started or finished are left alone, and hand-added tasks are never touched. The same logic runs from *Rebuild from template*.

### Money and dates

- Money is stored as **integer pence**, and dates as plain calendar dates.
- "Today" is **Europe/London**, so a payment doesn't turn overdue at 11pm UK time because the server runs in UTC.
- Payment status (upcoming / due within 7 days / overdue / paid) is **derived on read**, so no nightly job is needed.
- Budget variance: actual vs committed on lines that have an actual. Within ±2% counts as on track.

## Privacy & security (UK/EU GDPR)

- **Supabase REST lockdown:** migration `0001` enables Row Level Security with no policies on every table. Without it, Supabase's public anon key could read client data through the auto-generated API. The app connects as the DB owner, so it's unaffected.
- **Every server action re-checks the session**, not only the page redirect.
- **Erasure:** Client → Details → *Delete permanently* (type the name to confirm). Everything attached cascades.
- **Subject access:** Client → Details → *Download data (JSON)*.
- **No personal data in logs.** Error screens show no details, and pages send `Cache-Control: private, no-store`.
- Login throttling: 5 failed attempts per email per 15 minutes.
- Opted-out couples can't be marked "published" in the portfolio.

**Host the database in an EU/UK region** (Supabase London `eu-west-2`).

## Running locally

```bash
cp .env.example .env.local        # set DATABASE_URL and AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed-demo              # fictional data; refuses to run on a non-local DB
npm run dev                       # sign in: fabian@demo.local / ember-and-aisle-demo
```

## Deploying (first time)

1. **Supabase:** create a project in **London**. Copy the *transaction pooler* connection string (port 6543).
2. **Vercel:** new project from this repo with **Root Directory = `ember-aisle-crm`**. Set env vars `DATABASE_URL` and `AUTH_SECRET` (`openssl rand -base64 48`). Region `lhr1`.
3. **Migrate** (from your machine, with `DATABASE_URL` pointing at Supabase): `npm run db:migrate`
4. **Create the two real logins.** The password is prompted for, so it never lands in shell history:
   ```bash
   npm run user:create -- --person fabian  --name "Fabian"  --email you@…
   npm run user:create -- --person davinia --name "Davinia" --email her@…
   ```
   Re-running the command for the same person resets their password.

Schema changes: edit `src/db/schema.ts` → `npm run db:generate` → commit the SQL in `drizzle/` → `npm run db:migrate`.

## Checks

```bash
npm run typecheck && npm run lint && npm test     # unit tests: fees, timelines, sync, payments, budget, dates
npm run build && PORT=3100 npm start              # then, against a seeded local DB:
E2E_BASE_URL=http://localhost:3100 npm run test:e2e
```

The e2e suite runs the whole MVP "done" path on an iPhone-sized and a laptop-sized browser: create booking → timeline appears → tick task → assign vendor → budget line → overdue payment → dashboard → mark paid → delivered → wrap-up → export → erase.

## Design & motion

- **Tokens** (palette, fonts, easing) live only in `src/app/globals.css`. **Motion timing** lives in `src/lib/motion.ts`. Change them there, not per screen.
- **Palette:** terracotta/rust `#a8472a`, ink charcoal `#2a2522`, aged gold `#b8955a` (decorative) / `#7a5a26` (text), warm ivory `#f8f3ea`. All text pairs pass WCAG AA.
  - ⚠️ No Ember & Aisle brand file was found in Drive, so these hexes are my interpretation of the brief. Swap in the real ones in `globals.css`.
- **Type:** Cormorant Garamond (display, names) + Inter (data), self-hosted, so there's no extra font request on venue wifi.
- **Motion:**
  - 150–250 ms tab and panel transitions.
  - Budget bar fills.
  - Tick draws in on task completion.
  - Dashboard counts up.
  - The *Delivered* moment: petals and a gold rule, dismiss by tap.
- **Held back:** no row-by-row list animation, and content is never hidden behind an animation (numbers render server-side first). The OS "reduce motion" setting is honoured.

## Phase 2 (not built — start once the MVP is in real use)

Email templates with merge fields · correspondence log (+ email integration) · reporting (revenue, pipeline, tiers, time-to-book) · fuller post-wedding flow · EUR pricing with a stored GBP equivalent.
