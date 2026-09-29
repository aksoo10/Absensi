/**
 * Auth Storage Utility
 * 
 * Uses sessionStorage instead of localStorage so authentication is per-session.
 * When users close the browser or click a new link from the terminal,
 * they must provide their login credentials (email & password) first.
 */

// Purge any persistent credentials left in localStorage from previous builds
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  }
} catch {
  // Ignore storage access errors
}

export const authStorage = {
  getToken() {
    try {
      return sessionStorage.getItem('token');
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        sessionStorage.setItem('token', token);
      } else {
        sessionStorage.removeItem('token');
      }
    } catch {}
  },

  getUser() {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    try {
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('user');
      }
    } catch {}
  },

  clear() {
    try {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
  }
};

export default authStorage;
