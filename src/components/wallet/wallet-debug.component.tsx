'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// You can add this component temporarily to your app to debug wallet connection
export function WalletDebug() {
  const {
    wallets,
    wallet,
    publicKey,
    connecting,
    connected,
    disconnecting,
    autoConnect,
  } = useWallet();
  
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log entries
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  };
  
  // Track wallet connection state changes
  useEffect(() => {
    addLog(`Connection state changed: connected=${connected}, connecting=${connecting}`);
  }, [connected, connecting]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-10 z-50 overflow-auto">
      <div className="bg-[#1B2131] border border-[#2D3548] rounded-lg shadow-xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between border-b border-[#2D3548] p-4">
          <h2 className="text-lg font-medium">Wallet Debug Panel</h2>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-[#94A3B8] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#94A3B8]">Connection State</h3>
            <div className="bg-[#202535] p-3 rounded-lg text-sm">
              <p>Connected: <span className={connected ? "text-green-500" : "text-red-500"}>{connected ? "Yes" : "No"}</span></p>
              <p>Connecting: <span className={connecting ? "text-yellow-500" : "text-[#94A3B8]"}>{connecting ? "Yes" : "No"}</span></p>
              <p>Disconnecting: <span className={disconnecting ? "text-yellow-500" : "text-[#94A3B8]"}>{disconnecting ? "Yes" : "No"}</span></p>
              <p>Auto Connect: <span className={autoConnect ? "text-green-500" : "text-[#94A3B8]"}>{autoConnect ? "Enabled" : "Disabled"}</span></p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#94A3B8]">Selected Wallet</h3>
            <div className="bg-[#202535] p-3 rounded-lg text-sm">
              {wallet ? (
                <>
                  <p>Name: {wallet.adapter.name}</p>
                  <p>Public Key: {publicKey?.toString() || 'None'}</p>
                </>
              ) : (
                <p>No wallet selected</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#94A3B8]">Available Wallets</h3>
            <div className="bg-[#202535] p-3 rounded-lg text-sm">
              {wallets.length > 0 ? (
                <ul className="space-y-2">
                  {wallets.map(w => (
                    <li key={w.adapter.name} className="flex items-center justify-between">
                      <span>{w.adapter.name}</span>
                      <span className={
                        w.readyState === 'Installed' ? "text-green-500" : 
                        w.readyState === 'Loadable' ? "text-yellow-500" : 
                        "text-red-500"
                      }>
                        {w.readyState}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No wallets detected</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#94A3B8]">Connection Logs</h3>
            <div className="bg-[#202535] p-3 rounded-lg text-sm h-40 overflow-y-auto">
              {logs.length > 0 ? (
                <ul className="space-y-1">
                  {logs.map((log, i) => (
                    <li key={i} className="text-xs font-mono">{log}</li>
                  ))}
                </ul>
              ) : (
                <p>No logs yet</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => addLog("Manual debug log entry")} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
              Add Log
            </button>
            <button 
              onClick={() => setLogs([])} 
              className="bg-[#2D3548] hover:bg-[#3D4663] text-white px-4 py-2 rounded-lg text-sm">
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}