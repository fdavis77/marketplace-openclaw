/* ═══════════════════════════════════════════════════════════
   MARKETPLACE OPENCLAW RAW — app.js
   Cart, plugins data, rendering, interactions
═══════════════════════════════════════════════════════════ */

// ── PLUGIN DATA ──────────────────────────────────────────
const PLUGINS = [
  {
    id: 'hunter-gatherer',
    name: 'Hunter Gatherer',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Autonomous web scraper that collects competitor pricing, market trends, and social proof — all structured and ready to act on.',
    cat: 'research',
    tags: ['Scraping', 'Market Research', 'Competitors', 'SME'],
    price: 9,
    rating: 4.9,
    reviews: 34,
    badge: 'hot',
    icon: '🕷️',
    iconBg: 'background: linear-gradient(135deg, #5B21FF, #9333EA)',
  },
  {
    id: 'brand-clone',
    name: 'Brand Clone',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Scrapes any Instagram or Facebook profile, extracts brand voice and persona, then generates matching video scripts and content.',
    cat: 'video',
    tags: ['Instagram', 'Video', 'Brand', 'Content'],
    price: 14,
    rating: 4.7,
    reviews: 18,
    badge: 'new',
    icon: '🎬',
    iconBg: 'background: linear-gradient(135deg, #E11D48, #F97316)',
  },
  {
    id: 'lead-scout',
    name: 'Lead Scout',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Finds and qualifies leads autonomously. Set your target criteria, let OpenClaw scan LinkedIn, directories, and websites.',
    cat: 'marketing',
    tags: ['Leads', 'B2B', 'Outreach', 'LinkedIn'],
    price: 12,
    rating: 4.8,
    reviews: 22,
    badge: 'pro',
    icon: '🎯',
    iconBg: 'background: linear-gradient(135deg, #059669, #10B981)',
  },
  {
    id: 'social-pulse',
    name: 'Social Pulse',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Monitors your brand mentions, hashtags, and competitors across social platforms. Daily digest delivered automatically.',
    cat: 'social',
    tags: ['Monitoring', 'Social', 'Brand', 'Alerts'],
    price: 7,
    rating: 4.6,
    reviews: 41,
    badge: null,
    icon: '📡',
    iconBg: 'background: linear-gradient(135deg, #0284C7, #38BDF8)',
  },
  {
    id: 'copy-engine',
    name: 'Copy Engine',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Generates ad copy, email sequences, social captions, and product descriptions. Brief it once, it writes a full campaign.',
    cat: 'marketing',
    tags: ['Copywriting', 'Ads', 'Email', 'SME'],
    price: 5,
    rating: 4.5,
    reviews: 67,
    badge: null,
    icon: '✍️',
    iconBg: 'background: linear-gradient(135deg, #7C3AED, #A78BFA)',
  },
  {
    id: 'price-watch',
    name: 'Price Watch',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Tracks competitor pricing changes across e-commerce and service sites. Alerts you when prices shift so you can react fast.',
    cat: 'research',
    tags: ['Pricing', 'E-commerce', 'Competitors', 'Alerts'],
    price: 8,
    rating: 4.7,
    reviews: 29,
    badge: null,
    icon: '📊',
    iconBg: 'background: linear-gradient(135deg, #D97706, #FCD34D)',
  },
  {
    id: 'reel-writer',
    name: 'Reel Writer',
    author: 'CommunityDev',
    authorType: 'community',
    desc: 'Turns any product or idea into a viral-ready Instagram Reel script with hooks, captions, and hashtag sets.',
    cat: 'video',
    tags: ['Reels', 'Instagram', 'Scripts', 'Viral'],
    price: 3,
    rating: 4.3,
    reviews: 88,
    badge: null,
    icon: '🎞️',
    iconBg: 'background: linear-gradient(135deg, #BE185D, #EC4899)',
  },
  {
    id: 'invoice-bot',
    name: 'Invoice Bot',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Creates, sends, and chases invoices autonomously. Integrates with Stripe. Logs payments, flags overdue, sends reminders.',
    cat: 'finance',
    tags: ['Invoicing', 'Finance', 'Stripe', 'Automation'],
    price: 11,
    rating: 4.9,
    reviews: 15,
    badge: 'pro',
    icon: '🧾',
    iconBg: 'background: linear-gradient(135deg, #0F766E, #14B8A6)',
  },
  {
    id: 'review-harvester',
    name: 'Review Harvester',
    author: 'CommunityDev',
    authorType: 'community',
    desc: 'Pulls Google, Trustpilot, and TripAdvisor reviews for any business. Summarises sentiment and flags recurring themes.',
    cat: 'research',
    tags: ['Reviews', 'Sentiment', 'Google', 'Research'],
    price: 4,
    rating: 4.4,
    reviews: 53,
    badge: null,
    icon: '⭐',
    iconBg: 'background: linear-gradient(135deg, #1D4ED8, #60A5FA)',
  },
  {
    id: 'seo-spider',
    name: 'SEO Spider',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Crawls any website and returns a full SEO audit — broken links, missing meta, thin content, speed issues, keyword gaps.',
    cat: 'marketing',
    tags: ['SEO', 'Audit', 'Website', 'Keywords'],
    price: 9,
    rating: 4.6,
    reviews: 37,
    badge: null,
    icon: '🔍',
    iconBg: 'background: linear-gradient(135deg, #7C2D12, #F97316)',
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    author: 'CommunityDev',
    authorType: 'community',
    desc: 'Plans a 30-day content calendar across Instagram, LinkedIn, and Facebook. Generates post ideas, hooks, and scheduling slots.',
    cat: 'social',
    tags: ['Content', 'Calendar', 'Social Media', 'Planning'],
    price: 0,
    rating: 4.2,
    reviews: 112,
    badge: 'free',
    icon: '📅',
    iconBg: 'background: linear-gradient(135deg, #166534, #4ADE80)',
  },
  {
    id: 'product-lister',
    name: 'Product Lister',
    author: 'Apps on AI',
    authorType: 'appsOnAI',
    desc: 'Takes product photos and specs, writes optimised listings for Etsy, Amazon, eBay, and Shopify automatically.',
    cat: 'ecommerce',
    tags: ['Etsy', 'Amazon', 'Shopify', 'Listings'],
    price: 6,
    rating: 4.5,
    reviews: 44,
    badge: 'new',
    icon: '🛍️',
    iconBg: 'background: linear-gradient(135deg, #6D28D9, #C4B5FD)',
  },
];

// ── CART STATE ────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('ocr_cart') || '[]');

function saveCart() {
  localStorage.setItem('ocr_cart', JSON.stringify(cart));
}

// ── RENDER PLUGINS ────────────────────────────────────────
function renderPlugins(plugins) {
  const grid = document.getElementById('pluginsGrid');
  if (!grid) return;

  if (plugins.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--muted);">
        <div style="font-size:48px; margin-bottom:16px; opacity:0.3;">🔍</div>
        <p style="font-size:16px;">No plugins match your search.</p>
        <p style="font-size:13px; margin-top:8px;">Try different keywords or clear the filters.</p>
      </div>`;
    return;
  }

  grid.innerHTML = plugins.map(p => {
    const isInCart = cart.some(c => c.id === p.id);
    const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
    const badgeHTML = p.badge ? `<span class="plugin-badge badge-${p.badge}">${p.badge.toUpperCase()}</span>` : '';
    const priceHTML = p.price === 0
      ? `<span class="plugin-price free-price">Free</span>`
      : `<span class="plugin-price"><span class="currency">£</span>${p.price}</span>`;
    const cartBtnHTML = p.price === 0
      ? `<button class="add-to-cart ${isInCart ? 'added' : ''}" onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.icon}','${p.id}'); event.stopPropagation();">${isInCart ? 'Added ✓' : 'Get Free'}</button>`
      : `<button class="add-to-cart ${isInCart ? 'added' : ''}" onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.icon}','${p.id}'); event.stopPropagation();">${isInCart ? 'Added ✓' : 'Add to Cart'}</button>`;

    return `
    <div class="plugin-card" onclick="openPlugin('${p.id}')">
      <div class="plugin-card-header">
        <div class="plugin-icon" style="${p.iconBg}">${p.icon}</div>
        ${badgeHTML}
      </div>
      <div>
        <div class="plugin-name">${p.name}</div>
        <div class="plugin-author">by ${p.author}</div>
      </div>
      <p class="plugin-desc">${p.desc}</p>
      <div class="plugin-tags">
        ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="plugin-footer">
        <div>
          ${priceHTML}
          <div class="plugin-stars" style="margin-top:4px;">
            <span class="stars">${stars}</span>
            <span>${p.rating} (${p.reviews})</span>
          </div>
        </div>
        ${cartBtnHTML}
      </div>
    </div>`;
  }).join('');
}

// ── CART FUNCTIONS ────────────────────────────────────────
function addToCart(id, name, price, icon, iconClass) {
  if (cart.some(c => c.id === id)) {
    showToast(`${name} is already in your cart`);
    return;
  }
  cart.push({ id, name, price, icon });
  saveCart();
  updateCartUI();
  showToast(`${icon} ${name} added to cart`);

  // Update button state
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    const card = btn.closest('.plugin-card');
    if (card && card.getAttribute('onclick')?.includes(id)) {
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
    }
  });
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const count = cart.length;
  const countEl = document.getElementById('cartCount');
  if (countEl) {
    countEl.textContent = count;
    count > 0 ? countEl.classList.add('visible') : countEl.classList.remove('visible');
  }
}

function renderCartItems() {
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <span>Your cart is empty</span>
      </div>`;
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-icon" style="background:var(--slate)">${item.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price === 0 ? 'Free' : `£${item.price.toFixed(2)}`}</div>
      </div>
      <button class="remove-item" onclick="removeFromCart('${item.id}')" title="Remove">✕</button>
    </div>`).join('');

  if (footerEl) footerEl.style.display = 'block';
  if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
}

// ── CART OPEN / CLOSE ─────────────────────────────────────
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  renderCartItems();
}

function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
}

// ── CHECKOUT ──────────────────────────────────────────────
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

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── PLUGIN MODAL (simple) ─────────────────────────────────
function openPlugin(id) {
  const plugin = PLUGINS.find(p => p.id === id);
  if (!plugin) return;
  // Future: open a full detail page/modal
  // For now, add to cart if not already in it
  addToCart(plugin.id, plugin.name, plugin.price, plugin.icon, plugin.id);
}

// ── SEARCH ────────────────────────────────────────────────
function goSearch() {
  const q = document.getElementById('heroSearch')?.value;
  if (q) {
    window.location.href = `marketplace.html?q=${encodeURIComponent(q)}`;
  } else {
    window.location.href = 'marketplace.html';
  }
}

// ── CATEGORY PILLS (home page) ────────────────────────────
function initHomeCats() {
  const pills = document.querySelectorAll('#homeCategories .cat-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.cat;
      const filtered = cat === 'all' ? PLUGINS : PLUGINS.filter(p => p.cat === cat);
      renderPlugins(filtered);
    });
  });
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();

  // Home page
  if (document.getElementById('pluginsGrid') && document.getElementById('homeCategories')) {
    renderPlugins(PLUGINS.slice(0, 8)); // Show first 8 on home
    initHomeCats();
  }

  // Marketplace page — handled inline in marketplace.html

  // Handle URL search param on marketplace
  if (window.location.pathname.includes('marketplace')) {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      const input = document.getElementById('searchInput');
      if (input) { input.value = q; }
    }
  }

  // Animate stats counter on home
  animateCounters();
});

function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  counters.forEach(el => {
    const target = el.textContent;
    if (target === 'Free' || target.includes('.')) return;
    const num = parseInt(target.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return;
    const suffix = target.includes('k') ? 'k' : '';
    let current = 0;
    const increment = num / 40;
    const timer = setInterval(() => {
      current = Math.min(current + increment, num);
      el.textContent = Math.round(current) + suffix;
      if (current >= num) clearInterval(timer);
    }, 30);
  });
}
