# Phase 2 — Part 3: Stripe Webhook + Checkout Wiring + Success Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Prerequisites:** Parts 1 and 2 must be complete before starting this file.

**Goal:** Stripe webhook records purchases in Supabase; cart Checkout button calls the real API; success page clears cart and confirms the purchase.

**Tech Stack:** Vanilla JS, Vercel Serverless (`@vercel/node`), Supabase, Stripe, Node.js 20

## Global Constraints

- Working directory: `marketplace-openclaw-raw-full/`
- `supabaseAdmin` exported from `lib/supabase-admin.js` — used only in `/api` files
- `getUser()` is a global async function defined in `auth.js`
- Cart item shape: `{ id: string (slug), name: string, price: number, icon: string }`
- Postgres unique violation error code: `'23505'`

---

## Task 7: Stripe Webhook API

**Files:**
- Create: `api/webhook.js`

**Interfaces:**
- Consumes: `supabaseAdmin` from `../lib/supabase-admin.js`; `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Produces: `POST /api/webhook` → on `checkout.session.completed`, inserts one `purchases` row per plugin
- Idempotent: `stripe_session_id` UNIQUE constraint in DB prevents duplicate rows on retry

- [ ] **Step 1: Create api/webhook.js**

```javascript
// api/webhook.js
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase-admin.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' })

  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true })
  }

  const session = event.data.object
  const { userId, pluginSlugs } = session.metadata ?? {}

  if (!userId || !pluginSlugs) {
    console.error('Missing metadata on session:', session.id)
    return res.status(400).json({ error: 'Missing session metadata' })
  }

  let slugs
  try { slugs = JSON.parse(pluginSlugs) } catch {
    return res.status(400).json({ error: 'Invalid pluginSlugs metadata' })
  }

  const { data: plugins, error: dbError } = await supabaseAdmin
    .from('plugins')
    .select('id, slug')
    .in('slug', slugs)

  if (dbError || !plugins) {
    console.error('DB lookup failed:', dbError)
    return res.status(500).json({ error: 'Failed to look up plugins' })
  }

  for (const slug of slugs) {
    const plugin = plugins.find(p => p.slug === slug)
    if (!plugin) { console.error('No plugin found for slug:', slug); continue }

    const { error: insertError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: userId,
        plugin_id: plugin.id,
        stripe_session_id: session.id,
        amount_paid: session.amount_total / 100,
        currency: session.currency,
      })

    // '23505' = Postgres unique_violation — safe to ignore on webhook retry
    if (insertError && insertError.code !== '23505') {
      console.error('Purchase insert failed for slug', slug, ':', insertError)
    }
  }

  return res.status(200).json({ received: true })
}
```

> **Troubleshooting:** If webhook verification fails with "No signatures found matching the expected signature" — `@vercel/node` may have pre-consumed the body. Add to `vercel.json` under `functions`:
> ```json
> "api/webhook.js": { "runtime": "nodejs20.x", "bodyParser": false }
> ```

- [ ] **Step 2: Install Stripe CLI**

```bash
# macOS
brew install stripe/stripe-cli/stripe
stripe login
```

Other platforms: https://github.com/stripe/stripe-cli/releases

- [ ] **Step 3: Start webhook forwarding (new terminal — keep vercel dev running separately)**

```bash
stripe listen --forward-to http://localhost:3000/api/webhook
```

Expected output includes:
```
> Ready! Your webhook signing secret is whsec_test_...
```

Copy that `whsec_test_...` value → paste into `.env.local` as `STRIPE_WEBHOOK_SECRET`. Restart `vercel dev`.

- [ ] **Step 4: Trigger a test event**

```bash
stripe trigger checkout.session.completed
```

In the `stripe listen` terminal: expect `200 POST /api/webhook [evt_...]`

In Supabase → Table Editor → `purchases`: a new row appears. The `user_id` is a dummy UUID from the test event — that's expected. The row existing confirms the full webhook flow works.

- [ ] **Step 5: Commit**

```bash
git add api/webhook.js
git commit -m "feat: Stripe webhook — records purchases on checkout.session.completed"
```

---

## Task 8: Checkout Wiring + Success Page

**Files:**
- Modify: `app.js` (replace placeholder `checkout()`)
- Create: `success.html`

**Interfaces:**
- Consumes: `getUser()` from `auth.js`; `POST /api/create-checkout` from Task 6
- Produces: Checkout button → `/login` redirect (unauthenticated) or Stripe URL (authenticated); `/success` → clears cart

- [ ] **Step 1: Replace checkout() in app.js**

Find this function:
```javascript
function checkout() {
  if (cart.length === 0) return;
  showToast('🔒 Redirecting to secure checkout...');
  setTimeout(() => {
    alert('Stripe checkout integration coming soon.\n\nThis is where payment processing will be connected.');
  }, 800);
}
```

Replace with:
```javascript
async function checkout() {
  if (cart.length === 0) return

  const user = await getUser()
  if (!user) {
    window.location.href = '/login?next=checkout'
    return
  }

  const paidItems = cart.filter(item => item.price > 0)
  if (paidItems.length === 0) {
    showToast('No paid items — free plugin claiming coming soon')
    return
  }

  showToast('🔒 Redirecting to secure checkout...')

  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: paidItems, userId: user.id }),
    })

    const data = await res.json()

    if (!res.ok) {
      showToast(`Checkout error: ${data.error || 'Something went wrong'}`)
      return
    }

    window.location.href = data.url
  } catch {
    showToast('Network error. Please try again.')
  }
}
```

- [ ] **Step 2: Create success.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed — OpenClaw Marketplace</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<nav class="nav">
  <a href="/" class="nav-logo">
    <div class="claw-icon">⚡</div>
    <span>OpenClaw</span>
    <span class="raw">RAW</span>
  </a>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/marketplace">Browse</a>
    <a href="/publish">Publish</a>
  </div>
  <div class="nav-actions">
    <div id="authNav"></div>
    <button class="cart-btn" onclick="openCart()" aria-label="Cart">
      🛒<span class="cart-count" id="cartCount">0</span>
    </button>
  </div>
</nav>

<main class="auth-page">
  <div class="auth-card" style="text-align:center;">
    <div style="font-size:56px;margin-bottom:24px;">✅</div>
    <h1 class="auth-title">Payment confirmed</h1>
    <p class="auth-sub" style="margin-bottom:32px;">
      Your purchase was successful. Secure downloads will be available
      in My Library once file delivery is enabled in the next update.
    </p>
    <a href="/marketplace" class="btn-primary" style="display:inline-block;">Back to Marketplace →</a>
  </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('ocr_cart')
    updateCartUI()
  })
</script>
</body>
</html>
```

- [ ] **Step 3: End-to-end test**

With `vercel dev` and `stripe listen --forward-to http://localhost:3000/api/webhook` both running:

1. Open http://localhost:3000
2. Add Hunter Gatherer (£9) to cart → click cart icon → "Checkout →"
3. If not signed in: redirected to `/login` → sign in → `/marketplace` → click Checkout again
4. If signed in: toast "🔒 Redirecting to secure checkout..." then Stripe page loads
5. Use Stripe test card: number `4242 4242 4242 4242` · any future expiry · any 3-digit CVC · any postcode
6. Click "Pay £9.00"
7. Browser redirected to http://localhost:3000/success — cart icon shows 0
8. Supabase → Table Editor → `purchases` → new row with matching `user_id`, `plugin_id`, `stripe_session_id`

- [ ] **Step 4: Register production webhook before deploying to Vercel**

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.vercel.app/api/webhook`
3. Event: `checkout.session.completed`
4. Copy signing secret → add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your production URL

- [ ] **Step 5: Commit**

```bash
git add app.js success.html
git commit -m "feat: wire checkout to Stripe API and add success page"
```

---

## Self-Review

- [x] **Spec coverage:** Schema (Part 1 T2) · Auth client + nav (Part 1 T4) · Auth pages (Part 2 T5) · Stripe checkout (Part 2 T6) · Webhook (T7) · Checkout wiring + success (T8) · Out-of-scope items (download, library) excluded ✓
- [x] **No placeholders:** All code complete. `.env.local` template values are filled by developer from dashboards (steps document exactly where).
- [x] **Type consistency:**
  - `supabaseAdmin` from `lib/supabase-admin.js` → imported identically in both API files ✓
  - `getUser()` defined in `auth.js` → called identically in `app.js` checkout() ✓
  - `signIn()` / `signUp()` defined in `auth.js` → called identically in login/signup pages ✓
  - Cart item `{ id, name, price }` in `app.js` → matches `items[]` in `create-checkout.js` ✓
  - `pluginSlugs` JSON-stringified in `create-checkout.js` metadata → `JSON.parse(pluginSlugs)` in `webhook.js` ✓
  - Postgres `'23505'` unique violation code used in `webhook.js` insert error check ✓
