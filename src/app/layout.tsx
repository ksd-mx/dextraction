import '@/app/globals.css';
import {config} from '@/config/app-config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/navbar.component';
import { AppProviders } from '@/app/provider';
import Footer from '@/components/layout/footer.component';

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
        <AppProviders>
          <div className="min-h-screen animated-gradient text-white overflow-x-hidden">
            <Navbar />
            <main className="container mx-auto px-4 py-4 relative">
              {children}
            </main>
            
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}