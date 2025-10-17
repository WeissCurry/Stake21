"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "DEEN" }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http("https://mainnet.base.org"),
    [sepolia.id]: http("https://sepolia.base.org"),
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
