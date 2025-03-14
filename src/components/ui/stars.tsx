'use client';

import { useState, useEffect } from 'react';

// More visually appealing Stars component with different sizes and animation
function Stars() {
  // Generate 150 stars with varying properties
  const starElements = Array.from({ length: 150 }).map((_, i) => {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    
    // Create variety in star sizes
    const size = 1 + Math.random() * 2;
    
    // Create variety in star brightness
    const opacity = 0.3 + Math.random() * 0.7;
    
    // Add subtle animation to some stars
    const hasAnimation = Math.random() > 0.7;
    const animationDuration = 3 + Math.random() * 7; // Between 3-10s
    const animationDelay = Math.random() * 5;
    
    return (
      <div
        key={i}
        className={`absolute rounded-full bg-white ${hasAnimation ? 'animate-twinkle' : ''}`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
          animationDuration: hasAnimation ? `${animationDuration}s` : undefined,
          animationDelay: hasAnimation ? `${animationDelay}s` : undefined,
        }}
      />
    );
  });
  
  return <div className="absolute inset-0 z-2 overflow-hidden">{starElements}</div>;
}

// Even more advanced version with star clusters and different colors
function EnhancedStars() {
  // Create a beautiful star field with 200 stars
  const stars = [];
  
  // Regular stars (white)
  for (let i = 0; i < 150; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = 1 + Math.random() * 2;
    const opacity = 0.3 + Math.random() * 0.7;
    const blur = Math.random() > 0.8 ? `blur(${Math.random() * 1}px)` : 'none';
    const hasAnimation = Math.random() > 0.7;
    const animationDuration = 3 + Math.random() * 7;
    const animationDelay = Math.random() * 5;
    
    stars.push(
      <div
        key={`star-${i}`}
        className={`absolute rounded-full bg-white ${hasAnimation ? 'animate-twinkle' : ''}`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
          filter: blur,
          animationDuration: hasAnimation ? `${animationDuration}s` : undefined,
          animationDelay: hasAnimation ? `${animationDelay}s` : undefined,
        }}
      />
    );
  }
  
  // Colored stars (subtle blue and yellow tints)
  for (let i = 0; i < 30; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = 1.5 + Math.random() * 1;
    const opacity = 0.3 + Math.random() * 0.7;
    const color = Math.random() > 0.5 ? 'rgb(200, 220, 255)' : 'rgb(255, 250, 220)';
    const hasAnimation = Math.random() > 0.5;
    const animationDuration = 3 + Math.random() * 7;
    const animationDelay = Math.random() * 5;
    
    stars.push(
      <div
        key={`colored-star-${i}`}
        className={`absolute rounded-full ${hasAnimation ? 'animate-twinkle' : ''}`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          opacity: opacity,
          animationDuration: hasAnimation ? `${animationDuration}s` : undefined,
          animationDelay: hasAnimation ? `${animationDelay}s` : undefined,
        }}
      />
    );
  }
  
  // A few larger glowing stars
  for (let i = 0; i < 10; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = 2 + Math.random() * 2;
    const glowSize = size * (1.5 + Math.random() * 1);
    const opacity = 0.7 + Math.random() * 0.3;
    const glowOpacity = 0.1 + Math.random() * 0.2;
    const hasAnimation = true;
    const animationDuration = 4 + Math.random() * 6;
    const animationDelay = Math.random() * 3;
    
    // Glow effect
    stars.push(
      <div
        key={`glow-${i}`}
        className="absolute rounded-full animate-pulse"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          backgroundColor: 'white',
          opacity: glowOpacity,
          filter: `blur(${size}px)`,
          transform: 'translate(-50%, -50%)',
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
        }}
      />
    );
    
    // Star center
    stars.push(
      <div
        key={`star-center-${i}`}
        className={`absolute rounded-full bg-white ${hasAnimation ? 'animate-twinkle' : ''}`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
          transform: 'translate(-50%, -50%)',
          animationDuration: hasAnimation ? `${animationDuration}s` : undefined,
          animationDelay: hasAnimation ? `${animationDelay}s` : undefined,
        }}
      />
    );
  }
  
  return <div className="absolute inset-0 z-2 overflow-hidden">{stars}</div>;
}

export { Stars, EnhancedStars };