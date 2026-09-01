/* ==========================================================================
   app.js — main customer-facing application logic
   ========================================================================== */

(function () {
  initStorage();

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const state = {
    view: 'home',
    searchTerm: '',
    activeCategory: 'all'
  };

  /* ---------------------------------------------------------------------
     Element refs
     --------------------------------------------------------------------- */
  const el = {
    intro: document.getElementById('intro'),
    introProgressBar: document.getElementById('introProgressBar'),
    skipIntro: document.getElementById('skipIntro'),

    searchInput: document.getElementById('searchInput'),
    categoryScroller: document.getElementById('categoryScroller'),
    foodGrid: document.getElementById('foodGrid'),
    foodEmptyState: document.getElementById('foodEmptyState'),
    foodSectionTitle: document.getElementById('foodSectionTitle'),
    resultCount: document.getElementById('resultCount'),

    favoritesGrid: document.getElementById('favoritesGrid'),
    favoritesEmptyState: document.getElementById('favoritesEmptyState'),

    ordersList: document.getElementById('ordersList'),
    ordersEmptyState: document.getElementById('ordersEmptyState'),

    cartItems: document.getElementById('cartItems'),
    cartEmptyState: document.getElementById('cartEmptyState'),
    cartSummary: document.getElementById('cartSummary'),
    sumSubtotal: document.getElementById('sumSubtotal'),
    sumDelivery: document.getElementById('sumDelivery'),
    sumTotal: document.getElementById('sumTotal'),
    placeOrderBtn: document.getElementById('placeOrderBtn'),
    clearCartBtn: document.getElementById('clearCartBtn'),

    checkoutModal: document.getElementById('checkoutModal'),
    checkoutForm: document.getElementById('checkoutForm'),
    checkoutSummary: document.getElementById('checkoutSummary'),
    closeCheckout: document.getElementById('closeCheckout'),

    confirmModal: document.getElementById('confirmModal'),
    confirmOrderId: document.getElementById('confirmOrderId'),
    confirmContinueShopping: document.getElementById('confirmContinueShopping'),
    confirmViewOrders: document.getElementById('confirmViewOrders'),

    toastContainer: document.getElementById('toastContainer'),

    cartCountDesktop: document.getElementById('cartCountDesktop'),
    cartCountIcon: document.getElementById('cartCountIcon'),
    cartCountMobile: document.getElementById('cartCountMobile'),
    favCountDesktop: document.getElementById('favCountDesktop'),
    favCountMobile: document.getElementById('favCountMobile')
  };

  /* ---------------------------------------------------------------------
     Intro animation
     --------------------------------------------------------------------- */
  function hideIntro() {
    el.intro.classList.add('hide');
    setTimeout(() => { el.intro.style.display = 'none'; }, 650);
  }
  requestAnimationFrame(() => { el.introProgressBar.style.width = '100%'; });
  const introTimer = setTimeout(hideIntro, 2800);
  el.skipIntro.addEventListener('click', () => { clearTimeout(introTimer); hideIntro(); });

  /* ---------------------------------------------------------------------
     Toasts
     --------------------------------------------------------------------- */
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
     Navigation
     --------------------------------------------------------------------- */
  function showView(name) {
    state.view = name;
    document.querySelectorAll('.view').forEach(v => {
      v.hidden = v.dataset.view !== name;
    });
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (name === 'favorites') renderFavorites();
    if (name === 'orders') renderOrders();
    if (name === 'cart') renderCart();
  }

  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      e.preventDefault();
      showView(navBtn.dataset.nav);
    }
  });

  document.getElementById('heroOrderNow').addEventListener('click', () => {
    document.getElementById('foodGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('heroExploreMenu').addEventListener('click', () => {
    document.getElementById('categoryScroller').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------------------------------------------------------------------
     Badges
     --------------------------------------------------------------------- */
  function updateBadges() {
    const cartCount = CartStore.count();
    const favCount = FavoritesStore.count();

    [el.cartCountDesktop, el.cartCountIcon, el.cartCountMobile].forEach(node => {
      if (node) node.textContent = cartCount;
    });
    [el.favCountDesktop, el.favCountMobile].forEach(node => {
      if (node) node.textContent = favCount;
    });
    if (el.cartCountMobile) el.cartCountMobile.hidden = cartCount === 0;
    if (el.favCountMobile) el.favCountMobile.hidden = favCount === 0;
  }

  /* ---------------------------------------------------------------------
     Categories
     --------------------------------------------------------------------- */
  function renderCategories() {
    CATEGORIES.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'category-chip';
      chip.dataset.category = cat.id;
      chip.innerHTML = `<span class="cat-icon">${ICONS[CATEGORY_ICON_MAP[cat.id]] || ICONS.utensils}</span><span>${cat.label}</span>`;
      el.categoryScroller.appendChild(chip);
    });
  }

  el.categoryScroller.addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    state.activeCategory = chip.dataset.category;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.toggle('active', c === chip));
    renderFoodGrid();
  });

  el.searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value.trim().toLowerCase();
    renderFoodGrid();
  });

  /* ---------------------------------------------------------------------
     Food card builder (shared by Home + Favorites)
     --------------------------------------------------------------------- */
  function buildFoodCard(food) {
    const isFav = FavoritesStore.has(food.id);
    const fallback = foodPlaceholderDataUri(food.category);
    const card = document.createElement('article');
    card.className = 'food-card';
    card.innerHTML = `
      <div class="food-media">
        ${food.popular ? `<span class="popular-tag">${ICONS.starFilled}Popular</span>` : ''}
        <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${food.id}" aria-label="Toggle favorite" title="Add to favorites">
          ${isFav ? ICONS.heartFilled : ICONS.heart}
        </button>
        <img src="${food.image || fallback}" alt="${food.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'">
      </div>
      <div class="food-body">
        <h3 class="food-name">${food.name}</h3>
        <p class="food-desc">${food.description}</p>
        <div class="food-footer">
          <span class="food-price">${formatNaira(food.price)}</span>
          <button class="add-cart-btn" data-add="${food.id}">${ICONS.cart}<span>Add</span></button>
        </div>
      </div>
    `;
    return card;
  }

  function getFilteredFoods() {
    const foods = FoodStore.getAll().filter(f => f.available !== false);
    return foods.filter(f => {
      const matchesCategory = state.activeCategory === 'all' || f.category === state.activeCategory;
      const matchesSearch = !state.searchTerm ||
        f.name.toLowerCase().includes(state.searchTerm) ||
        f.description.toLowerCase().includes(state.searchTerm);
      return matchesCategory && matchesSearch;
    });
  }

  function renderFoodGrid() {
    const filtered = getFilteredFoods();
    el.foodGrid.innerHTML = '';

    const isDefaultView = state.activeCategory === 'all' && !state.searchTerm;
    const list = isDefaultView ? filtered.filter(f => f.popular).concat(filtered.filter(f => !f.popular)) : filtered;

    el.foodSectionTitle.textContent = isDefaultView
      ? 'Popular Right Now'
      : (state.searchTerm ? `Results for "${state.searchInputValue || state.searchTerm}"` : CATEGORIES.find(c => c.id === state.activeCategory)?.label || 'Menu');

    el.resultCount.textContent = list.length ? `${list.length} dish${list.length === 1 ? '' : 'es'}` : '';

    if (list.length === 0) {
      el.foodEmptyState.hidden = false;
      return;
    }
    el.foodEmptyState.hidden = true;
    list.forEach(food => el.foodGrid.appendChild(buildFoodCard(food)));
  }

  /* ---------------------------------------------------------------------
     Favorites view
     --------------------------------------------------------------------- */
  function renderFavorites() {
    const ids = FavoritesStore.getAll();
    const foods = ids.map(id => FoodStore.getById(id)).filter(Boolean);
    el.favoritesGrid.innerHTML = '';
    if (foods.length === 0) {
      el.favoritesGrid.hidden = true;
      el.favoritesEmptyState.hidden = false;
      return;
    }
    el.favoritesGrid.hidden = false;
    el.favoritesEmptyState.hidden = true;
    foods.forEach(food => el.favoritesGrid.appendChild(buildFoodCard(food)));
  }

  /* ---------------------------------------------------------------------
     Favorite / Add-to-cart delegated actions (grids live in multiple views)
     --------------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = favBtn.dataset.fav;
      const added = FavoritesStore.toggle(id);
      favBtn.classList.toggle('active', added);
      favBtn.innerHTML = added ? ICONS.heartFilled : ICONS.heart;
      favBtn.classList.add('pulse');
      setTimeout(() => favBtn.classList.remove('pulse'), 400);
      showToast(added ? 'Added to favorites' : 'Removed from favorites', added ? 'success' : '');
      updateBadges();
      if (state.view === 'favorites') renderFavorites();
      return;
    }

    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const id = addBtn.dataset.add;
      CartStore.addItem(id);
      updateBadges();
      showToast('Added to cart', 'success');
      addBtn.classList.add('added');
      const original = addBtn.innerHTML;
      addBtn.innerHTML = `${ICONS.checkCircle}<span>Added</span>`;
      setTimeout(() => { addBtn.classList.remove('added'); addBtn.innerHTML = original; }, 1100);
      if (state.view === 'cart') renderCart();
      return;
    }
  });

  /* ---------------------------------------------------------------------
     Cart view
     --------------------------------------------------------------------- */
  function renderCart() {
    const items = CartStore.getDetailed();
    el.cartItems.innerHTML = '';

    if (items.length === 0) {
      el.cartItems.hidden = true;
      el.cartSummary.hidden = true;
      el.cartEmptyState.hidden = false;
    } else {
      el.cartItems.hidden = false;
      el.cartSummary.hidden = false;
      el.cartEmptyState.hidden = true;

      items.forEach(item => {
        const fallback = foodPlaceholderDataUri(item.food.category);
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div class="cart-item-media"><img src="${item.food.image || fallback}" alt="${item.food.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"></div>
          <div class="cart-item-info">
            <h4>${item.food.name}</h4>
            <span class="unit-price">${formatNaira(item.food.price)} each</span>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-decrease="${item.foodId}" aria-label="Decrease quantity">${ICONS.minus}</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-increase="${item.foodId}" aria-label="Increase quantity">${ICONS.plus}</button>
          </div>
          <div class="cart-item-subtotal">${formatNaira(item.subtotal)}</div>
          <button class="remove-item-btn" data-remove="${item.foodId}" aria-label="Remove item" title="Remove">${ICONS.trash}</button>
        `;
        el.cartItems.appendChild(row);
      });
    }

    const subtotal = CartStore.getSubtotal();
    const total = CartStore.getTotal();
    el.sumSubtotal.textContent = formatNaira(subtotal);
    el.sumDelivery.textContent = subtotal ? formatNaira(DELIVERY_FEE) : formatNaira(0);
    el.sumTotal.textContent = formatNaira(total);
  }

  el.cartItems.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-increase]');
    const dec = e.target.closest('[data-decrease]');
    const rem = e.target.closest('[data-remove]');
    if (inc) { CartStore.increase(inc.dataset.increase); }
    if (dec) { CartStore.decrease(dec.dataset.decrease); }
    if (rem) { CartStore.removeItem(rem.dataset.remove); showToast('Item removed from cart'); }
    if (inc || dec) showToast('Cart updated');
    if (inc || dec || rem) { renderCart(); updateBadges(); }
  });

  el.clearCartBtn.addEventListener('click', () => {
    if (CartStore.count() === 0) return;
    if (confirm('Clear all items from your cart?')) {
      CartStore.clear();
      renderCart();
      updateBadges();
      showToast('Cart cleared');
    }
  });

  /* ---------------------------------------------------------------------
     Checkout flow
     --------------------------------------------------------------------- */
  function openModal(modalEl) { modalEl.hidden = false; }
  function closeModal(modalEl) { modalEl.hidden = true; }

  el.placeOrderBtn.addEventListener('click', () => {
    if (CartStore.count() === 0) return;
    const items = CartStore.getDetailed();
    const subtotal = CartStore.getSubtotal();
    const total = CartStore.getTotal();

    el.checkoutSummary.innerHTML = `
      ${items.map(i => `<div class="summary-row"><span>${i.qty}× ${i.food.name}</span><span>${formatNaira(i.subtotal)}</span></div>`).join('')}
      <div class="summary-row"><span>Delivery Fee</span><span>${formatNaira(DELIVERY_FEE)}</span></div>
      <div class="summary-row summary-total"><span>Total</span><span>${formatNaira(total)}</span></div>
    `;
    openModal(el.checkoutModal);
  });

  el.closeCheckout.addEventListener('click', () => closeModal(el.checkoutModal));
  el.checkoutModal.addEventListener('click', (e) => { if (e.target === el.checkoutModal) closeModal(el.checkoutModal); });

  el.checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(el.checkoutForm);
    const customer = {
      name: formData.get('name').trim(),
      phone: formData.get('phone').trim(),
      address: formData.get('address').trim(),
      note: formData.get('note').trim()
    };

    const items = CartStore.getDetailed().map(i => ({
      foodId: i.foodId, name: i.food.name, price: i.food.price, qty: i.qty
    }));
    const subtotal = CartStore.getSubtotal();
    const total = CartStore.getTotal();

    const order = OrderStore.create({ items, subtotal, deliveryFee: DELIVERY_FEE, total, customer });

    CartStore.clear();
    updateBadges();
    renderCart();
    el.checkoutForm.reset();
    closeModal(el.checkoutModal);

    el.confirmOrderId.textContent = order.id;
    openModal(el.confirmModal);
    showToast('Order placed successfully', 'success');
  });

  el.confirmContinueShopping.addEventListener('click', () => { closeModal(el.confirmModal); showView('home'); });
  el.confirmViewOrders.addEventListener('click', () => { closeModal(el.confirmModal); showView('orders'); });

  /* ---------------------------------------------------------------------
     Orders view
     --------------------------------------------------------------------- */
  function renderOrders() {
    const orders = OrderStore.getAll();
    el.ordersList.innerHTML = '';
    if (orders.length === 0) {
      el.ordersList.hidden = true;
      el.ordersEmptyState.hidden = false;
      return;
    }
    el.ordersList.hidden = false;
    el.ordersEmptyState.hidden = true;

    orders.forEach(order => {
      const itemsText = order.items.map(i => `${i.qty}× ${i.name}`).join(', ');
      const dateText = new Date(order.date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
      const statusClass = 'status-' + order.status.toLowerCase();

      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-card-head">
          <div>
            <div class="order-id">${order.id}</div>
            <div class="order-date">${dateText}</div>
          </div>
          <span class="status-pill ${statusClass}">${order.status}</span>
        </div>
        <div class="order-items-summary">${itemsText}</div>
        <div class="order-card-foot">
          <span>${order.items.reduce((s, i) => s + i.qty, 0)} item(s)</span>
          <span class="order-total">${formatNaira(order.total)}</span>
        </div>
      `;
      el.ordersList.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  renderCategories();
  renderFoodGrid();
  updateBadges();
  showView('home');
})();
