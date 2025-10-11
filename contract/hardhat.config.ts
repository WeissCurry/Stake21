import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
// jika pakai plugin verifikasi tersendiri, pastikan sudah terinstall

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: process.env.WALLET_KEY ? [process.env.WALLET_KEY] : [],
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      accounts: process.env.WALLET_KEY ? [process.env.WALLET_KEY] : [],
    },
  },

  // === Etherscan V2 setup (gunakan 1 ETHERSCAN_API_KEY untuk semua chain) ===
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          // NOTE: gunakan Etherscan V2 API base URL
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
};

export default config;
