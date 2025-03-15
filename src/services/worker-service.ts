/**
 * Service to manage Web Worker interactions for token processing
 */
import { TokenInfo } from '@/types/token';

// Type for callbacks that can be registered to handle worker messages
type WorkerCallback = (data: any) => void;

class TokenWorkerService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private callbacks: Map<string, WorkerCallback[]> = new Map();

  /**
   * Initialize the worker service
   */
  public initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Only create a worker in the browser environment
        if (typeof window !== 'undefined') {
          this.worker = new Worker(new URL('../lib/token-worker.ts', import.meta.url));
          
          // Setup listener for worker messages
          this.worker.onmessage = (event) => {
            const { type, payload } = event.data;
            
            // Call registered callbacks for this message type
            const handlers = this.callbacks.get(type) || [];
            handlers.forEach(callback => callback(payload));
            
            // If this is the READY message, resolve the promise
            if (type === 'READY') {
              this.isInitialized = true;
              resolve();
            }
          };
          
          // Handle worker errors
          this.worker.onerror = (error) => {
            console.error('Worker error:', error);
            reject(error);
          };
        } else {
          // In non-browser environments (e.g., during SSR), just mark as initialized
          this.isInitialized = true;
          resolve();
        }
      } catch (error) {
        console.error('Failed to initialize worker:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message to the worker
   */
  public sendMessage(type: string, payload?: any): void {
    if (!this.worker) {
      console.warn('Worker not initialized');
      return;
    }
    
    this.worker.postMessage({ type, payload });
  }

  /**
   * Register a callback for a specific message type
   */
  public on(type: string, callback: WorkerCallback): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    
    this.callbacks.get(type)!.push(callback);
    
    // Return a function to unregister this callback
    return () => {
      const handlers = this.callbacks.get(type) || [];
      this.callbacks.set(
        type,
        handlers.filter(h => h !== callback)
      );
    };
  }

  /**
   * Fetch tokens using the worker
   */
  public fetchTokens(): void {
    this.sendMessage('FETCH_TOKENS');
  }

  /**
   * Fetch prices for tokens using the worker
   */
  public fetchPrices(tokens: TokenInfo[]): void {
    this.sendMessage('FETCH_PRICES', { tokens });
  }

  /**
   * Filter tokens by query using the worker
   */
  public filterTokens(
    tokens: TokenInfo[],
    query: string,
    favoriteTokens: string[] = [],
    popularTokens: string[] = []
  ): void {
    this.sendMessage('FILTER_TOKENS', {
      tokens,
      query,
      favoriteTokens,
      popularTokens
    });
  }

  /**
   * Sort tokens using the worker
   */
  public sortTokens(
    tokens: TokenInfo[],
    favoriteTokens: string[] = [],
    popularTokens: string[] = []
  ): void {
    this.sendMessage('SORT_TOKENS', {
      tokens,
      favoriteTokens,
      popularTokens
    });
  }

  /**
   * Terminate the worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.callbacks.clear();
    }
  }
}

// Create a singleton instance
const tokenWorkerService = new TokenWorkerService();

export default tokenWorkerService;