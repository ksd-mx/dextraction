import { config } from '@/utils/config';

/**
 * Base HTTP client for API requests
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(baseUrl: string = config.api.baseUrl) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
  
  /**
   * Perform a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const url = this.buildUrl(endpoint, params);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.defaultHeaders,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }
  
  /**
   * Perform a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const url = this.buildUrl(endpoint);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }
  
  /**
   * Build a URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }
  
  /**
   * Handle response parsing and error detection
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      } catch (error) {
        throw new Error(`API error: ${response.status} ${response.statusText} - ${error}`);
      }
    }
    
    return response.json();
  }
  
  /**
   * Handle and log errors
   */
  private handleError(error: any, endpoint: string): void {
    console.error(`API error for ${endpoint}:`, error);
  }
}

// Export a singleton instance for convenience
export const apiClient = new ApiClient();