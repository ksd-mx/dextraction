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
 * Saves tokens to IndexedDB with improved error handling
 */
export async function saveTokensToCache(tokens: any[], expiryMs = 24 * 60 * 60 * 1000): Promise<void> {
  if (!tokens || tokens.length === 0) {
    console.warn('Attempted to save empty token list to cache');
    return;
  }

  try {
    const db = await initDB();
    const tx = db.transaction([TOKEN_STORE, METADATA_STORE], 'readwrite');
    
    const tokenStore = tx.objectStore(TOKEN_STORE);
    const metadataStore = tx.objectStore(METADATA_STORE);
    
    // Clear existing tokens
    tokenStore.clear();
    
    // Add each token - handle potential duplicates by using put instead of add
    tokens.forEach(token => {
      if (token && token.address) {
        tokenStore.put(token);
      }
    });
    
    // Update metadata with expiry
    metadataStore.put({
      key: TOKEN_STORE,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => {
        console.error('Transaction error when saving tokens:', event);
        reject(event);
      };
    });
  } catch (error) {
    console.error('Error saving tokens to cache:', error);
  }
}

/**
 * Saves price data to IndexedDB with improved validation
 */
export async function savePricesToCache(prices: Record<string, number>, expiryMs = 15 * 60 * 1000): Promise<void> {
  if (!prices || Object.keys(prices).length === 0) {
    console.warn('Attempted to save empty price map to cache');
    return;
  }

  try {
    const db = await initDB();
    const tx = db.transaction([PRICES_STORE, METADATA_STORE], 'readwrite');
    
    const priceStore = tx.objectStore(PRICES_STORE);
    const metadataStore = tx.objectStore(METADATA_STORE);
    
    // Clear existing prices
    priceStore.clear();
    
    // Add each price - validate data before storing
    Object.entries(prices).forEach(([address, price]) => {
      if (address && !isNaN(price)) {
        priceStore.put({ address, price });
      }
    });
    
    // Update metadata with expiry
    metadataStore.put({
      key: PRICES_STORE,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => {
        console.error('Transaction error when saving prices:', event);
        reject(event);
      };
    });
  } catch (error) {
    console.error('Error saving prices to cache:', error);
  }
}

/**
 * Gets tokens from IndexedDB with improved cache validation
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
      console.log('Token cache expired or missing');
      return null;
    }
    
    // Get all tokens
    const tokenStore = tx.objectStore(TOKEN_STORE);
    const tokenReq = tokenStore.getAll();
    
    const tokens = await new Promise<any[]>((resolve, reject) => {
      tokenReq.onsuccess = () => resolve(tokenReq.result);
      tokenReq.onerror = (event) => reject(event);
    });
    
    // Validate token data before returning
    if (!tokens || tokens.length === 0) {
      console.log('Token cache is empty');
      return null;
    }
    
    // Filter out potentially corrupted token data
    const validTokens = tokens.filter(token => 
      token && 
      token.address && 
      token.symbol && 
      token.name && 
      token.decimals !== undefined
    );
    
    return validTokens;
  } catch (error) {
    console.error('Error getting tokens from cache:', error);
    return null;
  }
}

/**
 * Gets prices from IndexedDB with improved error handling
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
      console.log('Price cache expired or missing');
      return null;
    }
    
    // Get all prices
    const priceStore = tx.objectStore(PRICES_STORE);
    const priceReq = priceStore.getAll();
    
    const prices = await new Promise<Array<{ address: string; price: number }>>((resolve, reject) => {
      priceReq.onsuccess = () => resolve(priceReq.result);
      priceReq.onerror = (event) => reject(event);
    });
    
    // Validate price data before converting to record
    if (!prices || prices.length === 0) {
      console.log('Price cache is empty');
      return null;
    }
    
    // Convert to record
    const priceMap: Record<string, number> = {};
    
    // Filter out invalid prices
    prices.forEach(item => {
      if (item && item.address && !isNaN(item.price)) {
        priceMap[item.address] = item.price;
      }
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
    
    console.log('Token cache cleared successfully');
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
    
    console.log('Price cache cleared successfully');
  } catch (error) {
    console.error('Error clearing price cache:', error);
  }
}

/**
 * Checks if a token cache exists and is valid
 */
export async function isTokenCacheValid(): Promise<boolean> {
  try {
    const db = await initDB();
    const tx = db.transaction([METADATA_STORE], 'readonly');
    
    const metadataStore = tx.objectStore(METADATA_STORE);
    const metadataReq = metadataStore.get(TOKEN_STORE);
    
    const metadataResult = await new Promise<CacheMetadata | undefined>((resolve, reject) => {
      metadataReq.onsuccess = () => resolve(metadataReq.result);
      metadataReq.onerror = (event) => reject(event);
    });
    
    return !!metadataResult && Date.now() <= metadataResult.expiry;
  } catch (error) {
    console.error('Error checking token cache validity:', error);
    return false;
  }
}