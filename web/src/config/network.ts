/**
 * Network Configuration
 * Centralized configuration for blockchain network settings
 */

export const NETWORK_CONFIG = {
  stakeContract: process.env.NEXT_PUBLIC_STAKE_CONTRACT || '0xb506BaF2249e414662276Ded54eB862a54479142',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Flow EVM Testnet',
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '0x221',
  chainIdDecimal: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID_DECIMAL || '545'),
  nativeSymbol: process.env.NEXT_PUBLIC_NATIVE_SYMBOL || 'FLOW',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://evm-testnet.flowscan.io',
} as const;

export type NetworkConfig = typeof NETWORK_CONFIG;