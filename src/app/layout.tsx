import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/navbar';
import { WalletConnectionProvider } from '@/components/wallet/wallet-provider';
import NotificationSystem from '@/components/ui/notification';
import { config } from '@/utils/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${config.app.name} - Solana DEX`,
  description: 'A full-stack, Solana-based Decentralized Exchange with integrated Yield Farming, Cross-Chain Stablecoin Deposits, and Lending functionality.',
  keywords: 'Solana, DEX, DeFi, Swap, Tokens, Blockchain, Crypto, Trading, Yield Farming',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <WalletConnectionProvider>
          <div className="min-h-screen animated-gradient text-white overflow-x-hidden">
            <Navbar />
            <main className="container mx-auto px-4 py-4 relative">
              {children}
            </main>
            
            {/* Notification System */}
            <NotificationSystem />
            
            {/* Footer - transparent and borderless */}
            <div className="mt-auto">
              <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs uppercase tracking-wider text-[#94A3B8]">
                  <div className="flex gap-4">
                    <span>© 2025 {config.app.name}</span>
                    <a href="#" className="hover:text-white">Terms</a>
                    <a href="#" className="hover:text-white">Privacy</a>
                  </div>
                  <div className="flex gap-3">
                    <a href="#" className="hover:text-white">Twitter</a>
                    <a href="#" className="hover:text-white">Discord</a>
                    <a href="#" className="hover:text-white">Github</a>
                    <a href="#" className="hover:text-white">Docs</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </WalletConnectionProvider>
      </body>
    </html>
  );
}