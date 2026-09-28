/**
 * Fast client-side cache utility for instant page transitions & stale-while-revalidate navigation.
 * Stores in-memory (0ms access) and syncs to sessionStorage across tab reloads.
 */

const memoryCache = new Map();
const PREFIX = 'absensi_cache_';

export const cache = {
  get(key) {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    try {
      const stored = sessionStorage.getItem(`${PREFIX}${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  set(key, value) {
    memoryCache.set(key, value);
    try {
      sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // Ignore quota exceeded or storage disabled
    }
  },

  remove(key) {
    memoryCache.delete(key);
    try {
      sessionStorage.removeItem(`${PREFIX}${key}`);
    } catch {
      // Ignore
    }
  },

  clear() {
    memoryCache.clear();
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // Ignore
    }
  },
};

export default cache;
