import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

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
};

export default config;
