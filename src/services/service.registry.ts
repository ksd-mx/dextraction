import { WalletService } from './wallet/wallet.service';

// Create singleton instances of each service
const walletService = new WalletService();

// Export service classes
export {
  WalletService,
};

// Export singleton instances
export {
  walletService,
};