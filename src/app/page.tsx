'use client';

import { useEffect, useState } from 'react';
import SwapWidget from '@/components/swap/swap-widget';
import dynamic from 'next/dynamic';

// Import BackgroundEffects with SSR disabled
const ClientBackgroundEffects = dynamic(
  () => import('@/components/ui/background-effects'),
  { ssr: false }
);

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative py-8">
      {/* Render background effects only after client-side hydration */}
      {hasMounted && <ClientBackgroundEffects />}
      
      <div className="z-10 w-full max-w-md mx-auto">
        <SwapWidget />
      </div>
    </div>
  );
}