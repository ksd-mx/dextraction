import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DEXTRACTION - Solana DEX',
  description: 'A full-stack, Solana-based Decentralized Exchange with integrated Yield Farming, Cross-Chain Stablecoin Deposits, and Lending functionality.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <div className="min-h-screen animated-gradient text-white">
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}