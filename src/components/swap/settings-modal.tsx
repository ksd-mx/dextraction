'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/class-name.util';
import { useSwapStore } from '@/store/swap-store';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { slippage, setSlippage } = useSwapStore();
  
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
          <h2 className="text-lg font-semibold uppercase tracking-wider">Swap Settings</h2>
          <button 
            onClick={onClose} 
            className="text-[#94A3B8] hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-[#94A3B8] mb-4 uppercase tracking-wider">
            You have full control over all settings.
            Please proceed with caution.
          </p>
        </div>
        
        {/* Modal body */}
        <div className="px-4 pb-4 space-y-4">
          {/* Slippage settings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#2D3548] text-[#94A3B8]">
                ⏱
              </div>
              <h3 className="text-[#94A3B8] uppercase tracking-wider">Slippage Setting</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[0.1, 0.5, 1.0].map((option) => (
                <button
                  key={option}
                  onClick={() => setSlippage(option)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition uppercase tracking-wider",
                    slippage === option
                      ? "bg-[#AFD803] text-[#111827]"
                      : "bg-[#2D3548] hover:bg-[#3D4663] text-white"
                  )}
                >
                  {option}%
                </button>
              ))}
              
              <div className="relative">
                <input
                  type="number"
                  value={slippage === 0.1 || slippage === 0.5 || slippage === 1.0 ? '' : slippage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setSlippage(value);
                    }
                  }}
                  placeholder="Custom"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2D3548] focus:bg-[#3D4663] w-24 pr-8 text-white uppercase tracking-wider"
                  step="0.1"
                  min="0.1"
                  max="100"
                />
                <span className="absolute right-3 top-2 text-sm text-[#94A3B8]">%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Close button */}
        <div className="p-4 border-t border-[#2D3548]">
          <button 
            onClick={onClose}
            className="jupiter-button w-full py-3 uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}