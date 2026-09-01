/* ==========================================================================
   favorites.js — favorites persistence (localStorage: ikis_favorites_v1)
   Stored simply as an array of food IDs.
   ========================================================================== */

const FavoritesStore = {
  getAll() {
    return readJSON(STORAGE_KEYS.FAVORITES, []);
  },
  has(foodId) {
    return this.getAll().includes(foodId);
  },
  toggle(foodId) {
    let list = this.getAll();
    let added;
    if (list.includes(foodId)) {
      list = list.filter(id => id !== foodId);
      added = false;
    } else {
      list.push(foodId);
      added = true;
    }
    writeJSON(STORAGE_KEYS.FAVORITES, list);
    return added;
  },
  remove(foodId) {
    const list = this.getAll().filter(id => id !== foodId);
    writeJSON(STORAGE_KEYS.FAVORITES, list);
  },
  count() {
    return this.getAll().length;
  }
};
