// Base API client setup with error handling and request/response formatting
import { config } from '@/config/app-config';

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
  
  // Generic method to handle GET requests
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
  
  // Generic method to handle POST requests
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
  
  // Helper to build URL with query parameters
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
  
  // Helper to handle response parsing and error detection
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Try to parse error response for better error messages
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      } catch (e) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // For successful responses, parse JSON data
    return response.json();
  }
  
  // Helper to handle and log errors
  private handleError(error: any, endpoint: string): void {
    console.error(`API error for ${endpoint}:`, error);
  }
}