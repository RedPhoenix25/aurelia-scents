// ==========================================================================
// AURELIA SCENTS — ADMIN PORTAL CONTROLLER
// No window.alert() / window.confirm() / window.prompt() — ever.
// All notifications use adminToast(). All destructive actions use adminConfirm().
// ==========================================================================

const adminState = {
  products: [],
  orders:   [],
  collections: [],
  stats:    {},
  settings: {},
  activeTab: 'tab-dashboard'
};

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupListeners();
  if (window.lucide) lucide.createIcons();
});

// ── FORMAT ──────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return '₦' + Number(n || 0).toLocaleString('en-NG');
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

// ── THEMED TOAST ─────────────────────────────────────────────────────────────
let _toastTimer;
function adminToast(message, type = 'info') {
  const el   = document.getElementById('admin-toast');
  const text = document.getElementById('admin-toast-text');
  const icon = el?.querySelector('.toast-icon');
  if (!el || !text) return;

  const icons = { success:'check-circle', error:'x-circle', warn:'alert-triangle', info:'info' };
  el.className = `show toast-${type}`;
  text.textContent = message;

  // Swap icon
  if (icon && window.lucide) {
    icon.setAttribute('data-lucide', icons[type] || 'info');
    lucide.createIcons({ nodes: [icon] });
  }

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
function adminConfirm(title, message, okLabel = 'Delete') {
  return new Promise(resolve => {
    const modal  = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl   = document.getElementById('confirm-message');
    const okBtn   = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    titleEl.textContent  = title;
    msgEl.textContent    = message;
    okBtn.textContent    = okLabel;

    modal.classList.add('open');

    const cleanup = () => modal.classList.remove('open');
    okBtn.onclick = () => { cleanup(); resolve(true); };
    cancelBtn.onclick = () => { cleanup(); resolve(false); };
  });
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
function checkAuth() {
  const token = localStorage.getItem('aurelia_admin_token');
  const login = document.getElementById('login-screen');
  const ws    = document.getElementById('admin-workspace');

  if (token) {
    if (login) login.style.display = 'none';
    if (ws)    ws.classList.add('visible');
    loadAdminData();
  } else {
    if (login) login.style.display = 'flex';
    if (ws)    ws.classList.remove('visible');
    if (window.lucide) lucide.createIcons();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username  = document.getElementById('login-username').value.trim();
  const password  = document.getElementById('login-password').value.trim();
  const errDiv    = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit-btn');

  submitBtn.textContent = 'Verifying…';
  submitBtn.disabled    = true;

  try {
    const res  = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem('aurelia_admin_token', data.token);
      errDiv.style.display = 'none';
      checkAuth();
    } else {
      errDiv.textContent   = data.error || 'Invalid credentials.';
      errDiv.style.display = 'block';
    }
  } catch (err) {
    errDiv.textContent   = 'Server connection error.';
    errDiv.style.display = 'block';
  } finally {
    submitBtn.innerHTML  = '<i data-lucide="key-round"></i> Unlock Portal';
    submitBtn.disabled   = false;
    if (window.lucide) lucide.createIcons();
  }
}

function handleLogout() {
  localStorage.removeItem('aurelia_admin_token');
  checkAuth();
}

// ── DATA LOADING ─────────────────────────────────────────────────────────────
async function loadAdminData() {
  await Promise.all([fetchStats(), fetchProducts(), fetchOrders(), fetchSettings(), fetchCollections()]);
  if (window.lucide) lucide.createIcons();
}

async function fetchStats() {
  try {
    const res  = await fetch('/api/admin/stats');
    const data = await res.json();
    if (data.success) {
      adminState.stats    = data.stats    || {};
      adminState.settings = data.settings || {};
      document.getElementById('metric-revenue').textContent   = formatPrice(data.stats.totalRevenue);
      document.getElementById('metric-orders').textContent    = data.stats.totalOrders;
      document.getElementById('metric-low-stock').textContent = data.stats.lowStockCount;
      document.getElementById('metric-out-stock').textContent = data.stats.outOfStockCount;
    }
  } catch (e) { console.error('Stats:', e); }
}

async function fetchProducts() {
  try {
    const res  = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      adminState.products = data.products || [];
      renderProductsList(adminState.products);
    }
  } catch (e) { console.error('Products:', e); }
}

async function fetchOrders() {
  try {
    const res  = await fetch('/api/orders');
    const data = await res.json();
    if (data.success) {
      adminState.orders = data.orders || [];
      renderOrdersList(adminState.orders);
      renderDashboardRecentOrders(adminState.orders.slice(0, 4));
    }
  } catch (e) { console.error('Orders:', e); }
}

async function fetchSettings() {
  try {
    const res  = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById('set-whatsapp').value     = s.whatsapp_number         || '2347080097512';
      document.getElementById('set-delivery-fee').value = s.standard_delivery_fee   || 2500;
      document.getElementById('set-free-threshold').value = s.free_delivery_threshold || 50000;
      document.getElementById('set-announcement').value = s.announcement_text        || '';
    }
  } catch (e) { console.error('Settings:', e); }
}

// ── RENDER PRODUCTS ───────────────────────────────────────────────────────────
function renderProductsList(products) {
  const container = document.getElementById('admin-products-list');
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package" style="width:36px;height:36px;color:var(--gold-border);margin-bottom:10px;"></i>
        <div class="empty-state-title">No fragrances yet</div>
        <p style="font-size:12px;">Add your first fragrance with the button above.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = products.map(p => {
    const isOut = p.stock_status === 'OUT_OF_STOCK' || p.stock_quantity === 0;
    const isLow = !isOut && p.stock_quantity > 0 && p.stock_quantity <= 5;

    return `
      <div class="admin-item-card" id="admin-prod-${p.id}">

        <!-- Product identity -->
        <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;">
          <img src="${p.image}" alt="${p.name}" class="prod-card-img" loading="lazy">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div>
                <div class="prod-card-name">${p.name}</div>
                <div class="prod-card-meta">${p.category} · ${p.subtitle || 'Eau de Parfum'}</div>
              </div>
              <span class="prod-card-price">
                ${formatPrice(p.price)}
                ${p.compareAtPrice ? `<span style="font-size:11px;color:var(--text-muted);text-decoration:line-through;margin-left:5px;font-weight:400;">${formatPrice(p.compareAtPrice)}</span>` : ''}
              </span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;">
              ${(p.sizes || []).map(s => `<span style="background:rgba(255,255,255,0.05);padding:2px 6px;border-radius:3px;">${s.volume}: ${formatPrice(s.price)}${s.compareAtPrice ? ` <del style="color:var(--text-muted);font-size:9.5px;margin-left:2px;">${formatPrice(s.compareAtPrice)}</del>` : ''}</span>`).join('')}
            </div>
            ${isLow ? `<div style="font-size:10.5px;color:var(--status-low);margin-top:4px;">Only ${p.stock_quantity} units left</div>` : ''}
          </div>
        </div>

        <!-- Stock controls -->
        <div class="stock-panel">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="qty-label">Status</span>
            <button class="stock-toggle ${isOut ? 'out-stock' : 'in-stock'}"
              onclick="toggleProductStock('${p.id}','${isOut ? 'IN_STOCK' : 'OUT_OF_STOCK'}')">
              <i data-lucide="${isOut ? 'x-circle' : 'check-circle-2'}" style="width:13px;height:13px;"></i>
              ${isOut ? 'Out of Stock' : 'In Stock'}
            </button>
          </div>
          <div class="qty-group">
            <span class="qty-label">Units</span>
            <input type="number" min="0" value="${p.stock_quantity || 0}" id="input-qty-${p.id}" class="qty-input">
            <button class="btn-ghost" onclick="saveProductQuantity('${p.id}')" title="Save quantity" style="padding:5px 10px;font-size:10px;">
              <i data-lucide="check" style="width:13px;height:13px;"></i>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn-ghost" style="font-size:10px;padding:6px 12px;" onclick="openEditProductModal('${p.id}')">
            <i data-lucide="edit-3" style="width:13px;height:13px;"></i> Edit
          </button>
          <button class="btn-danger" style="font-size:10px;padding:6px 12px;" onclick="deleteProduct('${p.id}')">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i> Delete
          </button>
        </div>

      </div>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── STOCK ACTIONS ─────────────────────────────────────────────────────────────
window.toggleProductStock = async function(productId, newStatus) {
  try {
    const res  = await fetch(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      await fetchProducts();
      await fetchStats();
      adminToast(`Stock status updated to ${newStatus === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}`, 'success');
    }
  } catch (e) { adminToast('Failed to update stock status.', 'error'); }
};

window.saveProductQuantity = async function(productId) {
  const input = document.getElementById(`input-qty-${productId}`);
  if (!input) return;
  const qty = parseInt(input.value, 10) || 0;

  try {
    const res  = await fetch(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_quantity: qty })
    });
    const data = await res.json();
    if (data.success) {
      await fetchProducts();
      await fetchStats();
      adminToast(`Quantity updated to ${qty} unit${qty !== 1 ? 's' : ''}`, 'success');
    }
  } catch (e) { adminToast('Failed to update quantity.', 'error'); }
};

window.deleteProduct = async function(productId) {
  const p = adminState.products.find(x => x.id === productId);
  const confirmed = await adminConfirm(
    'Delete Fragrance',
    `Remove "${p?.name || 'this fragrance'}" from inventory? This cannot be undone.`,
    'Delete'
  );
  if (!confirmed) return;

  try {
    const res  = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchProducts();
      await fetchStats();
      adminToast('Fragrance deleted from inventory.', 'warn');
    }
  } catch (e) { adminToast('Failed to delete fragrance.', 'error'); }
};

// ── RENDER ORDERS ─────────────────────────────────────────────────────────────
function statusBadgeClass(status) {
  const map = { Pending:'status-pending', Processing:'status-processing', Shipped:'status-shipped', Delivered:'status-delivered', Cancelled:'status-cancelled' };
  return map[status] || 'status-pending';
}

function renderOrdersList(orders) {
  const container = document.getElementById('admin-orders-list');
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="shopping-cart" style="width:36px;height:36px;color:var(--gold-border);margin-bottom:10px;"></i>
        <div class="empty-state-title">No orders yet</div>
        <p style="font-size:12px;">Customer orders will appear here once placed.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = orders.map(order => {
    const statusOptions = ['Pending','Processing','Shipped','Delivered','Cancelled']
      .map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`)
      .join('');

    return `
      <div class="admin-item-card">

        <!-- Order header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="order-id">#${order.id}</span>
            <span class="status-badge ${statusBadgeClass(order.status)}">${order.status}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="order-total">${formatPrice(order.total)}</span>
            <span class="order-date">${formatDate(order.createdAt)}</span>
          </div>
        </div>

        <!-- Customer block -->
        <div class="order-detail-block">
          <div class="order-customer-name">
            <i data-lucide="user" style="width:13px;height:13px;margin-right:5px;"></i>${order.customer.name}
            <span style="font-size:11px;font-weight:400;color:var(--text-muted);margin-left:6px;">${order.customer.phone}</span>
          </div>
          <div class="order-customer-addr">
            <i data-lucide="map-pin" style="width:12px;height:12px;margin-right:5px;"></i>${order.customer.address}, ${order.customer.city}, ${order.customer.state}
          </div>
          <div class="order-items">
            <i data-lucide="package" style="width:12px;height:12px;margin-right:5px;"></i>
            ${order.items.map(i => `${i.name} (${i.size || '50ml'}) ×${i.quantity}`).join(' · ')}
          </div>
        </div>

        <!-- Actions row -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);">Update Status</span>
            <select class="status-select" onchange="updateOrderStatus('${order.id}',this.value)">
              ${statusOptions}
            </select>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="btn-whatsapp" style="padding:7px 14px;" onclick="notifyCustomerWhatsApp('${order.id}')">
              <i data-lucide="message-circle" style="width:13px;height:13px;"></i> WhatsApp Update
            </button>
            <button type="button" class="btn-danger" style="padding:7px 12px;font-size:10px;" onclick="deleteOrder('${order.id}')">
              <i data-lucide="trash-2" style="width:13px;height:13px;"></i> Delete
            </button>
          </div>
        </div>

      </div>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

window.notifyCustomerWhatsApp = function(orderId) {
  const order = adminState.orders.find(o => o.id === orderId);
  if (!order) return;

  const cleanPhone = (order.customer.phone || '').replace(/[^0-9]/g, '');
  const waPhone    = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
  const status     = order.status || 'Pending';

  let statusMsg = '';
  if (status === 'Processing') {
    statusMsg = `✨ *Update:* Your fragrance parcel is currently being prepared and hand-packaged in our atelier.`;
  } else if (status === 'Shipped') {
    statusMsg = `🚀 *Dispatch Notice:* Your bespoke order has been handed to our courier for direct delivery to *${order.customer.address}, ${order.customer.city}*.`;
  } else if (status === 'Delivered') {
    statusMsg = `🎉 *Delivered:* Your Aurelia Scents creation has been delivered! We hope you love your new signature fragrance.`;
  } else if (status === 'Cancelled') {
    statusMsg = `⚠️ *Notice:* Your order #${order.id} has been marked as cancelled. Please contact us if you have questions.`;
  } else {
    statusMsg = `✨ *Order Logged:* We have received your order and are confirming inventory and dispatch schedule.`;
  }

  const itemsList = (order.items || []).map((it, idx) => `${idx + 1}. *${it.name}* (${it.size || '50ml'}) × ${it.quantity}`).join('\n');

  const fullMsg = 
`👑 *AURELIA SCENTS — ORDER UPDATE #${order.id}*
━━━━━━━━━━━━━━━━━━━━
Dear *${order.customer.name}*,

${statusMsg}

📦 *ORDERED CREATIONS:*
${itemsList}

💰 *TOTAL:* ${formatPrice(order.total)}
📍 *DELIVERY DESTINATION:* ${order.customer.address}, ${order.customer.city}

━━━━━━━━━━━━━━━━━━━━
_Thank you for choosing Aurelia Scents Haute Parfumerie._ ✨`;

  const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(fullMsg)}`;
  window.open(url, '_blank');
};

function renderDashboardRecentOrders(orders) {
  const container = document.getElementById('dashboard-recent-orders');
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:10px 0;">No orders yet.</div>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <div class="recent-order-row" onclick="switchTab('tab-orders')">
      <div>
        <div class="recent-order-name">${o.customer.name}</div>
        <div class="recent-order-meta">${o.items.length} item${o.items.length !== 1 ? 's' : ''} · <span class="status-badge ${statusBadgeClass(o.status)}" style="padding:1px 7px;">${o.status}</span></div>
      </div>
      <span class="recent-order-amount">${formatPrice(o.total)}</span>
    </div>`).join('');

  if (window.lucide) lucide.createIcons();
}

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────
window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const res  = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      await fetchOrders();
      await fetchStats();
      adminToast(`Order status updated to ${newStatus}`, 'success');
    }
  } catch (e) { adminToast('Failed to update order status.', 'error'); }
};

// ── DELETE ORDER ──────────────────────────────────────────────────────────────
window.deleteOrder = async function(orderId) {
  const confirmed = await adminConfirm(
    'Delete Order',
    `Permanently delete order #${orderId}? This cannot be undone and will not restore stock.`,
    'Delete'
  );
  if (!confirmed) return;

  try {
    const res  = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchOrders();
      await fetchStats();
      adminToast(`Order #${orderId} deleted.`, 'warn');
    } else {
      adminToast(data.error || 'Failed to delete order.', 'error');
    }
  } catch (e) { adminToast('Server error while deleting order.', 'error'); }
};

// ── EXPORT ORDERS TO CSV ──────────────────────────────────────────────────────
window.exportOrdersCSV = function() {
  const orders = adminState.orders;
  if (!orders.length) {
    adminToast('No orders to export.', 'warn');
    return;
  }

  const headers = ['Order ID','Date','Customer Name','Phone','Address','City','State','Items','Subtotal (₦)','Delivery Fee (₦)','Total (₦)','Payment Method','Status'];

  const escape = val => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = orders.map(o => [
    o.id,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : '',
    o.customer?.name || '',
    o.customer?.phone || '',
    o.customer?.address || '',
    o.customer?.city || '',
    o.customer?.state || '',
    (o.items || []).map(i => `${i.name} (${i.size||'50ml'}) x${i.quantity}`).join(' | '),
    o.subtotal ?? '',
    o.deliveryFee ?? '',
    o.total ?? '',
    o.paymentMethod || '',
    o.status || ''
  ].map(escape).join(','));

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  link.href     = url;
  link.download = `aurelia-orders-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  adminToast(`Exported ${orders.length} order${orders.length !== 1 ? 's' : ''} to CSV.`, 'success');
};

// ── SIZE VARIANTS MANAGER ───────────────────────────────────────────────────
function renderFormSizes(sizes) {
  const container = document.getElementById('form-sizes-container');
  if (!container) return;
  
  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
    sizes = [{ volume: '50ml', price: '', compareAtPrice: '' }];
  }

  container.innerHTML = sizes.map(s => `
    <div class="size-variant-row" style="display:grid;grid-template-columns:1fr 1fr 1fr 34px;gap:8px;align-items:center;">
      <input type="text" class="form-input size-vol-input" value="${s.volume || '50ml'}" placeholder="e.g. 50ml" required>
      <input type="number" class="form-input size-price-input" value="${s.price !== undefined ? s.price : ''}" placeholder="38000" required>
      <input type="number" class="form-input size-slash-input" value="${s.compareAtPrice !== undefined && s.compareAtPrice !== null ? s.compareAtPrice : ''}" placeholder="45000 (Opt)">
      <button type="button" class="btn-danger btn-icon" onclick="removeSizeRow(this)" title="Remove size" style="width:34px;height:34px;">
        <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

window.addSizeRow = function(vol = '50ml', pr = '', slash = '') {
  const container = document.getElementById('form-sizes-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'size-variant-row';
  row.style = 'display:grid;grid-template-columns:1fr 1fr 1fr 34px;gap:8px;align-items:center;';
  row.innerHTML = `
    <input type="text" class="form-input size-vol-input" value="${vol}" placeholder="e.g. 50ml" required>
    <input type="number" class="form-input size-price-input" value="${pr}" placeholder="38000" required>
    <input type="number" class="form-input size-slash-input" value="${slash}" placeholder="45000 (Opt)">
    <button type="button" class="btn-danger btn-icon" onclick="removeSizeRow(this)" title="Remove size" style="width:34px;height:34px;">
      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
    </button>
  `;
  container.appendChild(row);
  if (window.lucide) lucide.createIcons();
};

window.removeSizeRow = function(btn) {
  const container = document.getElementById('form-sizes-container');
  if (container.querySelectorAll('.size-variant-row').length <= 1) {
    adminToast('At least one size variant (e.g. 50ml) is required.', 'warn');
    return;
  }
  btn.closest('.size-variant-row')?.remove();
};

// ── IMAGE UPLOAD FROM DEVICE ────────────────────────────────────────────────
let currentUploadedBase64 = null;

function setupImageUploadListeners() {
  const fileInput = document.getElementById('form-prod-file');
  const dropzone  = document.getElementById('upload-dropzone');
  const removeBtn = document.getElementById('btn-remove-image');

  dropzone?.addEventListener('click', () => fileInput?.click());
  removeBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      adminToast('Please select a valid image file (PNG, JPG, or WEBP).', 'warn');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      adminToast('Image file size must be under 15MB.', 'warn');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      currentUploadedBase64 = evt.target.result;
      const previewContainer = document.getElementById('upload-preview-container');
      const previewImg       = document.getElementById('upload-preview-img');
      const filenameText     = document.getElementById('upload-filename-text');

      if (previewImg) previewImg.src = currentUploadedBase64;
      if (filenameText) filenameText.textContent = file.name;
      previewContainer?.classList.add('has-image');
      if (dropzone) dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

// ── PRODUCT FORM MODAL ────────────────────────────────────────────────────────
window.openEditProductModal = function(productId) {
  const modal   = document.getElementById('product-form-modal');
  const heading = document.getElementById('product-modal-heading');
  const p       = adminState.products.find(x => x.id === productId);

  currentUploadedBase64 = null;
  const previewContainer = document.getElementById('upload-preview-container');
  const previewImg       = document.getElementById('upload-preview-img');
  const filenameText     = document.getElementById('upload-filename-text');
  const dropzone         = document.getElementById('upload-dropzone');
  const fileInput        = document.getElementById('form-prod-file');
  if (fileInput) fileInput.value = '';

  if (p) {
    heading.textContent = `Edit — ${p.name}`;
    document.getElementById('form-prod-id').value          = p.id;
    document.getElementById('form-prod-name').value        = p.name;
    document.getElementById('form-prod-subtitle').value    = p.subtitle || '';
    document.getElementById('form-prod-category').value    = p.category || 'Oud';
    document.getElementById('form-prod-badge').value       = p.badge    || '';
    document.getElementById('form-prod-qty').value         = p.stock_quantity ?? 10;
    document.getElementById('form-prod-image-value').value = p.image || '';
    document.getElementById('form-prod-desc').value        = p.description || '';
    renderFormSizes(p.sizes || [{ volume: '50ml', price: p.price, compareAtPrice: p.compareAtPrice }]);

    if (p.image) {
      if (previewImg) previewImg.src = p.image;
      if (filenameText) filenameText.textContent = 'Current fragrance photo';
      previewContainer?.classList.add('has-image');
      if (dropzone) dropzone.style.display = 'none';
    } else {
      previewContainer?.classList.remove('has-image');
      if (dropzone) dropzone.style.display = 'flex';
    }
  } else {
    heading.textContent = 'Add New Fragrance';
    document.getElementById('product-edit-form').reset();
    document.getElementById('form-prod-id').value          = '';
    document.getElementById('form-prod-qty').value         = 10;
    document.getElementById('form-prod-image-value').value = '';
    renderFormSizes([{ volume: '50ml', price: '', compareAtPrice: '' }]);
    previewContainer?.classList.remove('has-image');
    if (dropzone) dropzone.style.display = 'flex';
  }

  modal?.classList.add('open');
  if (window.lucide) lucide.createIcons();
};

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id             = document.getElementById('form-prod-id').value;
  const name           = document.getElementById('form-prod-name').value.trim();
  const subtitle       = document.getElementById('form-prod-subtitle').value.trim();
  const category       = document.getElementById('form-prod-category').value;
  const badge          = document.getElementById('form-prod-badge').value.trim();
  const stock_quantity = Number(document.getElementById('form-prod-qty').value);
  let finalImageUrl    = document.getElementById('form-prod-image-value').value.trim();
  const description    = document.getElementById('form-prod-desc').value.trim();

  // 1. Upload new image if chosen from device
  if (currentUploadedBase64) {
    try {
      const upRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: currentUploadedBase64 })
      });
      const upData = await upRes.json();
      if (upData.success && upData.imageUrl) {
        finalImageUrl = upData.imageUrl;
      } else {
        adminToast('Image upload failed: ' + (upData.error || 'Server error'), 'error');
        return;
      }
    } catch (upErr) {
      console.error(upErr);
      adminToast('Error uploading image to server.', 'error');
      return;
    }
  }

  if (!finalImageUrl) {
    adminToast('Please tap above to upload a photograph from your device.', 'warn');
    return;
  }

  // 2. Collect dynamic sizes (Volume, Selling Price, Slash Price)
  const sizeRows = document.querySelectorAll('.size-variant-row');
  const sizes = Array.from(sizeRows).map(row => {
    const vol = row.querySelector('.size-vol-input')?.value.trim() || '50ml';
    const pr  = Number(row.querySelector('.size-price-input')?.value || 0);
    const slashVal = row.querySelector('.size-slash-input')?.value.trim();
    return {
      volume: vol,
      price: pr,
      compareAtPrice: slashVal ? Number(slashVal) : null,
      in_stock: true
    };
  }).filter(s => s.price > 0);

  if (sizes.length === 0) {
    adminToast('Please set at least one volume size with price (e.g. 50ml: ₦35,000).', 'warn');
    return;
  }

  const primaryCompare = sizes[0].compareAtPrice || null;

  const payload = {
    name, subtitle, category, badge,
    price: sizes[0].price,
    compareAtPrice: primaryCompare,
    sizes,
    stock_quantity,
    stock_status: stock_quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    image: finalImageUrl,
    description
  };

  try {
    const res  = id
      ? await fetch(`/api/products/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      : await fetch('/api/products',        { method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });

    const data = await res.json();
    if (data.success) {
      document.getElementById('product-form-modal')?.classList.remove('open');
      await fetchProducts();
      await fetchStats();
      adminToast(id ? `${name} updated successfully` : `${name} added to inventory`, 'success');
    } else {
      adminToast('Save failed: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (e) {
    adminToast('Network error. Please try again.', 'error');
  }
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
async function handleSettingsSubmit(e) {
  e.preventDefault();
  const whatsapp_number        = document.getElementById('set-whatsapp').value.trim();
  const standard_delivery_fee  = Number(document.getElementById('set-delivery-fee').value);
  const free_delivery_threshold= Number(document.getElementById('set-free-threshold').value);
  const announcement_text      = document.getElementById('set-announcement').value.trim();
  const newPassword            = document.getElementById('set-admin-password')?.value.trim();

  const payload = { whatsapp_number, standard_delivery_fee, free_delivery_threshold, announcement_text };
  if (newPassword) payload.admin_password = newPassword;

  try {
    const res  = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      adminToast('Store settings saved successfully', 'success');
      if (newPassword) document.getElementById('set-admin-password').value = '';
      await fetchSettings();
    } else {
      adminToast('Failed to save settings.', 'error');
    }
  } catch (e) {
    adminToast('Network error. Please try again.', 'error');
  }
}

// ── COLLECTIONS ──────────────────────────────────────────────────────────────
let collUploadedBase64 = null;

async function fetchCollections() {
  try {
    const res  = await fetch('/api/collections');
    const data = await res.json();
    if (data.success) {
      adminState.collections = data.collections || [];
      renderCollectionsList();
    }
  } catch (e) { console.error('Collections:', e); }
}

function renderCollectionsList() {
  const container = document.getElementById('admin-collections-list');
  if (!container) return;
  const collections = adminState.collections;

  if (!collections.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="layers" style="width:36px;height:36px;color:var(--gold-border);margin-bottom:10px;"></i>
        <div class="empty-state-title">No collections yet</div>
        <p style="font-size:12px;">Add your first curated collection with the button above.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = collections.map((c, idx) => `
    <div class="admin-item-card">
      <div class="coll-admin-card">
        <img src="${c.image || ''}" alt="${c.name}" class="coll-admin-img" loading="lazy">
        <div class="coll-admin-info">
          <div class="coll-admin-name">${c.name}</div>
          <div class="coll-admin-desc">${c.description || ''}</div>
          <span class="coll-admin-cat">
            <i data-lucide="tag" style="width:10px;height:10px;"></i> ${c.category}
          </span>
        </div>
      </div>

      <div class="coll-admin-actions">
        <div class="coll-reorder-group">
          <button class="coll-reorder-btn" title="Move up" onclick="moveCollection(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>
            <i data-lucide="chevron-up" style="width:14px;height:14px;"></i>
          </button>
          <span class="coll-order-badge">${idx + 1} / ${collections.length}</span>
          <button class="coll-reorder-btn" title="Move down" onclick="moveCollection(${idx}, 1)" ${idx === collections.length - 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-down" style="width:14px;height:14px;"></i>
          </button>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-ghost" style="font-size:10px;padding:6px 12px;" onclick="openEditCollectionModal('${c.id}')">
            <i data-lucide="edit-3" style="width:13px;height:13px;"></i> Edit
          </button>
          <button class="btn-danger" style="font-size:10px;padding:6px 12px;" onclick="deleteCollection('${c.id}')">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i> Delete
          </button>
        </div>
      </div>
    </div>`).join('');

  if (window.lucide) lucide.createIcons();
}

// ── COLLECTION MODAL ──────────────────────────────────────────────────────────
window.openEditCollectionModal = function(collId) {
  const modal   = document.getElementById('collection-form-modal');
  const heading = document.getElementById('collection-modal-heading');
  const c       = collId ? adminState.collections.find(x => x.id === collId) : null;

  collUploadedBase64 = null;
  const previewContainer = document.getElementById('coll-upload-preview-container');
  const previewImg       = document.getElementById('coll-upload-preview-img');
  const filenameText     = document.getElementById('coll-upload-filename-text');
  const dropzone         = document.getElementById('coll-upload-dropzone');
  const fileInput        = document.getElementById('form-coll-file');
  if (fileInput) fileInput.value = '';

  if (c) {
    heading.textContent = `Edit — ${c.name}`;
    document.getElementById('form-coll-id').value          = c.id;
    document.getElementById('form-coll-name').value        = c.name || '';
    document.getElementById('form-coll-desc').value        = c.description || '';
    document.getElementById('form-coll-category').value    = c.category || 'Oud';
    document.getElementById('form-coll-image-value').value = c.image || '';

    if (c.image) {
      if (previewImg) previewImg.src = c.image;
      if (filenameText) filenameText.textContent = 'Current collection photo';
      previewContainer?.classList.add('has-image');
      if (dropzone) dropzone.style.display = 'none';
    } else {
      previewContainer?.classList.remove('has-image');
      if (dropzone) dropzone.style.display = 'flex';
    }
  } else {
    heading.textContent = 'Add Collection';
    document.getElementById('collection-edit-form').reset();
    document.getElementById('form-coll-id').value          = '';
    document.getElementById('form-coll-image-value').value = '';
    previewContainer?.classList.remove('has-image');
    if (dropzone) dropzone.style.display = 'flex';
  }

  modal?.classList.add('open');
  if (window.lucide) lucide.createIcons();
};

async function handleCollectionFormSubmit(e) {
  e.preventDefault();
  const id       = document.getElementById('form-coll-id').value;
  const name     = document.getElementById('form-coll-name').value.trim();
  const desc     = document.getElementById('form-coll-desc').value.trim();
  const category = document.getElementById('form-coll-category').value;
  let imageUrl   = document.getElementById('form-coll-image-value').value.trim();

  // Upload image if a new file was selected
  if (collUploadedBase64) {
    try {
      const upRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: collUploadedBase64 })
      });
      const upData = await upRes.json();
      if (upData.success && upData.imageUrl) {
        imageUrl = upData.imageUrl;
      } else {
        adminToast('Image upload failed: ' + (upData.error || 'Server error'), 'error');
        return;
      }
    } catch (upErr) {
      console.error(upErr);
      adminToast('Error uploading image to server.', 'error');
      return;
    }
  }

  if (!name) {
    adminToast('Please enter a collection name.', 'warn');
    return;
  }

  if (!imageUrl) {
    adminToast('Please upload a collection image.', 'warn');
    return;
  }

  let collections = [...adminState.collections];

  if (id) {
    // Edit existing
    const idx = collections.findIndex(c => c.id === id);
    if (idx !== -1) {
      collections[idx] = { ...collections[idx], name, description: desc, category, image: imageUrl };
    }
  } else {
    // Add new
    const newColl = {
      id: `coll-${Date.now()}`,
      name,
      description: desc,
      category,
      image: imageUrl,
      order: collections.length + 1
    };
    collections.push(newColl);
  }

  // Re-number order
  collections.forEach((c, i) => c.order = i + 1);

  await saveCollections(collections);
  document.getElementById('collection-form-modal')?.classList.remove('open');
  adminToast(id ? `${name} updated` : `${name} added to collections`, 'success');
}

async function saveCollections(collections) {
  try {
    const res = await fetch('/api/collections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections })
    });
    const data = await res.json();
    if (data.success) {
      adminState.collections = data.collections || collections;
      renderCollectionsList();
    } else {
      adminToast('Failed to save collections.', 'error');
    }
  } catch (e) {
    adminToast('Network error saving collections.', 'error');
  }
}

window.deleteCollection = async function(collId) {
  const c = adminState.collections.find(x => x.id === collId);
  const confirmed = await adminConfirm(
    'Delete Collection',
    `Remove "${c?.name || 'this collection'}" from the storefront? This cannot be undone.`,
    'Delete'
  );
  if (!confirmed) return;

  let collections = adminState.collections.filter(x => x.id !== collId);
  collections.forEach((c, i) => c.order = i + 1);
  await saveCollections(collections);
  adminToast('Collection removed.', 'warn');
};

window.moveCollection = async function(idx, dir) {
  const collections = [...adminState.collections];
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= collections.length) return;

  // Swap
  [collections[idx], collections[newIdx]] = [collections[newIdx], collections[idx]];
  collections.forEach((c, i) => c.order = i + 1);
  await saveCollections(collections);
};

function setupCollectionImageUpload() {
  const fileInput = document.getElementById('form-coll-file');
  const dropzone  = document.getElementById('coll-upload-dropzone');
  const changeBtn = document.getElementById('btn-coll-change-image');

  dropzone?.addEventListener('click', () => fileInput?.click());
  changeBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      adminToast('Please select a valid image file (PNG, JPG, or WEBP).', 'warn');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      adminToast('Image file size must be under 15MB.', 'warn');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      collUploadedBase64 = evt.target.result;
      const previewContainer = document.getElementById('coll-upload-preview-container');
      const previewImg       = document.getElementById('coll-upload-preview-img');
      const filenameText     = document.getElementById('coll-upload-filename-text');

      if (previewImg) previewImg.src = collUploadedBase64;
      if (filenameText) filenameText.textContent = file.name;
      previewContainer?.classList.add('has-image');
      if (dropzone) dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

// ── TAB SWITCHING ─────────────────────────────────────────────────────────────
window.switchTab = function(tabId) {
  adminState.activeTab = tabId;

  // Content
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.toggle('active', sec.id === tabId);
  });

  // Mobile tabs
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Sidebar items
  document.querySelectorAll('.sidebar-nav-item[data-tab]').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  if (window.lucide) lucide.createIcons();
};

// ── LISTENERS ─────────────────────────────────────────────────────────────────
function setupListeners() {
  document.getElementById('admin-login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

  // All tab triggers (sidebar + mobile)
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', () => switchTab(el.dataset.tab));
  });

  // Product modal, size adder & device image uploader
  setupImageUploadListeners();
  document.getElementById('btn-open-add-product')?.addEventListener('click', () => openEditProductModal(null));
  document.getElementById('btn-close-product-modal')?.addEventListener('click', () => {
    document.getElementById('product-form-modal')?.classList.remove('open');
  });
  document.getElementById('btn-add-size-row')?.addEventListener('click', () => window.addSizeRow('50ml', ''));
  document.getElementById('product-edit-form')?.addEventListener('submit', handleProductFormSubmit);

  // Collection modal & image uploader
  setupCollectionImageUpload();
  document.getElementById('btn-open-add-collection')?.addEventListener('click', () => openEditCollectionModal(null));
  document.getElementById('btn-close-collection-modal')?.addEventListener('click', () => {
    document.getElementById('collection-form-modal')?.classList.remove('open');
  });
  document.getElementById('collection-edit-form')?.addEventListener('submit', handleCollectionFormSubmit);

  // Settings form
  document.getElementById('store-settings-form')?.addEventListener('submit', handleSettingsSubmit);

  // Order filter
  document.getElementById('filter-order-status')?.addEventListener('change', e => {
    const status = e.target.value;
    renderOrdersList(status === 'All' ? adminState.orders : adminState.orders.filter(o => o.status === status));
  });

  // Product search
  document.getElementById('admin-product-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderProductsList(!q ? adminState.products : adminState.products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ));
  });

  // Confirm modal backdrop click = cancel
  document.getElementById('confirm-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('confirm-modal')) {
      document.getElementById('confirm-cancel-btn')?.click();
    }
  });
}
