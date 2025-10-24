"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";
import { Wallet, ChevronDown, LogOut } from "lucide-react";

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showOptions, setShowOptions] = useState(false);

  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-teal-500/20"
        >
          <Wallet size={18} />
          <span className="hidden sm:inline">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <ChevronDown size={16} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </button>
        
        {showOptions && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowOptions(false)}
            />
            <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 shadow-xl rounded-lg w-56 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Connected Address</p>
                <p className="text-sm text-white font-mono break-all">
                  {address}
                </p>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setShowOptions(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors"
              >
                <LogOut size={16} />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isPending}
        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-teal-500/20 disabled:shadow-none"
      >
        <Wallet size={18} />
        <span>{isPending ? "Connecting..." : "Connect Wallet"}</span>
        {!isPending && <ChevronDown size={16} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />}
      </button>

      {showOptions && !isPending && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 shadow-xl rounded-lg w-56 overflow-hidden z-50">
            <div className="p-2">
              <button
                onClick={
                  () => {
                    connect({ connector: metaMask() });
                    setShowOptions(false);
                  }
                }
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  🦊
                </div>
                <span>MetaMask</span>
              </button>
              <button
                onClick = {() => {
                  connect({ connector: coinbaseWallet({ appName: "My DApp" }) });
                  setShowOptions(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-lg">
                  🪙
                </div>
                <span>Coinbase Wallet</span>
              </button>
              <button
                onClick={() => {
                  connect({ connector: injected() });
                  setShowOptions(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Wallet size={16} />
                </div>
                <span>Injected Wallet</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
