'use client';

import { useEffect, useState } from 'react';
import { BackgroundEffects } from '@/components/ui/effects/background-effects.component';
import { WalletDebug } from '@/components/wallet/wallet-debug.component';

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative py-8">
      {/* Render background effects only after client-side hydration */}
      {hasMounted && <BackgroundEffects />}
      
      <div className="z-10 w-full max-w-md mx-auto">
        <WalletDebug />
      </div>
    </div>
  );
}