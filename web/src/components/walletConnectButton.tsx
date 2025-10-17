"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [showOptions, setShowOptions] = useState(false);

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-700">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <button
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>

      {showOptions && (
        <div className="absolute top-full mt-2 bg-white text-black border shadow-lg rounded-lg w-48 text-center">
          <button
            onClick={() => {
              connect({ connector: metaMask() });
              setShowOptions(false);
            }}
            className="block w-full px-4 py-2 hover:bg-gray-100"
          >
            MetaMask
          </button>

          <button
            onClick={() => {
              connect({ connector: coinbaseWallet({ appName: "My DApp" }) });
              setShowOptions(false);
            }}
            className="block w-full px-4 py-2 hover:bg-gray-100"
          >
            Coinbase Wallet
          </button>

          <button
            onClick={() => {
              connect({ connector: injected() });
              setShowOptions(false);
            }}
            className="block w-full px-4 py-2 hover:bg-gray-100"
          >
            Injected (Default)
          </button>
        </div>
      )}
    </div>
  );
}
