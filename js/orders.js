/* ==========================================================================
   orders.js — order persistence (localStorage: ikis_orders_v1)
   ========================================================================== */

const OrderStore = {
  getAll() {
    return readJSON(STORAGE_KEYS.ORDERS, []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  getById(id) {
    return this.getAll().find(o => o.id === id) || null;
  },
  save(list) {
    writeJSON(STORAGE_KEYS.ORDERS, list);
  },
  create({ items, subtotal, deliveryFee, total, customer }) {
    const order = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      items,
      subtotal,
      deliveryFee,
      total,
      customer,
      status: 'Pending'
    };
    const list = readJSON(STORAGE_KEYS.ORDERS, []);
    list.push(order);
    this.save(list);
    return order;
  },
  updateStatus(id, status) {
    const list = readJSON(STORAGE_KEYS.ORDERS, []);
    const order = list.find(o => o.id === id);
    if (order) {
      order.status = status;
      this.save(list);
    }
    return order;
  },
  stats() {
    const all = this.getAll();
    return {
      total: all.length,
      pending: all.filter(o => o.status === 'Pending').length,
      completed: all.filter(o => o.status === 'Delivered').length
    };
  }
};
