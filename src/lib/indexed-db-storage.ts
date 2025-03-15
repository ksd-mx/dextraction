/**
 * IndexedDB storage utility for caching large datasets like tokens
 */

const DB_NAME = 'dex_cache_db';
const DB_VERSION = 1;
const TOKEN_STORE = 'tokens';
const PRICES_STORE = 'prices';
const METADATA_STORE = 'metadata';

interface CacheMetadata {
  key: string;
  timestamp: number;
  expiry: number;
}

// Initialize the database
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create token store
      if (!db.objectStoreNames.contains(TOKEN_STORE)) {
        db.createObjectStore(TOKEN_STORE, { keyPath: 'address' });
      }
      
      // Create prices store
      if (!db.objectStoreNames.contains(PRICES_STORE)) {
        db.createObjectStore(PRICES_STORE, { keyPath: 'address' });
      }
      
      // Create metadata store for expiry tracking
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Saves tokens to IndexedDB
 */
export async function saveTokensToCache(tokens: any[], expiryMs = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction([TOKEN_STORE, METADATA_STORE], 'readwrite');
    
    const tokenStore = tx.objectStore(TOKEN_STORE);
    const metadataStore = tx.objectStore(METADATA_STORE);
    
    // Clear existing tokens
    tokenStore.clear();
    
    // Add each token
    tokens.forEach(token => {
      tokenStore.add(token);
    });
    
    // Update metadata
    metadataStore.put({
      key: TOKEN_STORE,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event);
    });
  } catch (error) {
    console.error('Error saving tokens to cache:', error);
  }
}

/**
 * Saves price data to IndexedDB
 */
export async function savePricesToCache(prices: Record<string, number>, expiryMs = 5 * 60 * 1000): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction([PRICES_STORE, METADATA_STORE], 'readwrite');
    
    const priceStore = tx.objectStore(PRICES_STORE);
    const metadataStore = tx.objectStore(METADATA_STORE);
    
    // Clear existing prices
    priceStore.clear();
    
    // Add each price
    Object.entries(prices).forEach(([address, price]) => {
      priceStore.add({ address, price });
    });
    
    // Update metadata
    metadataStore.put({
      key: PRICES_STORE,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event);
    });
  } catch (error) {
    console.error('Error saving prices to cache:', error);
  }
}

/**
 * Gets tokens from IndexedDB
 */
export async function getTokensFromCache(): Promise<any[] | null> {
  try {
    const db = await initDB();
    const tx = db.transaction([TOKEN_STORE, METADATA_STORE], 'readonly');
    
    // Check metadata first to see if cache is still valid
    const metadataStore = tx.objectStore(METADATA_STORE);
    const metadataReq = metadataStore.get(TOKEN_STORE);
    
    const metadataResult = await new Promise<CacheMetadata | undefined>((resolve, reject) => {
      metadataReq.onsuccess = () => resolve(metadataReq.result);
      metadataReq.onerror = (event) => reject(event);
    });
    
    // If cache expired or missing, return null
    if (!metadataResult || Date.now() > metadataResult.expiry) {
      return null;
    }
    
    // Get all tokens
    const tokenStore = tx.objectStore(TOKEN_STORE);
    const tokenReq = tokenStore.getAll();
    
    return new Promise((resolve, reject) => {
      tokenReq.onsuccess = () => resolve(tokenReq.result);
      tokenReq.onerror = (event) => reject(event);
    });
  } catch (error) {
    console.error('Error getting tokens from cache:', error);
    return null;
  }
}

/**
 * Gets prices from IndexedDB
 */
export async function getPricesFromCache(): Promise<Record<string, number> | null> {
  try {
    const db = await initDB();
    const tx = db.transaction([PRICES_STORE, METADATA_STORE], 'readonly');
    
    // Check metadata first to see if cache is still valid
    const metadataStore = tx.objectStore(METADATA_STORE);
    const metadataReq = metadataStore.get(PRICES_STORE);
    
    const metadataResult = await new Promise<CacheMetadata | undefined>((resolve, reject) => {
      metadataReq.onsuccess = () => resolve(metadataReq.result);
      metadataReq.onerror = (event) => reject(event);
    });
    
    // If cache expired or missing, return null
    if (!metadataResult || Date.now() > metadataResult.expiry) {
      return null;
    }
    
    // Get all prices
    const priceStore = tx.objectStore(PRICES_STORE);
    const priceReq = priceStore.getAll();
    
    const prices = await new Promise<Array<{ address: string; price: number }>>((resolve, reject) => {
      priceReq.onsuccess = () => resolve(priceReq.result);
      priceReq.onerror = (event) => reject(event);
    });
    
    // Convert to record
    const priceMap: Record<string, number> = {};
    prices.forEach(item => {
      priceMap[item.address] = item.price;
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error getting prices from cache:', error);
    return null;
  }
}

/**
 * Clears the token cache
 */
export async function clearTokenCache(): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction([TOKEN_STORE, METADATA_STORE], 'readwrite');
    
    tx.objectStore(TOKEN_STORE).clear();
    tx.objectStore(METADATA_STORE).delete(TOKEN_STORE);
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event);
    });
  } catch (error) {
    console.error('Error clearing token cache:', error);
  }
}

/**
 * Clears the price cache
 */
export async function clearPriceCache(): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction([PRICES_STORE, METADATA_STORE], 'readwrite');
    
    tx.objectStore(PRICES_STORE).clear();
    tx.objectStore(METADATA_STORE).delete(PRICES_STORE);
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event);
    });
  } catch (error) {
    console.error('Error clearing price cache:', error);
  }
}