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