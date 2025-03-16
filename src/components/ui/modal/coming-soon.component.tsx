'use client';

import { useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface ComingSoonModalProps {
  featureName: string;
  onClose: () => void;
}

export default function ComingSoonModal({ featureName, onClose }: ComingSoonModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="jupiter-card max-w-md w-full shadow-xl shadow-black/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2D3548]">
          <h2 className="text-lg font-semibold">{featureName}</h2>
          <button 
            onClick={onClose} 
            className="text-[#94A3B8] hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal body */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#2D3548] rounded-full flex items-center justify-center mb-4">
            <Clock size={32} className="text-[#AFD803]" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          
          <p className="text-[#94A3B8] mb-6">
            The {featureName} feature is currently under development and will be available in a future update.
          </p>
          
          <button
            onClick={onClose}
            className="jupiter-button px-6 py-3"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}