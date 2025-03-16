import { WalletError, WalletNotConnectedError, WalletNotReadyError } from '@solana/wallet-adapter-base';
import { showNotification } from './notification.utils';

/**
 * Handles wallet connection errors and provides appropriate user-friendly messages
 */
export function handleWalletError(error: unknown): void {
  console.error('Wallet error:', error);
  
  // Format error message for display
  let title = 'WALLET ERROR';
  let message = 'An unexpected error occurred with your wallet';
  
  if (error instanceof WalletNotConnectedError) {
    title = 'WALLET NOT CONNECTED';
    message = 'Please connect your wallet before performing this action';
  } else if (error instanceof WalletNotReadyError) {
    title = 'WALLET NOT READY';
    message = 'Please make sure your wallet extension is properly installed and unlocked';
  } else if (error instanceof WalletError) {
    // Handle specific wallet errors
    switch (error.name) {
      case 'WalletConnectionError':
        title = 'CONNECTION FAILED';
        message = 'Failed to connect to your wallet. Please try again.';
        break;
      case 'WalletDisconnectedError':
        title = 'WALLET DISCONNECTED';
        message = 'Your wallet has been disconnected';
        break;
      case 'WalletTimeoutError':
        title = 'CONNECTION TIMEOUT';
        message = 'Wallet connection timed out. Please try again.';
        break;
      case 'WalletAccountError':
        title = 'ACCOUNT ERROR';
        message = 'Could not access wallet account. Please check permissions.';
        break;
      case 'WalletKeypairError':
        title = 'KEYPAIR ERROR';
        message = 'Invalid keypair or permission denied';
        break;
      case 'WalletSignTransactionError':
        title = 'TRANSACTION SIGNING FAILED';
        message = 'Failed to sign transaction. The transaction was rejected.';
        break;
      case 'WalletSendTransactionError':
        title = 'TRANSACTION SENDING FAILED';
        message = 'Failed to send transaction to the network';
        break;
      default:
        title = 'WALLET ERROR';
        message = error.message || 'Unknown wallet error occurred';
    }
  } else if (error instanceof Error) {
    // Handle generic errors
    title = 'ERROR';
    
    // Check for common error messages
    if (error.message.includes('user rejected')) {
      title = 'CONNECTION REJECTED';
      message = 'You rejected the connection request';
    } else if (error.message.includes('timeout')) {
      title = 'CONNECTION TIMEOUT';
      message = 'Wallet connection timed out. Please try again.';
    } else if (error.message.includes('not installed')) {
      title = 'WALLET NOT INSTALLED';
      message = 'Please install a compatible wallet extension';
    } else {
      message = error.message;
    }
  }
  
  // Show the error notification with dramatic formatting
  showNotification.error(
    title,
    message,
    { 
      position: 'bottom',
      duration: 8000, // Show longer than usual notifications
    }
  );
}

/**
 * Wraps a promise with wallet error handling
 */
export async function withWalletErrorHandling<T>(
  promise: Promise<T>,
  successMessage?: { title: string; message: string }
): Promise<T | null> {
  try {
    const result = await promise;
    
    // Show success message if provided
    if (successMessage) {
      showNotification.success(
        successMessage.title,
        successMessage.message,
        { position: 'bottom' }
      );
    }
    
    return result;
  } catch (error) {
    handleWalletError(error);
    return null;
  }
}