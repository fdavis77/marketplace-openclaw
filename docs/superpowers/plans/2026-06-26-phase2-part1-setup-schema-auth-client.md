# Phase 2 — Part 1: Setup, Schema, Auth Client

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Part 2 of this plan:** `2026-06-26-phase2-part2-auth-pages-stripe.md` (Tasks 5-8)

**Goal:** Bootstrap the project with package.json + vercel.json, run the Supabase schema, and create the server admin client and browser auth client — making auth state available on all pages.

**Architecture:** Single `package.json` at project root. Vercel Node.js serverless functions in `/api`. Browser auth via Supabase JS CDN. Plugin IDs bridge from string slugs to UUIDs via a `slug` column.

**Tech Stack:** Vanilla JS, Vercel Serverless (`@vercel/node`), Supabase (PostgreSQL + Auth), Node.js 20

## Global Constraints

- Working directory: `marketplace-openclaw-raw-full/` — all paths below are relative to it
- Dark theme CSS vars: `--black`, `--deep`, `--slate`, `--border`, `--indigo`, `--indigo-l`, `--lime`, `--white`, `--muted`, `--danger`
- Fonts: Space Grotesk (`--font-display`) + Inter (`--font-body`) — loaded via Google Fonts in style.css
- All currency GBP — Stripe amounts in pence (£ × 100)
- `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` appear only in `/api` and `/lib` — never in browser-loaded files
- `SUPABASE_ANON_KEY` is safe to hardcode in `auth.js` (public by design; RLS is the security layer)
- No test framework — verification done with `vercel dev` + curl + browser
- Existing files: `app.js`, `index.html`, `marketplace.html`, `publish.html`, `style.css`, `vercel.json`

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.local`
- Modify: `vercel.json`

**Interfaces:**
- Produces: `npm install` succeeds; `vercel dev` can serve the site; `/api/*.js` files are wired as Node.js serverless functions

- [ ] **Step 1: Create package.json**

```json
{
  "name": "marketplace-openclaw-raw",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "stripe": "^16.0.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
.env.local
node_modules/
.vercel/
```

- [ ] **Step 3: Create .env.local (fill in real values from dashboards)**

```env
# ── SUPABASE ──────────────────────────────────────────────
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ── STRIPE ────────────────────────────────────────────────
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# ── APP ───────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Replace vercel.json with this complete version**

Key changes vs current: `*.js` static build removed (would wrongly catch `api/*.js`); explicit `app.js` and `auth.js` static builds added; `api/*.js` Node build added; `functions` block added; routes for `/api/*`, `/login`, `/signup`, `/success` added; `cdn.jsdelivr.net` added to CSP `script-src`.

```json
{
  "version": 2,
  "name": "marketplace-openclaw-raw",
  "builds": [
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "*.css", "use": "@vercel/static" },
    { "src": "app.js", "use": "@vercel/static" },
    { "src": "auth.js", "use": "@vercel/static" },
    { "src": "api/*.js", "use": "@vercel/node" }
  ],
  "functions": {
    "api/*.js": { "runtime": "nodejs20.x" }
  },
  "routes": [
    { "src": "/api/create-checkout", "dest": "/api/create-checkout.js" },
    { "src": "/api/webhook", "dest": "/api/webhook.js" },
    { "src": "/", "dest": "/index.html" },
    { "src": "/marketplace", "dest": "/marketplace.html" },
    { "src": "/publish", "dest": "/publish.html" },
    { "src": "/browse", "dest": "/marketplace.html" },
    { "src": "/login", "dest": "/login.html" },
    { "src": "/signup", "dest": "/signup.html" },
    { "src": "/success", "dest": "/success.html" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com;"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)\\.html",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/style.css",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }]
    },
    {
      "source": "/app.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }]
    }
  ],
  "regions": ["lhr1"],
  "cleanUrls": true,
  "trailingSlash": false
}
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Verify Vercel CLI**

```bash
vercel --version
```

If not installed: `npm install -g vercel` then `vercel login`.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json package-lock.json .gitignore vercel.json
git commit -m "feat: project setup — package.json, vercel config, gitignore"
```

---

## Task 2: Supabase Schema

**This task is manual — run SQL in the Supabase dashboard.**

**Interfaces:**
- Produces: `plugins`, `purchases`, `reviews` tables with RLS; 12 seed plugins with matching slugs

- [ ] **Step 1: Create a Supabase project**

https://supabase.com → New Project → name `marketplace-openclaw-raw` → region: Europe (West) → strong DB password.

- [ ] **Step 2: Copy credentials into .env.local**

Supabase → Project Settings → API:
- **Project URL** → `SUPABASE_URL`
- **anon / public** key → `SUPABASE_ANON_KEY`
- **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 3: Run schema SQL**

Supabase → SQL Editor → New Query → paste and run:

```sql
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

CREATE TABLE purchases (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id         UUID REFERENCES plugins(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_paid       DECIMAL(10,2),
  currency          TEXT DEFAULT 'gbp',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id  UUID REFERENCES plugins(id) ON DELETE CASCADE,
  rating     INT CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plugin_id)
);

CREATE INDEX idx_plugins_slug       ON plugins(slug);
CREATE INDEX idx_plugins_category   ON plugins(category);
CREATE INDEX idx_plugins_status     ON plugins(status);
CREATE INDEX idx_purchases_user_id  ON purchases(user_id);
CREATE INDEX idx_purchases_plugin_id ON purchases(plugin_id);

ALTER TABLE plugins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published plugins"
  ON plugins FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can write reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT USING (true);
```

Expected: all statements succeed with no errors.

- [ ] **Step 4: Run seed SQL**

New query → paste and run:

```sql
INSERT INTO plugins
  (slug, name, author, category, description, price, icon, badge, rating, review_count, status)
VALUES
  ('hunter-gatherer','Hunter Gatherer','Apps on AI','research','Autonomous web scraper that collects competitor pricing, market trends, and social proof.',9.00,'🕷️','hot',4.9,34,'published'),
  ('brand-clone','Brand Clone','Apps on AI','video','Scrapes any Instagram or Facebook profile, extracts brand voice and generates matching video scripts.',14.00,'🎬','new',4.7,18,'published'),
  ('lead-scout','Lead Scout','Apps on AI','marketing','Finds and qualifies leads autonomously from LinkedIn, directories, and websites.',12.00,'🎯','pro',4.8,22,'published'),
  ('social-pulse','Social Pulse','Apps on AI','social','Monitors brand mentions and competitors across social platforms.',7.00,'📡',null,4.6,41,'published'),
  ('copy-engine','Copy Engine','Apps on AI','marketing','Generates ad copy, email sequences, social captions, and product descriptions.',5.00,'✍️',null,4.5,67,'published'),
  ('price-watch','Price Watch','Apps on AI','research','Tracks competitor pricing changes across e-commerce and service sites.',8.00,'📊',null,4.7,29,'published'),
  ('reel-writer','Reel Writer','CommunityDev','video','Turns any product or idea into a viral-ready Instagram Reel script.',3.00,'🎞️',null,4.3,88,'published'),
  ('invoice-bot','Invoice Bot','Apps on AI','finance','Creates, sends, and chases invoices autonomously. Integrates with Stripe.',11.00,'🧾','pro',4.9,15,'published'),
  ('review-harvester','Review Harvester','CommunityDev','research','Pulls Google, Trustpilot, and TripAdvisor reviews. Summarises sentiment.',4.00,'⭐',null,4.4,53,'published'),
  ('seo-spider','SEO Spider','Apps on AI','marketing','Crawls any website and returns a full SEO audit.',9.00,'🔍',null,4.6,37,'published'),
  ('content-calendar','Content Calendar','CommunityDev','social','Plans a 30-day content calendar across Instagram, LinkedIn, and Facebook.',0.00,'📅','free',4.2,112,'published'),
  ('product-lister','Product Lister','Apps on AI','ecommerce','Takes product photos and specs, writes optimised listings for Etsy, Amazon, eBay, and Shopify.',6.00,'🛍️','new',4.5,44,'published');
```

Expected: 12 rows inserted.

- [ ] **Step 5: Verify in Table Editor**

Supabase → Table Editor → `plugins` → confirm 12 rows, all `status = 'published'`, slugs match `app.js` IDs.

- [ ] **Step 6: Disable email confirmation for dev speed (re-enable before production)**

Supabase → Authentication → Providers → Email → toggle off "Confirm email".

---

## Task 3: Server Admin Client

**Files:**
- Create: `lib/supabase-admin.js`

**Interfaces:**
- Produces: `export const supabaseAdmin` — Supabase client initialised with service role key
- Consumed by: `api/create-checkout.js`, `api/webhook.js`

- [ ] **Step 1: Create lib/supabase-admin.js**

```javascript
// lib/supabase-admin.js
import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL environment variable not set')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable not set')

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

- [ ] **Step 2: Smoke test the import**

```bash
export $(grep -v '^#' .env.local | xargs) && node --input-type=module <<'EOF'
import { supabaseAdmin } from './lib/supabase-admin.js'
console.log('supabaseAdmin type:', typeof supabaseAdmin)
EOF
```

Expected: `supabaseAdmin type: object`

- [ ] **Step 3: Commit**

```bash
git add lib/supabase-admin.js
git commit -m "feat: server-side Supabase admin client"
```

---

## Task 4: Browser Auth Client + Nav Wiring

**Files:**
- Create: `auth.js`
- Modify: `index.html`
- Modify: `marketplace.html`
- Modify: `publish.html`

**Interfaces:**
- Produces globally on every page that loads `auth.js`: `window.supabaseClient`, `getUser()`, `signIn(email, password)`, `signUp(email, password)`, `doSignOut()`
- Consumed by: `login.html`, `signup.html` inline scripts (Task 5); `app.js` checkout function (Task 8 Part 2)

- [ ] **Step 1: Create auth.js**

Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` with values from your `.env.local`:

```javascript
/* ═══════════════════════════════════════════════════════════
   MARKETPLACE OPENCLAW RAW — auth.js
   Browser Supabase client. ANON key is public by design —
   RLS policies are the security layer, not key secrecy.
═══════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

const { createClient } = window.supabase
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getUser() {
  const { data: { user } } = await window.supabaseClient.auth.getUser()
  return user
}

async function signIn(email, password) {
  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function signUp(email, password) {
  const { data, error } = await window.supabaseClient.auth.signUp({ email, password })
  if (error) throw error
  return data
}

async function doSignOut() {
  await window.supabaseClient.auth.signOut()
  window.location.href = '/'
}

async function updateAuthNav() {
  const authNav = document.getElementById('authNav')
  if (!authNav) return

  const user = await getUser()

  if (user) {
    authNav.innerHTML = `
      <span style="font-size:12px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.email}</span>
      <button class="btn-ghost" onclick="doSignOut()" style="font-size:12px;padding:6px 12px;">Sign Out</button>
    `
  } else {
    authNav.innerHTML = `
      <a href="/login" class="btn-ghost" style="font-size:13px;padding:6px 14px;display:inline-block;">Sign In</a>
    `
  }
}

document.addEventListener('DOMContentLoaded', updateAuthNav)
```

- [ ] **Step 2: Update index.html — replace Sign In button**

Find:
```html
    <button class="btn-ghost" onclick="openCart()">Sign In</button>
```
Replace with:
```html
    <div id="authNav"></div>
```

- [ ] **Step 3: Update index.html — add CDN + auth.js before app.js**

Find (near bottom of file):
```html
<script src="app.js"></script>
```
Replace with:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 4: Update marketplace.html — replace Sign In button**

Find:
```html
    <button class="btn-ghost">Sign In</button>
```
Replace with:
```html
    <div id="authNav"></div>
```

- [ ] **Step 5: Update marketplace.html — add CDN + auth.js before app.js**

Find (near bottom of file):
```html
<script src="app.js"></script>
```
Replace with:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 6: Update publish.html — same nav + script changes**

Open `publish.html`. Find and replace the Sign In button in `.nav-actions` with `<div id="authNav"></div>`. Find the `<script src="app.js"></script>` at the bottom and replace with the three-script block from Steps 3 and 5.

- [ ] **Step 7: Verify in browser**

```bash
vercel dev
```

Open http://localhost:3000 — expected:
- Page loads, no console errors
- Nav shows "Sign In" link (no session yet)
- DevTools Console: no "supabase is not defined" errors

- [ ] **Step 8: Commit**

```bash
git add auth.js index.html marketplace.html publish.html
git commit -m "feat: browser auth client and nav auth state wiring"
```

---

**Continue in Part 2:** `2026-06-26-phase2-part2-auth-pages-stripe.md`
