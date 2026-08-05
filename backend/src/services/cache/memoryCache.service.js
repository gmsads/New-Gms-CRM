/**
 * In-Memory Cache Provider (Fallback for local development)
 * Provides identical method signatures to redis.service.js
 */
const memoryStore = new Map();

const getCache = async (key) => {
  const item = memoryStore.get(key);
  if (item) {
    if (Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }
  return null;
};

const setCache = async (key, value, ttlSeconds = 3600) => {
  memoryStore.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000
  });
};

const deleteCache = async (key) => {
  memoryStore.delete(key);
};

const clearCachePattern = async (pattern) => {
  const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
  for (const key of memoryStore.keys()) {
    if (regex.test(key)) {
      memoryStore.delete(key);
    }
  }
};

const exists = async (key) => {
  return memoryStore.has(key) && Date.now() <= memoryStore.get(key).expiry;
};

const ttl = async (key) => {
  const item = memoryStore.get(key);
  if (item) {
    const remaining = item.expiry - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : -2;
  }
  return -2; // Redis convention for key does not exist
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  exists,
  ttl
};
