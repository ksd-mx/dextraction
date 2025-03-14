'use client';

import SwapWidget from '@/components/swap/swap-widget';
import BackgroundEffects from '@/components/ui/background-effects';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative py-8">
      <BackgroundEffects />
      
      <div className="z-10 w-full max-w-md mx-auto">
        <SwapWidget />
      </div>
    </div>
  );
}