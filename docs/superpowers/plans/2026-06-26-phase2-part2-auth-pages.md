# Phase 2 — Part 2: Auth Pages + Stripe Checkout API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Prerequisites:** Complete Part 1 (`2026-06-26-phase2-part1-setup-schema-auth-client.md`) first.
> **Continues in:** Part 3 (`2026-06-26-phase2-part3-webhook-wiring.md`)

**Goal:** Add auth pages (login/signup) matching the dark theme, Stripe checkout API with server-side price validation.

**Tech Stack:** Vanilla JS, Vercel Serverless (`@vercel/node`), Supabase Auth, Stripe, Node.js 20

## Global Constraints

- Working directory: `marketplace-openclaw-raw-full/`
- CSS vars available: `--black`, `--deep`, `--slate`, `--border`, `--indigo`, `--indigo-l`, `--lime`, `--white`, `--muted`, `--danger`, `--r-sm`, `--r-md`, `--r-lg`, `--font-display`, `--font-body`
- `signIn(email, password)`, `signUp(email, password)`, `doSignOut()`, `getUser()` — global functions from `auth.js`
- `supabaseAdmin` exported from `lib/supabase-admin.js` — used only in `/api` files
- Cart item shape: `{ id: string (slug), name: string, price: number, icon: string }`

---

## Task 5: Auth Pages + Style Additions

**Files:**
- Modify: `style.css` (append auth styles at bottom)
- Create: `login.html`
- Create: `signup.html`

**Interfaces:**
- Consumes: `signIn(email, password)`, `signUp(email, password)` from `auth.js`
- Produces: `/login` redirects to `/marketplace` on success; `/signup` shows confirmation message on success

- [ ] **Step 1: Append to the bottom of style.css**

```css
/* ─── AUTH PAGES ─────────────────────────────────────────── */
.auth-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--deep);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 40px 36px;
}
.auth-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}
.auth-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.auth-sub {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin-bottom: 32px;
}
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.auth-field { display: flex; flex-direction: column; gap: 6px; }
.auth-field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.auth-field input {
  background: var(--slate);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--white);
  transition: border-color 0.2s;
  outline: none;
}
.auth-field input:focus { border-color: var(--indigo); }
.auth-field input::placeholder { color: var(--muted); }
.auth-error { font-size: 13px; color: var(--danger); min-height: 18px; }
.auth-success {
  font-size: 13px;
  color: var(--lime);
  background: rgba(200,255,0,0.08);
  border: 1px solid rgba(200,255,0,0.2);
  border-radius: var(--r-sm);
  padding: 10px 14px;
  line-height: 1.5;
}
.auth-submit { width: 100%; padding: 12px; font-size: 15px; margin-top: 4px; }
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-switch { text-align: center; font-size: 13px; color: var(--muted); margin-top: 24px; }
.auth-switch a { color: var(--indigo-l); }
.auth-switch a:hover { text-decoration: underline; }
```

- [ ] **Step 2: Create login.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In — OpenClaw Marketplace</title>
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
  <div class="auth-card">
    <div class="auth-logo">
      <div class="claw-icon" style="width:48px;height:48px;font-size:24px;">⚡</div>
    </div>
    <h1 class="auth-title">Sign in to OpenClaw</h1>
    <p class="auth-sub">Access your purchased plugins and checkout faster.</p>
    <form class="auth-form" id="loginForm" onsubmit="handleLogin(event)">
      <div class="auth-field">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="you@example.com" required autocomplete="email">
      </div>
      <div class="auth-field">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="••••••••" required autocomplete="current-password">
      </div>
      <div class="auth-error" id="loginError"></div>
      <button type="submit" class="btn-primary auth-submit" id="loginBtn">Sign In</button>
    </form>
    <p class="auth-switch">Don't have an account? <a href="/signup">Sign up →</a></p>
  </div>
</main>

<div class="toast" id="toast"><span class="toast-icon">✓</span><span id="toastMsg">Signed in</span></div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
<script>
async function handleLogin(e) {
  e.preventDefault()
  const btn = document.getElementById('loginBtn')
  const errorEl = document.getElementById('loginError')
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  errorEl.textContent = ''
  btn.textContent = 'Signing in...'
  btn.disabled = true
  try {
    await signIn(email, password)
    window.location.href = '/marketplace'
  } catch (err) {
    errorEl.textContent = err.message || 'Sign in failed. Please check your credentials.'
    btn.textContent = 'Sign In'
    btn.disabled = false
  }
}
</script>
</body>
</html>
```

- [ ] **Step 3: Create signup.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Account — OpenClaw Marketplace</title>
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
  <div class="auth-card">
    <div class="auth-logo">
      <div class="claw-icon" style="width:48px;height:48px;font-size:24px;">⚡</div>
    </div>
    <h1 class="auth-title">Create your account</h1>
    <p class="auth-sub">Join thousands of SMEs using OpenClaw plugins.</p>
    <form class="auth-form" id="signupForm" onsubmit="handleSignup(event)">
      <div class="auth-field">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="you@example.com" required autocomplete="email">
      </div>
      <div class="auth-field">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="••••••••" required autocomplete="new-password" minlength="6">
      </div>
      <div class="auth-field">
        <label for="confirmPassword">Confirm password</label>
        <input type="password" id="confirmPassword" placeholder="••••••••" required autocomplete="new-password">
      </div>
      <div class="auth-error" id="signupError"></div>
      <div class="auth-success" id="signupSuccess" style="display:none;"></div>
      <button type="submit" class="btn-primary auth-submit" id="signupBtn">Create Account</button>
    </form>
    <p class="auth-switch">Already have an account? <a href="/login">Sign in →</a></p>
  </div>
</main>

<div class="toast" id="toast"><span class="toast-icon">✓</span><span id="toastMsg">Account created</span></div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
<script>
async function handleSignup(e) {
  e.preventDefault()
  const btn = document.getElementById('signupBtn')
  const errorEl = document.getElementById('signupError')
  const successEl = document.getElementById('signupSuccess')
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const confirm = document.getElementById('confirmPassword').value
  errorEl.textContent = ''
  successEl.style.display = 'none'
  if (password !== confirm) { errorEl.textContent = 'Passwords do not match.'; return }
  btn.textContent = 'Creating account...'
  btn.disabled = true
  try {
    await signUp(email, password)
    document.getElementById('signupForm').style.display = 'none'
    successEl.textContent = 'Check your email to confirm your account, then sign in.'
    successEl.style.display = 'block'
  } catch (err) {
    errorEl.textContent = err.message || 'Sign up failed. Please try again.'
    btn.textContent = 'Create Account'
    btn.disabled = false
  }
}
</script>
</body>
</html>
```

- [ ] **Step 4: Verify in browser**

With `vercel dev` running:
- Open http://localhost:3000/login — dark form, no console errors
- Open http://localhost:3000/signup — dark form, password mismatch shows error inline
- Sign up with `test@example.com` / `test1234` → success message or confirmation email
- Sign in with same creds → redirects to `/marketplace`, nav shows email + Sign Out

- [ ] **Step 5: Commit**

```bash
git add style.css login.html signup.html
git commit -m "feat: auth pages (login, signup) and form styles"
```

---

## Task 6: Stripe Checkout API

**Files:**
- Create: `api/create-checkout.js`

**Interfaces:**
- Consumes: `supabaseAdmin` from `../lib/supabase-admin.js`; `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`
- Produces: `POST /api/create-checkout` → `{ url: string }` (Stripe hosted checkout URL)
- Input: `{ items: [{ id: string, name: string, price: number }], userId: string }`

- [ ] **Step 1: Create api/create-checkout.js**

```javascript
// api/create-checkout.js
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase-admin.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString()
        resolve(raw ? JSON.parse(raw) : {})
      } catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body
  try {
    body = (req.body && typeof req.body === 'object') ? req.body : await parseJsonBody(req)
  } catch { return res.status(400).json({ error: 'Invalid request body' }) }

  const { items, userId } = body

  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided' })
  if (!userId) return res.status(401).json({ error: 'User ID required' })

  const paidItems = items.filter(item => Number(item.price) > 0)
  if (paidItems.length === 0) return res.status(400).json({ error: 'No paid items in cart' })

  const slugs = paidItems.map(item => String(item.id))

  const { data: plugins, error: dbError } = await supabaseAdmin
    .from('plugins')
    .select('id, slug, name, price')
    .in('slug', slugs)
    .eq('status', 'published')

  if (dbError || !plugins || plugins.length === 0) return res.status(400).json({ error: 'Could not verify plugin details' })

  for (const item of paidItems) {
    const dbPlugin = plugins.find(p => p.slug === item.id)
    if (!dbPlugin) return res.status(400).json({ error: `Plugin not found: ${item.id}` })
    if (Math.abs(Number(dbPlugin.price) - Number(item.price)) > 0.001) {
      return res.status(400).json({ error: `Price mismatch for: ${item.id}` })
    }
  }

  const lineItems = paidItems.map(item => {
    const dbPlugin = plugins.find(p => p.slug === item.id)
    return {
      price_data: {
        currency: 'gbp',
        product_data: { name: dbPlugin.name },
        unit_amount: Math.round(Number(dbPlugin.price) * 100),
      },
      quantity: 1,
    }
  })

  let session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace`,
      metadata: { userId, pluginSlugs: JSON.stringify(slugs) },
    })
  } catch (err) {
    console.error('Stripe session creation failed:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }

  return res.status(200).json({ url: session.url })
}
```

- [ ] **Step 2: Add Stripe keys to .env.local**

Stripe Dashboard → Developers → API keys:
- **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
- **Publishable key** (`pk_test_...`) → `STRIPE_PUBLISHABLE_KEY`

Restart `vercel dev` after updating `.env.local`.

- [ ] **Step 3: Test with curl**

```bash
curl -s -X POST http://localhost:3000/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"hunter-gatherer","name":"Hunter Gatherer","price":9}],"userId":"test-user-id"}' \
  | python3 -m json.tool
```

Expected: `{ "url": "https://checkout.stripe.com/c/pay/cs_test_..." }`

If `{ "error": "Could not verify plugin details" }` — check Supabase credentials and seed data.
If `{ "error": "Failed to create checkout session" }` — check `STRIPE_SECRET_KEY`.

- [ ] **Step 4: Commit**

```bash
git add api/create-checkout.js
git commit -m "feat: Stripe checkout session API with server-side price validation"
```

---

**Continue in Part 3:** `2026-06-26-phase2-part3-webhook-wiring.md`
