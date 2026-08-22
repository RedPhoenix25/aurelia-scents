// ==========================================================================
// AURELIA SCENTS — STOREFRONT CONTROLLER
// Fonts: Cormorant Garamond (serif) + Inter (sans)
// ==========================================================================

const state = {
  products: [],
  filteredProducts: [],
  activeCategory: 'All',
  cart: JSON.parse(localStorage.getItem('aurelia_cart') || '[]'),
  selectedSizes: {}, // productId -> { volume, price }
  settings: {
    standard_delivery_fee: 2500,
    free_delivery_threshold: 50000,
    currency_symbol: '₦',
    announcement_text: 'Complimentary velvet pouch on orders above ₦50,000'
  }
};

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await fetchSettings();
  await fetchProducts();
  setupEventListeners();
  renderCart();
  updateCartBadge();
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
});

// ── UTILS ───────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return '₦' + Number(n || 0).toLocaleString('en-NG');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const text  = document.getElementById('toast-text');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function reIcons() {
  if (window.lucide) lucide.createIcons();
}

// ── SETTINGS ────────────────────────────────────────────────────────────────
async function fetchSettings() {
  try {
    const res = await fetch('/api/settings');
    const d   = await res.json();
    if (d.success && d.settings) {
      state.settings = { ...state.settings, ...d.settings };
      const barContainer = document.getElementById('announcement-bar');
      const barText      = document.getElementById('announcement-text');
      const text         = (d.settings.announcement_text || '').trim();

      if (barContainer) {
        if (text) {
          barContainer.style.display = 'flex';
          if (barText) barText.textContent = text;
        } else {
          barContainer.style.display = 'none';
        }
      }
    }
  } catch (e) { console.warn('Settings fallback:', e); }
}

// ── PRODUCTS ────────────────────────────────────────────────────────────────
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const d   = await res.json();
    if (d.success) {
      state.products = d.products || [];
      state.products.forEach(p => {
        if (p.sizes && p.sizes.length > 0) {
          state.selectedSizes[p.id] = p.sizes[0];
        } else {
          state.selectedSizes[p.id] = { volume: '50ml', price: p.price || 0 };
        }
      });
      filterProducts();
    }
  } catch (e) { console.error('Products error:', e); }
}

// ── FILTER ──────────────────────────────────────────────────────────────────
function filterProducts(category = state.activeCategory) {
  state.activeCategory = category;

  if (category === 'All') {
    state.filteredProducts = state.products;
  } else if (category === 'Bestseller') {
    state.filteredProducts = state.products.filter(p =>
      p.badge?.toLowerCase().includes('bestseller') || p.featured
    );
  } else {
    state.filteredProducts = state.products.filter(p =>
      p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  renderProductGrid();
  syncFilterUI();
}

function syncFilterUI() {
  // Filter strip (underline style)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === state.activeCategory);
  });

  // Hero pills
  document.querySelectorAll('.hero-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.filter === state.activeCategory);
  });

  // Catalog count
  const countEl = document.getElementById('catalog-count');
  if (countEl) countEl.textContent = `${state.filteredProducts.length} scent${state.filteredProducts.length !== 1 ? 's' : ''}`;
}

// ── PRODUCT GRID ─────────────────────────────────────────────────────────────
function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (!state.filteredProducts.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 10px;color:var(--text-muted);">
        <i data-lucide="search" style="width:32px;height:32px;margin-bottom:12px;color:var(--gold-border);"></i>
        <div style="font-family:var(--font-serif);font-size:18px;color:var(--text-secondary);margin-bottom:6px;">No fragrances found</div>
        <p style="font-size:12px;">Try another category or browse all scents.</p>
      </div>`;
    reIcons();
    return;
  }

  grid.innerHTML = state.filteredProducts.map(p => buildCard(p)).join('');
  reIcons();
}

function buildCard(p) {
  const isOut = p.stock_status === 'OUT_OF_STOCK' || p.stock_quantity === 0;
  const isLow = !isOut && p.stock_quantity > 0 && p.stock_quantity <= 5;
  const sizes = (p.sizes && p.sizes.length > 0) ? p.sizes : [{ volume: '50ml', price: p.price || 0 }];
  const sel   = state.selectedSizes[p.id] || sizes[0];

  const statusBadge = isOut
    ? `<span class="card-status card-status--out">Sold Out</span>`
    : isLow
    ? `<span class="card-status card-status--low">Only ${p.stock_quantity} left</span>`
    : '';

  const lowStockLine = isLow
    ? `<div class="card-low-stock-text">Only ${p.stock_quantity} left</div>`
    : '';

  const sizeMarkup = sizes.length > 1
    ? `<div class="size-row">
        ${sizes.map(s => `
          <button class="size-opt ${sel.volume === s.volume ? 'active' : ''}"
            onclick="selectCardSize('${p.id}','${s.volume}',event)">${s.volume}</button>
        `).join('')}
       </div>`
    : `<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">${sizes[0].volume}</div>`;

  const btnLabel   = isOut ? 'Sold Out' : 'Add to Bag';
  const slashPrice = sel.compareAtPrice || (p.sizes && sel.volume === p.sizes[0]?.volume ? p.compareAtPrice : null) || (sizes.length === 1 ? p.compareAtPrice : null);

  return `
    <div class="product-card" id="card-${p.id}">
      <div class="card-media" onclick="openProductModal('${p.id}')">
        <img src="${p.image}" alt="${p.name}" class="card-img" loading="lazy">
        ${statusBadge}
      </div>
      <div class="card-category">${p.category || 'Fragrance'}</div>
      <div class="card-name" onclick="openProductModal('${p.id}')" style="cursor:pointer;">${p.name}</div>
      <div class="card-subtitle">${p.subtitle || 'Extrait de Parfum'}</div>
      <div class="card-price-row">
        <span class="card-price">${formatPrice(sel.price)}</span>
        ${slashPrice ? `<span class="card-compare">${formatPrice(slashPrice)}</span>` : ''}
      </div>
      ${lowStockLine}
      ${sizeMarkup}
      <button class="btn-primary" ${isOut ? 'disabled' : ''} onclick="addToBag('${p.id}',event)">
        ${btnLabel}
      </button>
    </div>`;
}

// ── SIZE SELECTION ───────────────────────────────────────────────────────────
window.selectCardSize = function(productId, volume, event) {
  if (event) event.stopPropagation();
  const p = state.products.find(p => p.id === productId);
  if (!p?.sizes) return;
  const sz = p.sizes.find(s => s.volume === volume);
  if (sz) {
    state.selectedSizes[productId] = sz;
    renderProductGrid();
  }
};

// ── PRODUCT DETAIL SHEET ─────────────────────────────────────────────────────
window.openProductModal = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;

  const isOut = p.stock_status === 'OUT_OF_STOCK' || p.stock_quantity === 0;
  const sizes = (p.sizes && p.sizes.length > 0) ? p.sizes : [{ volume: '50ml', price: p.price || 0 }];
  const sel   = state.selectedSizes[p.id] || sizes[0];
  const singleSlash = sizes[0].compareAtPrice || p.compareAtPrice;

  // Update sheet header title
  document.getElementById('sheet-product-name').textContent = p.name;

  // Build sizes markup
  const sizesBlock = sizes.length > 1
    ? `<div class="detail-size-label">Select Bottle Size</div>
       <div class="detail-sizes">
         ${sizes.map(s => {
           const variantSlash = s.compareAtPrice || (p.sizes && s.volume === p.sizes[0]?.volume ? p.compareAtPrice : null);
           return `
             <div class="detail-size-btn ${sel.volume === s.volume ? 'active' : ''}"
               onclick="modalSelectSize('${p.id}','${s.volume}')">
               <div class="detail-size-vol">${s.volume}</div>
               <div class="detail-size-price">
                 ${formatPrice(s.price)}
                 ${variantSlash ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:10px;margin-left:4px;font-weight:400;">${formatPrice(variantSlash)}</span>` : ''}
               </div>
             </div>`;
         }).join('')}
       </div>`
    : `<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--r-xs);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
         <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);">Bottle Volume</span>
         <span style="font-size:13px;font-weight:600;color:var(--text-gold);">
           ${sizes[0].volume} · ${formatPrice(sizes[0].price)}
           ${singleSlash ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:11px;margin-left:6px;font-weight:400;">${formatPrice(singleSlash)}</span>` : ''}
         </span>
       </div>`;

  document.getElementById('product-sheet-body').innerHTML = `
    <div class="detail-image-wrap">
      <img src="${p.image}" alt="${p.name}">
    </div>

    <div class="detail-eyebrow">${p.category || 'Fragrance'} · ${p.gender || 'Unisex'}</div>
    <h2 class="detail-name" id="sheet-product-name">${p.name}</h2>
    <div class="detail-subtitle">${p.subtitle || 'Extrait de Parfum'}</div>

    <p class="detail-desc">${p.description || 'An exquisite artisan fragrance crafted with the finest ingredients.'}</p>

    <div class="spec-row" style="margin-bottom:20px;">
      <div class="spec-item">
        <div class="spec-label">Longevity</div>
        <div class="spec-val">${p.longevity || '12+ hrs'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Sillage</div>
        <div class="spec-val">${p.sillage || 'Enveloping'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Concentration</div>
        <div class="spec-val">${p.subtitle || 'EDP'}</div>
      </div>
    </div>

    ${sizesBlock}
  `;

  // Build footer
  document.getElementById('product-sheet-footer').innerHTML = `
    <div class="cta-stack">
      <button class="btn-primary" ${isOut ? 'disabled' : ''} onclick="modalAddToBag('${p.id}')">
        ${isOut ? 'Sold Out' : `Add to Bag · ${formatPrice(sel.price)}`}
      </button>
      <button class="btn-whatsapp" onclick="modalDirectWhatsApp('${p.id}')">
        <i data-lucide="message-circle" style="width:15px;height:15px;"></i>
        Order via WhatsApp
      </button>
    </div>`;

  openSheet('product-sheet');
  reIcons();
};

window.modalSelectSize = function(productId, volume) {
  const p = state.products.find(x => x.id === productId);
  if (!p?.sizes) return;
  const sz = p.sizes.find(s => s.volume === volume);
  if (sz) {
    state.selectedSizes[productId] = sz;
    openProductModal(productId);
    renderProductGrid();
  }
};

// ── ADD TO BAG ───────────────────────────────────────────────────────────────
window.addToBag = function(productId, event) {
  if (event) event.stopPropagation();
  const p = state.products.find(x => x.id === productId);
  if (!p) return;

  if (p.stock_status === 'OUT_OF_STOCK' || p.stock_quantity === 0) {
    showToast('This fragrance is currently out of stock.');
    return;
  }

  const sel = state.selectedSizes[productId] || (p.sizes?.[0]) || { volume: '50ml', price: p.price };
  const idx = state.cart.findIndex(i => i.productId === productId && i.size === sel.volume);

  if (idx > -1) {
    state.cart[idx].quantity += 1;
  } else {
    state.cart.push({
      productId: p.id,
      name:      p.name,
      subtitle:  p.subtitle,
      size:      sel.volume,
      price:     sel.price,
      image:     p.image,
      quantity:  1
    });
  }

  saveCart();
  renderCart();
  updateCartBadge();
  showToast(`${p.name} (${sel.volume}) added to your bag`);
};

window.modalAddToBag = function(productId) {
  addToBag(productId);
  closeSheet('product-sheet');
  openSheet('bag-sheet');
};

window.modalDirectWhatsApp = function(productId) {
  const p   = state.products.find(x => x.id === productId);
  if (!p) return;
  const sel = state.selectedSizes[productId] || (p.sizes?.[0]) || { volume: '50ml', price: p.price };
  sendOrderToWhatsApp({
    orderId: 'WA-' + Math.floor(1000 + Math.random() * 9000),
    customer: { name: 'Customer', phone: '', address: 'To confirm on WhatsApp', city: 'Lagos', state: 'Lagos' },
    items: [{
      productId: p.id,
      name: p.name,
      subtitle: p.subtitle,
      size: sel.volume,
      price: sel.price,
      quantity: 1,
      image: p.image
    }],
    subtotal: sel.price,
    deliveryFee: sel.price >= (state.settings.free_delivery_threshold || 50000) ? 0 : (state.settings.standard_delivery_fee || 2500),
    total: sel.price + (sel.price >= (state.settings.free_delivery_threshold || 50000) ? 0 : (state.settings.standard_delivery_fee || 2500)),
    paymentMethod: 'whatsapp_sync'
  });
};

// ── CART ─────────────────────────────────────────────────────────────────────
function saveCart() {
  localStorage.setItem('aurelia_cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
  const total = state.cart.reduce((s, i) => s + i.quantity, 0);

  const headerBadge = document.getElementById('header-bag-count');
  const navBadge    = document.getElementById('nav-bag-count');
  const bagItemCount = document.getElementById('bag-item-count');

  if (headerBadge) { headerBadge.textContent = total; headerBadge.style.display = total ? 'flex' : 'none'; }
  if (navBadge)    { navBadge.textContent = total;    navBadge.style.display    = total ? 'flex' : 'none'; }
  if (bagItemCount) bagItemCount.textContent = total;
}

function renderCart() {
  const body   = document.getElementById('bag-body');
  const totals = document.getElementById('cart-totals');
  if (!body) return;

  if (!state.cart.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <i data-lucide="shopping-bag" class="cart-empty-icon" style="width:36px;height:36px;"></i>
        <div class="cart-empty-title">Your bag is empty</div>
        <p class="cart-empty-sub">Discover our artisan fragrances and treat yourself.</p>
      </div>`;
    if (totals) totals.innerHTML = '';
    reIcons();
    return;
  }

  let subtotal = 0;

  body.innerHTML = state.cart.map((item, i) => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-size">${item.size} · ${formatPrice(item.price)}</div>
          <div class="cart-qty-row">
            <button class="qty-btn" onclick="updateCartQty(${i},-1)">−</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQty(${i},1)">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <span class="cart-item-price">${formatPrice(lineTotal)}</span>
          <button class="cart-item-remove" onclick="removeCartItem(${i})">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      </div>`;
  }).join('');

  const delivery = subtotal >= (state.settings.free_delivery_threshold || 50000) ? 0 : (state.settings.standard_delivery_fee || 2500);
  const grand    = subtotal + delivery;

  if (totals) {
    totals.innerHTML = `
      <div class="cart-totals-row">
        <span class="cart-totals-label">Subtotal</span>
        <span class="cart-totals-val">${formatPrice(subtotal)}</span>
      </div>
      <div class="cart-totals-row">
        <span class="cart-totals-label">Delivery</span>
        <span class="cart-totals-val">${delivery === 0 ? 'FREE' : formatPrice(delivery)}</span>
      </div>
      <div class="cart-totals-grand">
        <span class="cart-totals-label">Total</span>
        <span class="cart-totals-val">${formatPrice(grand)}</span>
      </div>`;
  }

  reIcons();
}

window.updateCartQty = function(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) state.cart.splice(index, 1);
  saveCart(); renderCart(); updateCartBadge();
};

window.removeCartItem = function(index) {
  state.cart.splice(index, 1);
  saveCart(); renderCart(); updateCartBadge();
};

// ── SEARCH ───────────────────────────────────────────────────────────────────
function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (!query) {
    container.innerHTML = `<div style="text-align:center;padding:24px 0;font-size:12px;color:var(--text-muted);">Type to search fragrances…</div>`;
    return;
  }

  const q = query.toLowerCase();
  const results = state.products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q) ||
    p.subtitle?.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q)
  );

  if (!results.length) {
    container.innerHTML = `<div style="text-align:center;padding:24px 0;font-size:13px;color:var(--text-muted);">No fragrances match "${query}"</div>`;
    return;
  }

  container.innerHTML = results.map(p => `
    <div class="search-result-item" onclick="closeSheet('search-sheet');openProductModal('${p.id}');">
      <img src="${p.image}" alt="${p.name}" class="search-result-img">
      <div>
        <div class="search-result-name">${p.name}</div>
        <div class="search-result-cat">${p.category} · ${p.subtitle || 'EDP'}</div>
      </div>
      <span class="search-result-price">${formatPrice(p.price)}</span>
    </div>`).join('');
}

// ── CHECKOUT ─────────────────────────────────────────────────────────────────
function openCheckout() {
  if (!state.cart.length) { showToast('Your bag is empty.'); return; }
  const subtotal  = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery  = subtotal >= (state.settings.free_delivery_threshold || 50000) ? 0 : (state.settings.standard_delivery_fee || 2500);
  const totalEl   = document.getElementById('checkout-total');
  if (totalEl) totalEl.textContent = formatPrice(subtotal + delivery);
  closeSheet('bag-sheet');
  openSheet('checkout-sheet');
}

async function handleOrderSubmission() {
  const name    = document.getElementById('cust-name')?.value.trim();
  const phone   = document.getElementById('cust-phone')?.value.trim();
  const wa      = document.getElementById('cust-whatsapp')?.value.trim() || phone;
  const address = document.getElementById('cust-address')?.value.trim();
  const city    = document.getElementById('cust-city')?.value.trim();
  const stateV  = document.getElementById('cust-state')?.value;
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'pay_on_delivery';

  if (!name || !phone || !address || !city) {
    showToast('Please fill in all required fields.'); return;
  }

  const subtotal  = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery  = subtotal >= (state.settings.free_delivery_threshold || 50000) ? 0 : (state.settings.standard_delivery_fee || 2500);
  const total     = subtotal + delivery;

  const payload = {
    customer: { name, phone, whatsapp: wa, address, city, state: stateV },
    items: state.cart,
    subtotal, deliveryFee: delivery, total,
    paymentMethod: payment,
    channel: payment === 'whatsapp_sync' ? 'whatsapp' : 'website'
  };

  try {
    const res  = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await res.json();

    if (d.success && d.order) {
      if (payment === 'whatsapp_sync') {
        sendOrderToWhatsApp({ orderId: d.order.id, customer: d.order.customer, items: d.order.items, subtotal, deliveryFee: delivery, total, paymentMethod: payment });
      }
      state.cart = [];
      saveCart(); renderCart(); updateCartBadge();
      showOrderConfirmation(d.order);
      closeSheet('checkout-sheet');
    } else {
      showToast('Error placing order. Please try again.');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error. Please try again.');
  }
}

function showOrderConfirmation(order) {
  const body   = document.getElementById('confirm-body');
  const footer = document.getElementById('confirm-footer');
  if (!body || !footer) return;

  body.innerHTML = `
    <div style="text-align:center;padding:8px 0 20px;">
      <div class="confirm-icon"><i data-lucide="check" style="width:28px;height:28px;"></i></div>
      <div class="confirm-title">Thank you, ${order.customer.name}!</div>
      <div class="confirm-ref">Order <strong>#${order.id}</strong> received</div>
    </div>
    <div class="confirm-summary">
      ${order.items.map(i => `
        <div class="confirm-row">
          <span>${i.name} (${i.size}) ×${i.quantity}</span>
          <span>${formatPrice(i.price * i.quantity)}</span>
        </div>`).join('')}
      <div class="confirm-row" style="padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);font-weight:700;color:var(--text-gold);">
        <span>Total</span><span>${formatPrice(order.total)}</span>
      </div>
    </div>
    <p style="font-size:12px;color:var(--text-muted);text-align:center;">
      We'll contact you at ${order.customer.phone} to confirm delivery to ${order.customer.city}.
    </p>`;

  const waData = encodeURIComponent(JSON.stringify({ orderId: order.id, customer: order.customer, items: order.items, subtotal: order.subtotal, deliveryFee: order.deliveryFee, total: order.total, paymentMethod: order.paymentMethod }));

  footer.innerHTML = `
    <div class="cta-stack">
      <button class="btn-whatsapp" onclick="sendOrderToWhatsApp(JSON.parse(decodeURIComponent('${waData}')))">
        <i data-lucide="message-circle" style="width:15px;height:15px;"></i>
        Chat with Order Ref
      </button>
      <button class="btn-primary" onclick="closeSheet('confirm-sheet')">Continue Shopping</button>
    </div>`;

  openSheet('confirm-sheet');
  reIcons();
}

window.quickSearchTag = function(tag) {
  const input = document.getElementById('search-input');
  if (input) {
    input.value = tag;
    renderSearchResults(tag);
  }
};

// ── ORDER TRACKING ───────────────────────────────────────────────────────────
async function trackOrder(rawQuery) {
  const q = (rawQuery || document.getElementById('track-input')?.value || '').trim();
  const container = document.getElementById('track-result-container');
  if (!container) return;

  if (!q) {
    container.innerHTML = `
      <div style="text-align:center;padding:24px 10px;color:var(--text-muted);font-size:12px;">
        <p style="color:#f87171;">Please enter your order reference or phone number.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="text-align:center;padding:30px 10px;color:var(--text-gold);font-size:12px;">
      <i data-lucide="loader-2" class="spin" style="width:24px;height:24px;margin-bottom:8px;"></i>
      <p>Consulting atelier records…</p>
    </div>`;
  reIcons();

  try {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(q)}`);
    const data = await res.json();

    if (!data.success || !data.tracking) {
      container.innerHTML = `
        <div style="text-align:center;padding:28px 12px;background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.2);border-radius:var(--r-xs);margin-top:10px;">
          <i data-lucide="alert-circle" style="width:28px;height:28px;color:#f87171;margin-bottom:8px;"></i>
          <div style="font-family:var(--font-serif);font-size:16px;color:#f87171;margin-bottom:4px;">Order Not Found</div>
          <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:14px;">No order matching "${q}" was found. Please check your reference or contact our concierge.</p>
          <button class="btn-whatsapp" onclick="openGeneralConciergeWhatsApp()" style="font-size:11px;padding:8px 14px;">
            <i data-lucide="message-circle" style="width:14px;height:14px;"></i> Chat with Concierge
          </button>
        </div>`;
      reIcons();
      return;
    }

    const t = data.tracking;
    const st = t.status || 'Pending';
    const isStep1 = true;
    const isStep2 = ['Processing', 'Shipped', 'Delivered'].includes(st);
    const isStep3 = ['Shipped', 'Delivered'].includes(st);
    const isStep4 = st === 'Delivered';

    const statusBadgeColor = st === 'Delivered' ? '#22c55e' : st === 'Shipped' ? '#38bdf8' : st === 'Processing' ? 'var(--gold)' : 'var(--text-secondary)';

    container.innerHTML = `
      <div class="track-card">
        <div class="track-header">
          <div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);">Order Reference</div>
            <div class="track-ref">#${t.id}</div>
          </div>
          <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;padding:3px 10px;border-radius:var(--r-xs);background:rgba(255,255,255,0.05);color:${statusBadgeColor};border:1px solid ${statusBadgeColor};">
            ${st}
          </span>
        </div>

        <div class="track-timeline">
          <div class="timeline-step ${isStep1 ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">Order Received &amp; Logged</div>
            <div class="timeline-desc">Placed on ${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <div class="timeline-step ${isStep2 ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">Atelier Preparation &amp; Packaging</div>
            <div class="timeline-desc">Hand-bottled and sealed in luxury presentation velvet</div>
          </div>

          <div class="timeline-step ${isStep3 ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">Dispatched with Courier</div>
            <div class="timeline-desc">Destination: ${t.city}, ${t.state}</div>
          </div>

          <div class="timeline-step ${isStep4 ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">Delivered &amp; Enjoyed</div>
            <div class="timeline-desc">${isStep4 ? 'Completed & signed for' : 'Pending final hand-over'}</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-subtle);border-radius:var(--r-xs);padding:12px;margin-bottom:14px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:8px;">Ordered Items</div>
          ${(t.items || []).map(i => `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">
              <span>${i.name} (${i.size || '50ml'}) ×${i.quantity}</span>
              <span style="color:var(--text-gold);">${formatPrice(i.price * i.quantity)}</span>
            </div>
          `).join('')}
          <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:var(--text-gold);padding-top:6px;margin-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
            <span>Total Payable</span>
            <span>${formatPrice(t.total)}</span>
          </div>
        </div>

        <button class="btn-whatsapp" style="width:100%;" onclick="openOrderInquiryWhatsApp('${t.id}')">
          <i data-lucide="message-circle" style="width:15px;height:15px;"></i>
          Inquire with Concierge on WhatsApp
        </button>
      </div>`;
    reIcons();
  } catch (err) {
    console.error('Tracking fetch error:', err);
    container.innerHTML = `<div style="text-align:center;padding:20px;color:#f87171;font-size:12px;">Failed to reach tracking server. Please check your connection.</div>`;
  }
}

window.openOrderInquiryWhatsApp = function(orderId) {
  const phone = getWhatsAppPhone();
  const text  = encodeURIComponent(`👑 *Aurelia Scents Concierge Inquiry*\n\nHello, I am reaching out regarding my Order *#${orderId}*. Could you kindly share dispatch updates? ✨`);
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// ── SHEET HELPERS ────────────────────────────────────────────────────────────
function openSheet(id) {
  const sheet    = document.getElementById(id);
  const backdrop = document.getElementById('backdrop');
  sheet?.classList.add('open');
  backdrop?.classList.add('open');
}

function closeSheet(id) {
  document.getElementById(id)?.classList.remove('open');
  const anyOpen = document.querySelectorAll('.sheet.open').length > 0;
  if (!anyOpen) document.getElementById('backdrop')?.classList.remove('open');
}

function closeAllSheets() {
  document.querySelectorAll('.sheet').forEach(s => s.classList.remove('open'));
  document.getElementById('backdrop')?.classList.remove('open');
}

// ── EVENT LISTENERS ──────────────────────────────────────────────────────────
function setupEventListeners() {
  const backdrop = document.getElementById('backdrop');
  if (backdrop) backdrop.addEventListener('click', closeAllSheets);

  // Header: search + bag + track
  document.getElementById('btn-search')?.addEventListener('click', () => {
    openSheet('search-sheet');
    setTimeout(() => document.getElementById('search-input')?.focus(), 300);
  });
  document.getElementById('btn-bag')?.addEventListener('click', () => openSheet('bag-sheet'));
  document.getElementById('btn-track')?.addEventListener('click', () => {
    openSheet('track-sheet');
    setTimeout(() => document.getElementById('track-input')?.focus(), 300);
  });
  document.getElementById('link-nav-track')?.addEventListener('click', e => {
    e.preventDefault();
    openSheet('track-sheet');
    setTimeout(() => document.getElementById('track-input')?.focus(), 300);
  });

  // Track sheet submit
  document.getElementById('btn-submit-track')?.addEventListener('click', () => trackOrder());
  document.getElementById('track-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') trackOrder();
  });

  // Hero CTA
  document.getElementById('btn-hero-discover')?.addEventListener('click', () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Close buttons
  document.getElementById('close-product-sheet')?.addEventListener('click',  () => closeSheet('product-sheet'));
  document.getElementById('close-bag-sheet')?.addEventListener('click',       () => closeSheet('bag-sheet'));
  document.getElementById('close-search-sheet')?.addEventListener('click',    () => closeSheet('search-sheet'));
  document.getElementById('close-checkout-sheet')?.addEventListener('click',  () => closeSheet('checkout-sheet'));
  document.getElementById('close-confirm-sheet')?.addEventListener('click',   () => closeSheet('confirm-sheet'));
  document.getElementById('close-track-sheet')?.addEventListener('click',     () => closeSheet('track-sheet'));

  // Bottom nav
  document.getElementById('nav-home')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNav('nav-home');
  });
  document.getElementById('nav-shop')?.addEventListener('click', () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    setActiveNav('nav-shop');
  });
  document.getElementById('nav-search')?.addEventListener('click', () => {
    openSheet('search-sheet');
    setTimeout(() => document.getElementById('search-input')?.focus(), 300);
  });
  document.getElementById('nav-bag')?.addEventListener('click', () => openSheet('bag-sheet'));

  // Filter strip
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterProducts(btn.dataset.cat);
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hero pills
  document.querySelectorAll('.hero-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      filterProducts(pill.dataset.filter);
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Collection cards
  document.querySelectorAll('.coll-card').forEach(card => {
    card.addEventListener('click', () => {
      filterProducts(card.dataset.category);
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Search input
  document.getElementById('search-input')?.addEventListener('input', e => {
    renderSearchResults(e.target.value.trim());
  });

  // Cart sheet: proceed to checkout + WhatsApp
  document.getElementById('btn-checkout')?.addEventListener('click', openCheckout);
  document.getElementById('btn-wa-cart')?.addEventListener('click', () => {
    if (!state.cart.length) { showToast('Your bag is empty.'); return; }
    const sub = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const del = sub >= (state.settings.free_delivery_threshold || 50000) ? 0 : (state.settings.standard_delivery_fee || 2500);
    sendOrderToWhatsApp({
      orderId: 'WA-' + Math.floor(1000 + Math.random() * 9000),
      customer: { name: 'Customer', phone: '', address: 'To confirm on WhatsApp', city: 'Lagos', state: 'Lagos' },
      items: state.cart, subtotal: sub, deliveryFee: del, total: sub + del, paymentMethod: 'whatsapp_sync'
    });
  });

  // Checkout: place order
  document.getElementById('btn-place-order')?.addEventListener('click', handleOrderSubmission);

  // Concierge triggers
  document.getElementById('link-nav-concierge')?.addEventListener('click', e => {
    e.preventDefault();
    openGeneralConciergeWhatsApp();
  });
  document.getElementById('btn-hero-concierge')?.addEventListener('click', () => {
    openGeneralConciergeWhatsApp();
  });
  document.getElementById('btn-footer-whatsapp')?.addEventListener('click', () => {
    openGeneralConciergeWhatsApp();
  });
  document.getElementById('btn-footer-call')?.addEventListener('click', () => {
    window.location.href = `tel:+${getWhatsAppPhone()}`;
  });

  // Home link in header
  document.getElementById('home-link')?.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Floating Back to Top Button
  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function setActiveNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(activeId)?.classList.add('active');
}
