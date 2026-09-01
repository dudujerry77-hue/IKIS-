/* ==========================================================================
   auth.js — admin authentication (DEMO ONLY, NOT REAL SECURITY)
   --------------------------------------------------------------------------
   This project has no backend. Credentials and session tokens below live
   entirely in the browser's localStorage, which means:
     - Anyone with access to devtools can read the stored credentials.
     - Anyone can fabricate a valid-looking session token by hand.
     - There is no encryption, hashing, or server-side verification.
   This is acceptable ONLY for a first, offline, frontend-only demo. Before
   this app is used for a real business, swap AdminAuth's internals for real
   calls to a server that issues signed sessions (e.g. JWT + HTTPS) and
   never trust the client to decide who is an admin.
   ========================================================================== */

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const AdminAuth = {
  login(username, password) {
    const creds = readJSON(STORAGE_KEYS.ADMIN_CREDENTIALS, null);
    if (!creds || username.trim() !== creds.username || password !== creds.password) {
      return { success: false, message: 'Invalid username or password.' };
    }
    const session = {
      username,
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS
    };
    writeJSON(STORAGE_KEYS.ADMIN_SESSION, session);
    return { success: true };
  },
  logout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  },
  isAuthenticated() {
    const session = readJSON(STORAGE_KEYS.ADMIN_SESSION, null);
    if (!session || !session.expiresAt) return false;
    if (Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }
    return true;
  },
  getSession() {
    return readJSON(STORAGE_KEYS.ADMIN_SESSION, null);
  }
};
