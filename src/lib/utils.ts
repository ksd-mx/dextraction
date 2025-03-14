import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for combining Tailwind CSS classes conditionally
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with commas
 */
export function formatNumber(value: number | string, decimals = 2): string {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  
  if (isNaN(value)) return '0';
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | string, symbol = '$', decimals = 2): string {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  
  if (isNaN(value)) return `${symbol}0`;
  
  return `${symbol}${formatNumber(value, decimals)}`;
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Parse and format slippage value for display
 */
export function formatSlippage(slippage: number): string {
  return `${slippage.toFixed(1)}%`;
}

/**
 * Calculate price impact for a swap
 */
export function calculatePriceImpact(inputAmount: number, outputAmount: number, exchangeRate: number): number {
  const expectedOutput = inputAmount * exchangeRate;
  const impact = ((expectedOutput - outputAmount) / expectedOutput) * 100;
  
  return Math.max(0, impact); // Return positive value only
}

/**
 * Delay function for debouncing
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}