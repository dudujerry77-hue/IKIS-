/* ==========================================================================
   cart.js — cart persistence (localStorage: ikis_cart_v1)
   Stored as an array of { foodId, qty }.
   ========================================================================== */

const DELIVERY_FEE = 800;

const CartStore = {
  getAll() {
    return readJSON(STORAGE_KEYS.CART, []);
  },
  save(items) {
    writeJSON(STORAGE_KEYS.CART, items);
  },
  addItem(foodId, qty = 1) {
    const items = this.getAll();
    const existing = items.find(i => i.foodId === foodId);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ foodId, qty });
    }
    this.save(items);
  },
  increase(foodId) {
    const items = this.getAll();
    const item = items.find(i => i.foodId === foodId);
    if (item) {
      item.qty += 1;
      this.save(items);
    }
  },
  decrease(foodId) {
    let items = this.getAll();
    const item = items.find(i => i.foodId === foodId);
    if (item) {
      item.qty -= 1;
      if (item.qty <= 0) {
        items = items.filter(i => i.foodId !== foodId);
      }
      this.save(items);
    }
  },
  removeItem(foodId) {
    const items = this.getAll().filter(i => i.foodId !== foodId);
    this.save(items);
  },
  clear() {
    this.save([]);
  },
  count() {
    return this.getAll().reduce((sum, i) => sum + i.qty, 0);
  },
  getDetailed() {
    const foods = FoodStore.getAll();
    return this.getAll()
      .map(item => {
        const food = foods.find(f => f.id === item.foodId);
        if (!food) return null;
        return { ...item, food, subtotal: food.price * item.qty };
      })
      .filter(Boolean);
  },
  getSubtotal() {
    return this.getDetailed().reduce((sum, i) => sum + i.subtotal, 0);
  },
  getTotal() {
    const subtotal = this.getSubtotal();
    return subtotal === 0 ? 0 : subtotal + DELIVERY_FEE;
  }
};
