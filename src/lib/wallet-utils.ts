/**
 * Shorten wallet address
 */
export function shortenAddress(address: string, chars = 4): string {
    if (!address) return '';
    
    return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
  }
  
  /**
   * Formats an address for display in UI
   */
  export function formatWalletAddress(address: string | null | undefined): string {
    if (!address) return '';
    
    return shortenAddress(address);
  }
  
  /**
   * Checks if a string is a valid public key
   */
  export function isValidPublicKey(address: string): boolean {
    return address?.length === 44 || address?.length === 43;
  }
  
  /**
   * Formats a transaction signature for display
   */
  export function formatTxSignature(signature: string | undefined, chars = 8): string {
    if (!signature) return '';
    
    return `${signature.substring(0, chars)}...`;
  }