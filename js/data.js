/* ==========================================================================
   data.js — central data layer for Iya Kudinka Iya Shagalinka Restaurants
   --------------------------------------------------------------------------
   All persistence for this first version happens in localStorage. Every
   read/write to a domain (foods, cart, favorites, orders, admin session)
   goes through the helpers below so the storage mechanism can later be
   swapped for real API calls without touching the rest of the app.
   ========================================================================== */

const STORAGE_KEYS = {
  FOODS: 'ikis_foods_v1',
  CART: 'ikis_cart_v1',
  FAVORITES: 'ikis_favorites_v1',
  ORDERS: 'ikis_orders_v1',
  ADMIN_SESSION: 'ikis_admin_session_v1',
  ADMIN_CREDENTIALS: 'ikis_admin_credentials_v1'
};

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

const CATEGORIES = [
  { id: 'rice', label: 'Rice' },
  { id: 'soups', label: 'Soups' },
  { id: 'swallow', label: 'Swallow' },
  { id: 'meat', label: 'Meat' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'snacks', label: 'Snacks' }
];

/* Real dish photography, served from Wikimedia Commons (Special:FilePath —
   a stable redirect to the current media file, so links don't rot even if
   the underlying image is re-hosted). Requires internet access to load;
   see foodPlaceholderDataUri() in icons.js for the offline fallback. */
const WIKI_IMG = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

/* Default menu seeded on first run only. Admins can add/edit/delete from here on. */
const DEFAULT_FOODS = [
  { id: 'f001', name: 'Party Jollof Rice', description: 'Smoky, spicy party-style jollof rice cooked over an open flame.', price: 2500, category: 'rice', image: WIKI_IMG + 'File:Jollof_rice.jpg?width=600', popular: true, available: true },
  { id: 'f002', name: 'Fried Rice', description: 'Colourful fried rice loaded with mixed vegetables and liver.', price: 2500, category: 'rice', image: WIKI_IMG + 'File:Fried_rice_and_chicken.png?width=600', popular: true, available: true },
  { id: 'f003', name: 'Ofada Rice & Ayamase', description: 'Local ofada rice served with fiery green pepper sauce.', price: 3200, category: 'rice', image: WIKI_IMG + 'File:Cooked_Ofada_rice_garnished_with_fried_plantain.jpg?width=600', popular: false, available: true },
  { id: 'f004', name: 'Egusi Soup', description: 'Rich melon seed soup with assorted meat and fish.', price: 2800, category: 'soups', image: WIKI_IMG + 'File:Original_Nigerian_Egusi_soup_(cropped).jpg?width=600', popular: true, available: true },
  { id: 'f005', name: 'Efo Riro', description: 'Vegetable soup simmered in a hearty pepper and palm oil base.', price: 2700, category: 'soups', image: WIKI_IMG + 'File:Efo_riro.jpg?width=600', popular: false, available: true },
  { id: 'f006', name: 'Okra Soup', description: 'Fresh okra soup, draw and delicious, with assorted meat.', price: 2700, category: 'soups', image: WIKI_IMG + 'File:Semovita_and_okro_soup.jpg?width=600', popular: false, available: true },
  { id: 'f007', name: 'Pounded Yam', description: 'Smooth, stretchy pounded yam — the perfect swallow companion.', price: 1500, category: 'swallow', image: WIKI_IMG + 'File:A_Plate_of_Pounded_Yam_(Iyan)_served_in_Birmingham_UK.JPG?width=600', popular: true, available: true },
  { id: 'f008', name: 'Eba', description: 'Classic garri swallow, soft and lump-free.', price: 1000, category: 'swallow', image: WIKI_IMG + 'File:Garri_(Eba)_and_Vegetable_soup.jpg?width=600', popular: false, available: true },
  { id: 'f009', name: 'Amala', description: 'Smooth yam-flour swallow, traditionally paired with ewedu.', price: 1200, category: 'swallow', image: WIKI_IMG + 'File:Amala_and_ewedu_with_gbegiri_soup.jpg?width=600', popular: false, available: true },
  { id: 'f010', name: 'Peppered Beef', description: 'Tender beef chunks tossed in a spicy pepper sauce.', price: 3000, category: 'meat', image: WIKI_IMG + 'File:Beef_stew_(15707525894).jpg?width=600', popular: false, available: true },
  { id: 'f011', name: 'Nkwobi', description: 'Spiced cow foot delicacy in a rich palm oil sauce.', price: 3500, category: 'meat', image: WIKI_IMG + 'File:Nkwobi_made_with_Chevon.jpg?width=600', popular: false, available: true },
  { id: 'f012', name: 'Beef Suya', description: 'Skewered beef grilled and coated in smoky suya spice.', price: 2000, category: 'meat', image: WIKI_IMG + 'File:A_Suya(meet)_seller_along_the_road.jpg?width=600', popular: true, available: true },
  { id: 'f013', name: 'Grilled Chicken', description: 'Char-grilled chicken marinated in signature spices.', price: 3200, category: 'chicken', image: WIKI_IMG + 'File:Grilled_Chicken_Breasts_(28905381261).jpg?width=600', popular: true, available: true },
  { id: 'f014', name: 'Fried Chicken', description: 'Crispy golden fried chicken, juicy on the inside.', price: 3000, category: 'chicken', image: WIKI_IMG + 'File:Fried-Chicken-Leg.jpg?width=600', popular: false, available: true },
  { id: 'f015', name: 'Chicken Wings (6pcs)', description: 'Spicy glazed chicken wings, perfect for sharing.', price: 2500, category: 'chicken', image: WIKI_IMG + 'File:Chicken_wings_as_food.jpg?width=600', popular: false, available: true },
  { id: 'f016', name: 'Chapman', description: 'Nigeria’s favourite chilled mocktail, sweet and citrusy.', price: 1500, category: 'drinks', image: WIKI_IMG + 'File:Cocktail_glasses_with_ice_cubes_(18495239248).jpg?width=600', popular: true, available: true },
  { id: 'f017', name: 'Zobo Drink', description: 'Refreshing hibiscus drink infused with ginger and fruits.', price: 1000, category: 'drinks', image: WIKI_IMG + 'File:Zobo(hibiscus)_drink.jpg?width=600', popular: false, available: true },
  { id: 'f018', name: 'Chilled Soft Drink', description: 'Assorted chilled soft drinks, 50cl bottle.', price: 700, category: 'drinks', image: WIKI_IMG + 'File:6_Coca-Cola_bottles.jpg?width=600', popular: false, available: true },
  { id: 'f019', name: 'Puff Puff (10pcs)', description: 'Soft, sweet, deep-fried dough balls.', price: 1000, category: 'snacks', image: WIKI_IMG + 'File:Puff_puff.jpg?width=600', popular: true, available: true },
  { id: 'f020', name: 'Meat Pie', description: 'Flaky pastry filled with spiced minced meat and potatoes.', price: 800, category: 'snacks', image: WIKI_IMG + 'File:Meat-pie_hawker.jpg?width=600', popular: false, available: true },
  { id: 'f021', name: 'Spring Rolls (5pcs)', description: 'Crispy vegetable spring rolls served with dip.', price: 1200, category: 'snacks', image: WIKI_IMG + 'File:East-asian-food-spring-rolls-3.jpg?width=600', popular: false, available: true },
  { id: 'f022', name: 'Fried Plantain (Dodo)', description: 'Sweet, golden fried ripe plantain slices.', price: 1000, category: 'snacks', image: WIKI_IMG + 'File:Fried_plantains.jpg?width=600', popular: false, available: true }
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Failed to read localStorage key "${key}"`, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write localStorage key "${key}"`, e);
  }
}

function initStorage() {
  if (localStorage.getItem(STORAGE_KEYS.FOODS) === null) {
    writeJSON(STORAGE_KEYS.FOODS, DEFAULT_FOODS);
  }
  if (localStorage.getItem(STORAGE_KEYS.CART) === null) {
    writeJSON(STORAGE_KEYS.CART, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.FAVORITES) === null) {
    writeJSON(STORAGE_KEYS.FAVORITES, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.ORDERS) === null) {
    writeJSON(STORAGE_KEYS.ORDERS, []);
  }
  /* Default admin credentials — placeholder only, see auth.js for the security disclaimer. */
  if (localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS) === null) {
    writeJSON(STORAGE_KEYS.ADMIN_CREDENTIALS, { username: 'admin', password: 'admin123' });
  }
}

const FoodStore = {
  getAll() {
    return readJSON(STORAGE_KEYS.FOODS, []);
  },
  getById(id) {
    return this.getAll().find(f => f.id === id) || null;
  },
  save(list) {
    writeJSON(STORAGE_KEYS.FOODS, list);
  },
  add(food) {
    const list = this.getAll();
    const id = 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    const newFood = { id, available: true, popular: false, ...food };
    list.push(newFood);
    this.save(list);
    return newFood;
  },
  update(id, changes) {
    const list = this.getAll();
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...changes };
    this.save(list);
    return list[idx];
  },
  remove(id) {
    const list = this.getAll().filter(f => f.id !== id);
    this.save(list);
  }
};

function formatNaira(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

function generateOrderId() {
  const now = new Date();
  const stamp = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `IKIS-${stamp}-${rand}`;
}
