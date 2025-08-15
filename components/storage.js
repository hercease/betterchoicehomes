import AsyncStorage from '@react-native-async-storage/async-storage';

const Storage = {
  /**
   * Save a value with an optional expiry time (in milliseconds)
   */
  async setItem(key, value, ttl = null) {
    const now = Date.now();
    const item = {
      value,
      expiry: ttl ? now + ttl * 24 * 60 * 60 * 1000 : null, // if no ttl, never expires
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  },

  /**
   * Get a value, automatically removing it if expired
   */
  async getItem(key) {
    const jsonValue = await AsyncStorage.getItem(key);
    if (!jsonValue) return null;

    try {
      const item = JSON.parse(jsonValue);
      if (item.expiry && Date.now() > item.expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch (e) {
      console.error(`Error parsing key "${key}":`, e);
      return null;
    }
  },

  /**
   * Remove a value
   */
  async removeItem(key) {
    await AsyncStorage.removeItem(key);
  },

  /**
   * Clear all storage
   */
  async clear() {
    await AsyncStorage.clear();
  }
};

export default Storage;
