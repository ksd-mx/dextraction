import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Re-export utilities from specialized files
export { 
  formatNumber, 
  formatCurrency, 
  formatSlippage,
  calculatePriceImpact
} from './format-utils';

export {
  shortenAddress,
  formatWalletAddress,
  isValidPublicKey,
  formatTxSignature
} from './wallet-utils';

export {
  delay,
  debounce,
  throttle,
  retry
} from './async-utils';

/**
 * Utility for combining Tailwind CSS classes conditionally
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}