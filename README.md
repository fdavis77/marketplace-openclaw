# Marketplace OpenClaw Raw

> The open plugin and skills marketplace for OpenClaw users.
> Built for SME owners who want agentic AI that works — without the technical overhead.

**A product by Apps on AI · Zenith Global Holdings Ltd**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Quick Start — Deploy in 5 Minutes](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Backend Setup — Supabase](#backend-setup-supabase)
6. [Payment Integration — Stripe](#payment-integration-stripe)
7. [Secure File Delivery](#secure-file-delivery)
8. [User Authentication](#user-authentication)
9. [Seller Portal](#seller-portal)
10. [API Routes — Vercel Edge Functions](#api-routes)
11. [Database Schema](#database-schema)
12. [Security Checklist](#security-checklist)
13. [Deployment — Vercel](#deployment-vercel)
14. [Roadmap](#roadmap)
15. [Tech Stack Summary](#tech-stack-summary)

---

## Project Overview

Marketplace OpenClaw Raw is a two-sided marketplace where:

- **Buyers** (SME owners using OpenClaw) browse, purchase, and download plugins and skills
- **Sellers** (Apps on AI + third-party developers) list and monetise their OpenClaw extensions

**Revenue model:**
- Free to browse and register
- Paid plugins priced from £2 to £50 (one-time purchase)
- 80% seller / 20% platform revenue split
- Payments processed via Stripe
- Payouts to sellers via Stripe Connect

**Current build:** Static frontend (HTML/CSS/JS)
**Next phase:** Supabase backend + Stripe payments + user accounts

---

## File Structure

```
marketplace-openclaw-raw/
│
├── index.html              # Homepage — hero, featured plugin, grid, how it works
├── marketplace.html        # Browse page — filters, search, sort, full plugin grid
├── publish.html            # Seller submission form + earnings calculator
├── style.css               # Full design system — tokens, components, layout
├── app.js                  # Cart logic, plugin data, rendering, interactions
├── vercel.json             # Vercel routing, security headers, caching, region
├── .env.local              # !! Never commit this — your secret keys live here
├── README.md               # This file
│
├── /api                    # Vercel Edge Functions (to be built — see below)
│   ├── create-checkout.js  # Stripe checkout session creator
│   ├── webhook.js          # Stripe webhook handler — confirms payment
│   ├── download.js         # Generates signed Supabase download URL post-payment
│   └── submit-plugin.js    # Handles seller plugin submission
│
└── /public                 # Static assets (icons, og images, etc.)
    └── og-image.png
```

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- A [Vercel](https://vercel.com) account (free)
- A [Supabase](https://supabase.com) account (free tier works)
- A [Stripe](https://stripe.com) account

### 1. Clone or open in your IDE

```bash
# If using Git
git init
git add .
git commit -m "Initial commit — Marketplace OpenClaw Raw"

# Push to GitHub
gh repo create marketplace-openclaw-raw --public
git push origin main
```

### 2. Install Vercel CLI

```bash
npm install -g vercel
```

### 3. Link to Vercel

```bash
vercel login
vercel link
```

### 4. Add environment variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PUBLISHABLE_KEY
```

### 5. Deploy

```bash
vercel --prod
```

Your site is live. Custom domain: `vercel domains add yourdomain.com`

---

## Environment Variables

Create a `.env.local` file in the root. **Never commit this file to Git.**

Add `.env.local` to your `.gitignore` immediately:

```bash
echo ".env.local" >> .gitignore
```

```env
# ── SUPABASE ──────────────────────────────────────────────
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here   # Server-side only. Never expose to browser.

# ── STRIPE ────────────────────────────────────────────────
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx     # Safe to use in browser
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx          # Server-side only. Never expose to browser.
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx        # From Stripe dashboard webhooks section

# ── APP ───────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://marketplace-openclaw-raw.vercel.app
```

> **Critical security rule:** Any key prefixed `STRIPE_SECRET`, `SUPABASE_SERVICE_ROLE`, or similar
> must NEVER appear in any `.html`, `.js` file loaded by the browser. These live in
> `/api` server functions only. This was the lesson from the bot.py API key exposure incident —
> apply it here from day one.

---

## Backend Setup — Supabase

### 1. Create a new Supabase project

Go to [supabase.com](https://supabase.com) → New Project → name it `marketplace-openclaw-raw`

### 2. Install Supabase client

```bash
npm install @supabase/supabase-js
```

### 3. Initialise client (browser-safe, anon key only)

Create `/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. Server-side client (API routes only — uses service role key)

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Never use this in browser code
)
```

---

## Payment Integration — Stripe

### How it works (secure flow)

```
User clicks "Add to Cart" → clicks "Checkout"
        ↓
Browser calls /api/create-checkout  (Vercel Edge Function)
        ↓
Server creates Stripe Checkout Session (using secret key)
        ↓
User redirected to Stripe hosted checkout page
        ↓
User pays → Stripe calls /api/webhook
        ↓
Webhook verified → purchase recorded in Supabase
        ↓
User redirected to /success page
        ↓
User clicks "Download" → /api/download generates signed URL
        ↓
File downloaded from Supabase Storage (never a public URL)
```

### Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

### /api/create-checkout.js

```javascript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { items, userId } = req.body

  // Build line items from cart
  const lineItems = items.map(item => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.name,
        metadata: { pluginId: item.id }
      },
      unit_amount: Math.round(item.price * 100), // Stripe uses pence
    },
    quantity: 1,
  }))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace`,
    metadata: { userId, items: JSON.stringify(items.map(i => i.id)) }
  })

  res.json({ url: session.url })
}
```

### /api/webhook.js — Confirm payment and unlock download

```javascript
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase-admin'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, items } = session.metadata
    const pluginIds = JSON.parse(items)

    // Record each purchase in Supabase
    for (const pluginId of pluginIds) {
      await supabaseAdmin.from('purchases').insert({
        user_id: userId,
        plugin_id: pluginId,
        stripe_session_id: session.id,
        amount_paid: session.amount_total / 100,
        currency: session.currency,
      })
    }
  }

  res.json({ received: true })
}
```

### Register webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret → paste as `STRIPE_WEBHOOK_SECRET` in Vercel env vars

---

## Secure File Delivery

Plugin files must never be publicly accessible URLs. A buyer should only get a download link after a confirmed payment.

### Storage setup in Supabase

1. Go to Supabase → Storage → Create bucket: `plugin-files`
2. Set bucket to **Private** (not public)
3. Upload plugin `.zip` files here

### /api/download.js — Generate signed URL

```javascript
import { supabaseAdmin } from '../lib/supabase-admin'

export default async function handler(req, res) {
  const { pluginId, userId } = req.query

  // Verify the user actually purchased this plugin
  const { data: purchase, error } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('plugin_id', pluginId)
    .single()

  if (error || !purchase) {
    return res.status(403).json({ error: 'Purchase not found' })
  }

  // Generate a signed URL valid for 60 seconds — one-time use
  const { data, error: urlError } = await supabaseAdmin
    .storage
    .from('plugin-files')
    .createSignedUrl(`${pluginId}.zip`, 60)

  if (urlError) return res.status(500).json({ error: 'Could not generate download link' })

  res.json({ url: data.signedUrl })
}
```

---

## User Authentication

Using Supabase Auth — handles sign up, login, sessions, password reset, and OAuth.

### Add to index.html / marketplace.html

```javascript
import { supabase } from './lib/supabase.js'

// Sign up
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) showToast('Sign up failed: ' + error.message)
  else showToast('Check your email to confirm your account')
}

// Sign in
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) showToast('Sign in failed: ' + error.message)
  else showToast('Welcome back!')
}

// Get current user
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sign out
async function signOut() {
  await supabase.auth.signOut()
}
```

### Row Level Security (RLS) — critical

Enable RLS on all tables in Supabase. Users should only see their own purchases:

```sql
-- Enable RLS on purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can only read their own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert purchases (via webhook)
CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

## Seller Portal

### Plugin submission flow

1. Seller fills out `/publish.html` form
2. Form POSTs to `/api/submit-plugin.js`
3. Plugin file uploaded to `plugin-files-pending` bucket (private)
4. Record inserted into `plugins` table with `status: 'pending'`
5. Apps on AI reviews via admin dashboard
6. On approval: status updated to `published`, file moved to `plugin-files` bucket

### /api/submit-plugin.js

```javascript
import { supabaseAdmin } from '../lib/supabase-admin'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  const form = formidable({ maxFileSize: 50 * 1024 * 1024 }) // 50MB limit

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'File upload failed' })

    const { name, description, category, price, sellerEmail } = fields
    const pluginFile = files.plugin_file?.[0]

    // Upload to pending storage
    const fileBuffer = fs.readFileSync(pluginFile.filepath)
    const fileName = `${Date.now()}-${pluginFile.originalFilename}`

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('plugin-files-pending')
      .upload(fileName, fileBuffer)

    if (uploadError) return res.status(500).json({ error: 'Upload failed' })

    // Insert plugin record
    await supabaseAdmin.from('plugins').insert({
      name: name[0],
      description: description[0],
      category: category[0],
      price: parseFloat(price[0]),
      seller_email: sellerEmail[0],
      file_path: fileName,
      status: 'pending',
    })

    res.json({ success: true, message: 'Plugin submitted for review' })
  })
}
```

---

## Database Schema

Run this SQL in Supabase → SQL Editor:

```sql
-- ── USERS (handled by Supabase Auth) ──────────────────────

-- ── PLUGINS ───────────────────────────────────────────────
CREATE TABLE plugins (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  author          TEXT NOT NULL,
  description     TEXT NOT NULL,
  short_desc      TEXT,
  category        TEXT NOT NULL,
  tags            TEXT[],
  price           DECIMAL(10,2) NOT NULL DEFAULT 0,
  file_path       TEXT,
  icon            TEXT,
  badge           TEXT,
  rating          DECIMAL(3,2) DEFAULT 0,
  review_count    INT DEFAULT 0,
  install_count   INT DEFAULT 0,
  seller_email    TEXT,
  seller_stripe_id TEXT,
  status          TEXT DEFAULT 'pending', -- pending | published | rejected
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PURCHASES ─────────────────────────────────────────────
CREATE TABLE purchases (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id         UUID REFERENCES plugins(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_paid       DECIMAL(10,2),
  currency          TEXT DEFAULT 'gbp',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWS ───────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id   UUID REFERENCES plugins(id) ON DELETE CASCADE,
  rating      INT CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plugin_id) -- One review per user per plugin
);

-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_status ON plugins(status);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_plugin_id ON purchases(plugin_id);

-- ── RLS POLICIES ──────────────────────────────────────────
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read published plugins
CREATE POLICY "Public can view published plugins"
  ON plugins FOR SELECT
  USING (status = 'published');

-- Users can read own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can write own reviews
CREATE POLICY "Users can write reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read all reviews
CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT
  USING (true);
```

---

## Security Checklist

Before going live, verify every item on this list:

### Environment & Keys
- [ ] `.env.local` is in `.gitignore` and never committed
- [ ] `STRIPE_SECRET_KEY` only appears in `/api` server functions
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only appears in `/api` server functions
- [ ] All Vercel environment variables are set for Production environment
- [ ] Stripe is in Live mode (not Test) before launch

### Payments
- [ ] Stripe webhook signature verification is active (`constructEvent`)
- [ ] Download URLs are only generated after confirmed webhook — not after redirect
- [ ] Signed download URLs expire after 60 seconds
- [ ] Plugin files are in a **private** Supabase Storage bucket

### Database
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Users can only query their own purchases
- [ ] Plugins table only returns `status = 'published'` to public
- [ ] No direct table access from browser using service role key

### Frontend
- [ ] No secret keys anywhere in `app.js`, `index.html`, or any browser-loaded file
- [ ] Content Security Policy in `vercel.json` is active
- [ ] `X-Frame-Options: DENY` header is active
- [ ] HTTPS enforced via `Strict-Transport-Security` header

### Seller Uploads
- [ ] Plugin file uploads validated for file type (`.zip`, `.json` only)
- [ ] 50MB file size limit enforced server-side
- [ ] Uploaded files go to `plugin-files-pending` (private) not live bucket
- [ ] Manual review required before plugin goes live

---

## Deployment — Vercel

### First deploy

```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Connect custom domain

```bash
vercel domains add marketplace-openclaw-raw.com
```

Then update DNS at your registrar:
- Add `A` record pointing to `76.76.21.21`
- Add `CNAME` for `www` pointing to `cname.vercel-dns.com`

### Automatic deploys via GitHub

1. Push repo to GitHub
2. Go to vercel.com → Import Project → select repo
3. Every push to `main` auto-deploys to production
4. Every PR creates a preview deployment

### Vercel region

Currently set to `lhr1` (London) in `vercel.json` — correct for UK-based users and GDPR compliance.

---

## Roadmap

### Phase 1 — Current (Static Frontend) ✅
- [x] Homepage with hero, plugin grid, category filters
- [x] Marketplace browse page with sidebar filters and search
- [x] Publish/seller submission page with earnings calculator
- [x] Cart with localStorage persistence
- [x] Vercel config with security headers
- [x] 12 seed plugins including Hunter Gatherer and Brand Clone

### Phase 2 — Backend & Payments
- [ ] Supabase project setup and schema
- [ ] Supabase Auth — sign up, login, sessions
- [ ] Stripe Checkout — server-side payment flow
- [ ] Stripe webhook — purchase confirmation
- [ ] Secure signed download URLs
- [ ] My Library page — purchased plugins

### Phase 3 — Seller Tools
- [ ] Seller dashboard — sales, earnings, analytics
- [ ] Stripe Connect — automated seller payouts
- [ ] Plugin review/approval workflow (admin)
- [ ] Seller verification badges

### Phase 4 — Growth
- [ ] Plugin detail pages with screenshots and reviews
- [ ] Review and rating system
- [ ] Featured placement and promoted listings
- [ ] Email notifications (Resend)
- [ ] Search powered by Supabase full-text search
- [ ] OpenClaw compatibility verification badges

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML / CSS / Vanilla JS | UI, cart, plugin rendering |
| Hosting | Vercel (lhr1 — London) | Static hosting, edge functions, CDN |
| Database | Supabase (PostgreSQL) | Plugins, purchases, users, reviews |
| Auth | Supabase Auth | Sign up, login, sessions, RLS |
| Payments | Stripe Checkout | One-time purchases, webhooks |
| Payouts | Stripe Connect | Automated seller revenue share |
| File Storage | Supabase Storage | Plugin zip files (private bucket) |
| Email | Resend (Phase 4) | Purchase receipts, seller notifications |
| Fonts | Google Fonts | Space Grotesk + Inter |

---

## Company

**Apps on AI** — a venture under Zenith Global Holdings Ltd  
Built by Fabian Davis

---

*Last updated: 2025*
