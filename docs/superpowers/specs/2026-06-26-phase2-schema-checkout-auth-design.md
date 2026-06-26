# Phase 2 Design — Schema + Stripe Checkout + Auth

**Date:** 2026-06-26  
**Project:** Marketplace OpenClaw Raw  
**Scope:** Phase 2C — Supabase schema, Stripe checkout + webhook, Supabase Auth pages  
**Out of scope:** Secure download URL generation, My Library page (Phase 2 follow-on)

---

## Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Architecture | Vanilla JS + Vercel Serverless Functions | Minimal disruption to existing polished frontend |
| Auth UI | Dedicated pages (`login.html`, `signup.html`) | Cleaner URLs, easier Stripe redirect + email link targets |
| Phase 2 scope | Schema + Checkout + Auth only | Natural stopping point; download needs Storage files first |
| Plugin ID bridge | `slug` column on `plugins` table | Bridges existing `app.js` string IDs to DB UUIDs without frontend rewrite |
| Dependency structure | Single `package.json` at project root | Standard Vercel practice, one manifest to maintain |

---

## File Structure

```
marketplace-openclaw-raw-full/
│
├── package.json              NEW — root deps (stripe, @supabase/supabase-js)
├── .env.local                NEW — secret keys (gitignored)
├── .gitignore                NEW — ignores .env.local, node_modules
│
├── index.html                unchanged
├── marketplace.html          unchanged
├── publish.html              unchanged
├── style.css                 minor additions: auth form styles
├── app.js                    checkout() wired to /api/create-checkout
├── auth.js                   NEW — shared Supabase client + auth helpers (browser)
├── vercel.json               updated: adds /api/** Node.js route
│
├── login.html                NEW — sign in page
├── signup.html               NEW — sign up page
├── success.html              NEW — post-payment confirmation page
│
├── lib/
│   └── supabase-admin.js     NEW — server-side Supabase client (service role only)
│
└── api/
    ├── create-checkout.js    NEW — Stripe checkout session creator
    └── webhook.js            NEW — Stripe webhook handler → writes to purchases
```

---

## Database Schema

Run in Supabase SQL Editor.

### Tables

```sql
-- PLUGINS
CREATE TABLE plugins (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  author           TEXT NOT NULL,
  description      TEXT NOT NULL,
  short_desc       TEXT,
  category         TEXT NOT NULL,
  tags             TEXT[],
  price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  file_path        TEXT,
  icon             TEXT,
  badge            TEXT,
  rating           DECIMAL(3,2) DEFAULT 0,
  review_count     INT DEFAULT 0,
  install_count    INT DEFAULT 0,
  seller_email     TEXT,
  seller_stripe_id TEXT,
  status           TEXT DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- PURCHASES
CREATE TABLE purchases (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id         UUID REFERENCES plugins(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_paid       DECIMAL(10,2),
  currency          TEXT DEFAULT 'gbp',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS (schema-ready, not wired until Phase 4)
CREATE TABLE reviews (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id  UUID REFERENCES plugins(id) ON DELETE CASCADE,
  rating     INT CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plugin_id)
);
```

### Indexes

```sql
CREATE INDEX idx_plugins_slug     ON plugins(slug);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_status   ON plugins(status);
CREATE INDEX idx_purchases_user_id  ON purchases(user_id);
CREATE INDEX idx_purchases_plugin_id ON purchases(plugin_id);
```

### Row Level Security

```sql
ALTER TABLE plugins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;

-- Anyone can read published plugins
CREATE POLICY "Public can view published plugins"
  ON plugins FOR SELECT USING (status = 'published');

-- Users see only their own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert purchases (webhook only)
CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can write their own reviews
CREATE POLICY "Users can write reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Everyone can read reviews
CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT USING (true);
```

### Seed Data

```sql
INSERT INTO plugins (slug, name, author, category, description, price, icon, badge, rating, review_count, status) VALUES
  ('hunter-gatherer', 'Hunter Gatherer', 'Apps on AI', 'research', 'Autonomous web scraper that collects competitor pricing, market trends, and social proof.', 9.00, '🕷️', 'hot', 4.9, 34, 'published'),
  ('brand-clone', 'Brand Clone', 'Apps on AI', 'video', 'Scrapes any Instagram or Facebook profile, extracts brand voice and generates matching video scripts.', 14.00, '🎬', 'new', 4.7, 18, 'published'),
  ('lead-scout', 'Lead Scout', 'Apps on AI', 'marketing', 'Finds and qualifies leads autonomously from LinkedIn, directories, and websites.', 12.00, '🎯', 'pro', 4.8, 22, 'published'),
  ('social-pulse', 'Social Pulse', 'Apps on AI', 'social', 'Monitors brand mentions and competitors across social platforms. Daily digest delivered automatically.', 7.00, '📡', null, 4.6, 41, 'published'),
  ('copy-engine', 'Copy Engine', 'Apps on AI', 'marketing', 'Generates ad copy, email sequences, social captions, and product descriptions.', 5.00, '✍️', null, 4.5, 67, 'published'),
  ('price-watch', 'Price Watch', 'Apps on AI', 'research', 'Tracks competitor pricing changes across e-commerce and service sites.', 8.00, '📊', null, 4.7, 29, 'published'),
  ('reel-writer', 'Reel Writer', 'CommunityDev', 'video', 'Turns any product or idea into a viral-ready Instagram Reel script with hooks and hashtags.', 3.00, '🎞️', null, 4.3, 88, 'published'),
  ('invoice-bot', 'Invoice Bot', 'Apps on AI', 'finance', 'Creates, sends, and chases invoices autonomously. Integrates with Stripe.', 11.00, '🧾', 'pro', 4.9, 15, 'published'),
  ('review-harvester', 'Review Harvester', 'CommunityDev', 'research', 'Pulls Google, Trustpilot, and TripAdvisor reviews. Summarises sentiment.', 4.00, '⭐', null, 4.4, 53, 'published'),
  ('seo-spider', 'SEO Spider', 'Apps on AI', 'marketing', 'Crawls any website and returns a full SEO audit — broken links, meta, content gaps.', 9.00, '🔍', null, 4.6, 37, 'published'),
  ('content-calendar', 'Content Calendar', 'CommunityDev', 'social', 'Plans a 30-day content calendar across Instagram, LinkedIn, and Facebook.', 0.00, '📅', 'free', 4.2, 112, 'published'),
  ('product-lister', 'Product Lister', 'Apps on AI', 'ecommerce', 'Takes product photos and specs, writes optimised listings for Etsy, Amazon, eBay, and Shopify.', 6.00, '🛍️', 'new', 4.5, 44, 'published');
```

---

## API Routes

### `/api/create-checkout.js`

**Method:** POST  
**Called by:** Browser (`auth.js` → `app.js` checkout function)  
**Input:** `{ items: [{ id: slug, name, price }], userId: string }`

**Flow:**
1. Validate request method is POST
2. Parse body — extract `items` and `userId`
3. Filter out free items (`price === 0`) — no Stripe session needed
4. Look up each plugin by `slug` in Supabase — verify DB price matches submitted price
5. If price mismatch detected: return 400 error
6. Build Stripe line items in GBP pence
7. Create Stripe Checkout Session with:
   - `success_url`: `/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/marketplace`
   - `metadata`: `{ userId, pluginSlugs: JSON.stringify([...]) }`
8. Return `{ url: session.url }`

**Security:** Price re-validated server-side. Client cannot manipulate amounts.

---

### `/api/webhook.js`

**Method:** POST  
**Called by:** Stripe (server-to-server)  
**Config:** `bodyParser: false` — raw body required for signature verification

**Flow:**
1. Read raw request body
2. Extract `stripe-signature` header
3. Verify with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
4. If verification fails: return 400
5. Handle `checkout.session.completed` event only:
   - Extract `userId` and `pluginSlugs` from `session.metadata`
   - Look up each plugin UUID by slug
   - Insert one row per plugin into `purchases` via `supabaseAdmin`
6. Return `{ received: true }`

**Idempotency:** `stripe_session_id` is UNIQUE — duplicate webhook calls are safe.

---

### `/lib/supabase-admin.js`

Server-side only. Uses `SUPABASE_SERVICE_ROLE_KEY`. Never imported by browser code.

```js
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

---

## Auth Pages

### Supabase JS Loading Strategy

All HTML pages load Supabase JS via CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js"></script>
```

`auth.js` (browser-safe, uses ANON key hardcoded directly in the file):
- The ANON key is **public by design** — Supabase intends it to be exposed in browser code. RLS policies are the security layer, not key secrecy.
- Initialises `window.supabaseClient` using the hardcoded ANON key and project URL
- On DOMContentLoaded: checks session, updates nav (email + Sign Out vs Sign In link)
- Exposes: `signIn(email, password)`, `signUp(email, password)`, `signOut()`, `getUser()`
- Session auto-persisted to `localStorage` by Supabase JS

### `login.html` (`/login`)

- Email + password form
- On success: always redirect to `/marketplace` (cart is still in `localStorage` — user clicks Checkout again, which now proceeds immediately since they're signed in). The `?next=checkout` param is a signal only, not a URL to redirect to directly.
- On error: inline error below form (no `alert()`)
- Link to `signup.html`

### `signup.html` (`/signup`)

- Email + password + confirm password form
- Client-side password match validation before API call
- On success: show "Check your email to confirm your account" message
- Link to `login.html`

### `success.html` (`/success`)

- Reads `?session_id` from URL (appended by Stripe)
- Clears cart from `localStorage` on load
- Shows payment confirmed message
- Honest placeholder for downloads: "Your purchases will be available in My Library once secure file delivery is enabled"
- Link back to Marketplace

---

## Checkout Flow (end-to-end)

```
User clicks Checkout in cart sidebar
  → auth.js checks for active Supabase session
  → No session → redirect to /login?next=checkout
  → Has session → POST /api/create-checkout { items, userId }
  → Server validates prices against DB
  → Server creates Stripe Checkout Session
  → Browser redirects to Stripe hosted checkout
  → User pays on Stripe
  → Stripe fires POST /api/webhook
  → Webhook verifies signature
  → Webhook looks up plugin UUIDs by slug
  → Webhook inserts rows into purchases table
  → Stripe redirects browser to /success?session_id=xxx
  → success.html clears cart, shows confirmation
```

---

## `vercel.json` Changes

Add Node.js function config and remove the `@vercel/static` build entries for `*.js` (they would catch `api/*.js` as static files). Add explicit static builds only for root-level HTML/CSS:

```json
{
  "functions": {
    "api/*.js": { "runtime": "nodejs20.x" }
  }
}
```

The existing wildcard catch-all route (`"src": "/(.*)", "dest": "/index.html"`) stays in place — it sits after `{ "handle": "filesystem" }` so Vercel resolves real files and API routes first, then falls back to `index.html`. No change needed to the catch-all position. The `builds` array entries for `*.js` must be **removed** — otherwise Vercel treats `api/create-checkout.js` as a static file instead of a serverless function.

---

## `package.json`

```json
{
  "name": "marketplace-openclaw-raw",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=20" },
  "dependencies": {
    "stripe": "^16.0.0",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

---

## Environment Variables

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

NEXT_PUBLIC_SITE_URL=https://marketplace-openclaw-raw.vercel.app
```

**Security rules:**
- `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` — `/api` functions only, never in browser
- `SUPABASE_ANON_KEY` and `STRIPE_PUBLISHABLE_KEY` — safe to expose in browser via `auth.js`

---

## Out of Scope (Phase 2 follow-on)

- `/api/download.js` — signed Supabase Storage URL generation
- `library.html` — My Library page showing purchased plugins
- Free plugin claiming — `content-calendar` (£0) needs a non-Stripe "add to library" flow
- `/api/submit-plugin.js` — seller submission (Phase 3)
- Stripe Connect — seller payouts (Phase 3)

---

## Open Questions for Phase 2 Follow-on

1. Will real plugin `.zip` files be uploaded to Supabase Storage before building download?
2. Should the free plugin claim flow require auth, or is it open?
3. Is `NEXT_PUBLIC_SITE_URL` the final production domain or a preview URL?
