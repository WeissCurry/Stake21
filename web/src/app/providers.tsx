"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";
import { NETWORK_CONFIG } from "@/config/network"; // Import from network.ts

// Konfigurasi Flow EVM Testnet dari NETWORK_CONFIG
const flowTestnet = {
  id: NETWORK_CONFIG.chainIdDecimal,
  name: NETWORK_CONFIG.chainName,
  network: "flow-testnet",
  nativeCurrency: {
    name: NETWORK_CONFIG.nativeSymbol,
    symbol: NETWORK_CONFIG.nativeSymbol,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [NETWORK_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "FlowScan", url: NETWORK_CONFIG.explorerUrl },
  },
  testnet: true,
};

const config = createConfig({
  chains: [flowTestnet],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "DEEN" }),
    injected(),
  ],
  transports: {
    [flowTestnet.id]: http(NETWORK_CONFIG.rpcUrl),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}