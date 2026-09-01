/* ==========================================================================
   admin.js — admin dashboard logic (food management, order management)
   ========================================================================== */

(function () {
  initStorage();

  const el = {
    loginScreen: document.getElementById('loginScreen'),
    loginForm: document.getElementById('loginForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),

    adminShell: document.getElementById('adminShell'),
    sessionUserLabel: document.getElementById('sessionUserLabel'),
    logoutBtn: document.getElementById('logoutBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebar: document.querySelector('.admin-sidebar'),
    panelTitle: document.getElementById('panelTitle'),

    statTotalOrders: document.getElementById('statTotalOrders'),
    statPendingOrders: document.getElementById('statPendingOrders'),
    statCompletedOrders: document.getElementById('statCompletedOrders'),
    statTotalFoods: document.getElementById('statTotalFoods'),
    recentOrdersTable: document.getElementById('recentOrdersTable').querySelector('tbody'),
    recentOrdersEmpty: document.getElementById('recentOrdersEmpty'),

    foodsTable: document.getElementById('foodsTable').querySelector('tbody'),
    addFoodBtn: document.getElementById('addFoodBtn'),
    foodModal: document.getElementById('foodModal'),
    foodModalTitle: document.getElementById('foodModalTitle'),
    foodForm: document.getElementById('foodForm'),
    foodCategorySelect: document.getElementById('foodCategorySelect'),
    closeFoodModal: document.getElementById('closeFoodModal'),

    allOrdersTable: document.getElementById('allOrdersTable').querySelector('tbody'),
    allOrdersEmpty: document.getElementById('allOrdersEmpty'),
    orderDetailModal: document.getElementById('orderDetailModal'),
    orderDetailBody: document.getElementById('orderDetailBody'),
    closeOrderDetail: document.getElementById('closeOrderDetail'),

    toastContainer: document.getElementById('toastContainer')
  };

  function showToast(message, type = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`.trim();
    toast.textContent = message;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  /* ---------------------------------------------------------------------
     Auth gate
     --------------------------------------------------------------------- */
  function enterDashboard() {
    const session = AdminAuth.getSession();
    el.loginScreen.hidden = true;
    el.adminShell.hidden = false;
    el.sessionUserLabel.textContent = session ? `Signed in as ${session.username}` : '';
    renderAll();
  }

  function requireAuth() {
    if (AdminAuth.isAuthenticated()) {
      enterDashboard();
    } else {
      el.loginScreen.hidden = false;
      el.adminShell.hidden = true;
    }
  }

  el.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = AdminAuth.login(el.loginUsername.value, el.loginPassword.value);
    if (result.success) {
      el.loginError.hidden = true;
      el.loginForm.reset();
      enterDashboard();
    } else {
      el.loginError.textContent = result.message;
      el.loginError.hidden = false;
    }
  });

  el.logoutBtn.addEventListener('click', () => {
    AdminAuth.logout();
    requireAuth();
    showToast('Logged out');
  });

  /* ---------------------------------------------------------------------
     Sidebar navigation
     --------------------------------------------------------------------- */
  const panelLabels = { overview: 'Overview', foods: 'Food Management', orders: 'Orders' };

  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const panel = link.dataset.panel;
      document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.toggle('active', l === link));
      document.querySelectorAll('.admin-panel').forEach(p => { p.hidden = p.dataset.panel !== panel; });
      el.panelTitle.textContent = panelLabels[panel];
      el.sidebar.classList.remove('open');
      if (panel === 'overview') renderOverview();
      if (panel === 'foods') renderFoods();
      if (panel === 'orders') renderOrdersPanel();
    });
  });

  el.mobileMenuBtn.addEventListener('click', () => el.sidebar.classList.toggle('open'));

  /* ---------------------------------------------------------------------
     Overview panel
     --------------------------------------------------------------------- */
  function renderOverview() {
    const stats = OrderStore.stats();
    const foods = FoodStore.getAll();
    el.statTotalOrders.textContent = stats.total;
    el.statPendingOrders.textContent = stats.pending;
    el.statCompletedOrders.textContent = stats.completed;
    el.statTotalFoods.textContent = foods.length;

    const recent = OrderStore.getAll().slice(0, 6);
    el.recentOrdersTable.innerHTML = '';
    el.recentOrdersEmpty.hidden = recent.length > 0;
    recent.forEach(order => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${order.id}</strong></td>
        <td>${order.customer.name}</td>
        <td>${new Date(order.date).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</td>
        <td>${formatNaira(order.total)}</td>
        <td><span class="status-pill status-${order.status.toLowerCase()}">${order.status}</span></td>
      `;
      el.recentOrdersTable.appendChild(tr);
    });
  }

  /* ---------------------------------------------------------------------
     Food management panel
     --------------------------------------------------------------------- */
  function populateCategorySelect() {
    el.foodCategorySelect.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  }

  function renderFoods() {
    const foods = FoodStore.getAll();
    el.foodsTable.innerHTML = '';
    foods.forEach(food => {
      const fallback = foodPlaceholderDataUri(food.category);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img class="food-thumb" src="${food.image || fallback}" alt="" onerror="this.onerror=null;this.src='${fallback}'"></td>
        <td><strong>${food.name}</strong><br><span style="color:var(--muted);font-size:.78rem">${formatNaira(food.price)}</span></td>
        <td><span class="pill-tag">${(CATEGORIES.find(c => c.id === food.category) || {}).label || food.category}</span></td>
        <td>${formatNaira(food.price)}</td>
        <td><span class="pill-tag ${food.available !== false ? 'available' : 'unavailable'}">${food.available !== false ? 'Available' : 'Hidden'}</span></td>
        <td>
          <div class="table-actions">
            <button class="table-icon-btn" data-edit-food="${food.id}" title="Edit" aria-label="Edit ${food.name}">${ICONS.edit}</button>
            <button class="table-icon-btn danger" data-delete-food="${food.id}" title="Delete" aria-label="Delete ${food.name}">${ICONS.trash}</button>
          </div>
        </td>
      `;
      el.foodsTable.appendChild(tr);
    });
  }

  function openFoodModal(food) {
    el.foodForm.reset();
    populateCategorySelect();
    if (food) {
      el.foodModalTitle.textContent = 'Edit Food';
      el.foodForm.elements.id.value = food.id;
      el.foodForm.elements.name.value = food.name;
      el.foodForm.elements.description.value = food.description;
      el.foodForm.elements.price.value = food.price;
      el.foodForm.elements.category.value = food.category;
      el.foodForm.elements.image.value = food.image || '';
      el.foodForm.elements.popular.checked = !!food.popular;
      el.foodForm.elements.available.checked = food.available !== false;
    } else {
      el.foodModalTitle.textContent = 'Add Food';
      el.foodForm.elements.id.value = '';
      el.foodForm.elements.available.checked = true;
    }
    el.foodModal.hidden = false;
  }

  el.addFoodBtn.addEventListener('click', () => openFoodModal(null));
  el.closeFoodModal.addEventListener('click', () => { el.foodModal.hidden = true; });
  el.foodModal.addEventListener('click', (e) => { if (e.target === el.foodModal) el.foodModal.hidden = true; });

  el.foodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(el.foodForm);
    const id = fd.get('id');
    const payload = {
      name: fd.get('name').trim(),
      description: fd.get('description').trim(),
      price: Number(fd.get('price')),
      category: fd.get('category'),
      image: fd.get('image').trim(),
      popular: fd.get('popular') === 'on',
      available: fd.get('available') === 'on'
    };
    if (id) {
      FoodStore.update(id, payload);
      showToast('Food item updated', 'success');
    } else {
      FoodStore.add(payload);
      showToast('Food item added', 'success');
    }
    el.foodModal.hidden = true;
    renderFoods();
    renderOverview();
  });

  el.foodsTable.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-food]');
    const delBtn = e.target.closest('[data-delete-food]');
    if (editBtn) {
      openFoodModal(FoodStore.getById(editBtn.dataset.editFood));
    }
    if (delBtn) {
      const food = FoodStore.getById(delBtn.dataset.deleteFood);
      if (food && confirm(`Delete "${food.name}"? This cannot be undone.`)) {
        FoodStore.remove(food.id);
        renderFoods();
        renderOverview();
        showToast('Food item deleted');
      }
    }
  });

  /* ---------------------------------------------------------------------
     Orders panel
     --------------------------------------------------------------------- */
  function renderOrdersPanel() {
    const orders = OrderStore.getAll();
    el.allOrdersTable.innerHTML = '';
    el.allOrdersEmpty.hidden = orders.length > 0;
    orders.forEach(order => {
      const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><button class="table-icon-btn" data-view-order="${order.id}" title="View details">${ICONS.eye}</button> <strong>${order.id}</strong></td>
        <td>${order.customer.name}<br><span style="color:var(--muted);font-size:.78rem">${order.customer.phone}</span></td>
        <td>${itemCount} item(s)</td>
        <td>${new Date(order.date).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</td>
        <td>${formatNaira(order.total)}</td>
        <td>
          <select class="status-select" data-status-for="${order.id}">
            ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      `;
      el.allOrdersTable.appendChild(tr);
    });
  }

  el.allOrdersTable.addEventListener('change', (e) => {
    const select = e.target.closest('[data-status-for]');
    if (!select) return;
    OrderStore.updateStatus(select.dataset.statusFor, select.value);
    showToast('Order status updated', 'success');
    renderOverview();
  });

  el.allOrdersTable.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view-order]');
    if (!viewBtn) return;
    const order = OrderStore.getById(viewBtn.dataset.viewOrder);
    if (!order) return;

    el.orderDetailBody.innerHTML = `
      <div class="order-detail-row"><span>Order ID</span><strong>${order.id}</strong></div>
      <div class="order-detail-row"><span>Date</span><span>${new Date(order.date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
      <div class="order-detail-row"><span>Status</span><span class="status-pill status-${order.status.toLowerCase()}">${order.status}</span></div>

      <div class="order-detail-section-title">Customer</div>
      <div class="order-detail-row"><span>Name</span><span>${order.customer.name}</span></div>
      <div class="order-detail-row"><span>Phone</span><span>${order.customer.phone}</span></div>
      <div class="order-detail-row"><span>Address</span><span>${order.customer.address}</span></div>
      ${order.customer.note ? `<div class="order-detail-row"><span>Note</span><span>${order.customer.note}</span></div>` : ''}

      <div class="order-detail-section-title">Items</div>
      ${order.items.map(i => `<div class="order-detail-row"><span>${i.qty}× ${i.name}</span><span>${formatNaira(i.price * i.qty)}</span></div>`).join('')}
      <div class="order-detail-row"><span>Delivery Fee</span><span>${formatNaira(order.deliveryFee)}</span></div>
      <div class="order-detail-row"><strong>Total</strong><strong>${formatNaira(order.total)}</strong></div>
    `;
    el.orderDetailModal.hidden = false;
  });

  el.closeOrderDetail.addEventListener('click', () => { el.orderDetailModal.hidden = true; });
  el.orderDetailModal.addEventListener('click', (e) => { if (e.target === el.orderDetailModal) el.orderDetailModal.hidden = true; });

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  function renderAll() {
    renderOverview();
    renderFoods();
    renderOrdersPanel();
  }

  requireAuth();
})();
