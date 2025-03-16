'use client';

import { useState, useEffect } from 'react';

export function BackgroundEffects() {
  const [isClient, setIsClient] = useState(false);
  
  // Only render on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    // Return a placeholder with similar structure but no random positions
    return (
      <div className="space-background">
        <div className="space-gradient"></div>
        <div className="space-light-sweep"></div>
        <div className="space-orb-1"></div>
        <div className="space-orb-2"></div>
        <div className="space-glow-1"></div>
        <div className="space-glow-2"></div>
        <div className="space-glow-3"></div>
      </div>
    );
  }
  
  // This will only render on the client side
  return (
    <div className="space-background">
      {/* Background gradient overlay */}
      <div className="space-gradient"></div>
      
      {/* Stars with dynamic positioning */}
      <Stars />
      
      {/* Light sweep effect */}
      <div className="space-light-sweep"></div>
      
      {/* Celestial orbs */}
      <div className="space-orb-1"></div>
      <div className="space-orb-2"></div>
      
      {/* Glow effects */}
      <div className="space-glow-1"></div>
      <div className="space-glow-2"></div>
      <div className="space-glow-3"></div>
    </div>
  );
}

// Separate client-only Stars component
function Stars() {
  // Generate 100 stars with random positions
  const starElements = Array.from({ length: 100 }).map((_, i) => {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = 1 + Math.random() * 1.5;
    const opacity = 0.2 + Math.random() * 0.8;
    
    return (
      <div
        key={i}
        className="absolute rounded-full bg-white opacity-30"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
        }}
      />
    );
  });
  
  return <div className="absolute inset-0 z-2 overflow-hidden">{starElements}</div>;
}