/**
 * RoomLen V2 - Contract Addresses
 * Deployed on Base Sepolia (Testnet)
 *
 * Import this file in your frontend to use the deployed contracts
 */

export const CHAIN_ID = 84532; // Base Sepolia
export const CHAIN_NAME = "Base Sepolia";
export const RPC_URL = "https://sepolia.base.org";
export const EXPLORER_URL = "https://sepolia.basescan.org";

// Contract Addresses
export const CONTRACTS = {
  VRA_NFT: "0x674687e09042452C0ad3D5EC06912bf4979bFC33",
  TRR_NFT: "0xF8F626afB4AadB41Be7D746e53Ff417735b1C289",
  LENDING_PROTOCOL: "0xeD9018D47ee787C5d84A75A42Df786b8540cC75b",
  SECONDARY_MARKET: "0x9c2be1158ba6B8ED8B528B685058F743336b988F",
} as const;

// Supported Tokens (Base Sepolia)
export const TOKENS = {
  USDC: {
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
  USDT: {
    address: "0xf8b6097E8c1adFa8B2f37c5876Ed07E87Dcf2C3C",
    decimals: 6,
    symbol: "USDT",
    name: "Tether USD",
  },
} as const;

// Risk Tiers Configuration
export const RISK_TIERS = [
  {
    name: "Tier A",
    scoreThreshold: 80,
    haircutBps: 1000, // 10%
    ocBps: 1000, // 10%
    interestRateBps: 1200, // 12% APR
    displayAPR: "12%",
  },
  {
    name: "Tier B",
    scoreThreshold: 60,
    haircutBps: 1500, // 15%
    ocBps: 1200, // 12%
    interestRateBps: 1800, // 18% APR
    displayAPR: "18%",
  },
  {
    name: "Tier C",
    scoreThreshold: 40,
    haircutBps: 2200, // 22%
    ocBps: 1600, // 16%
    interestRateBps: 2500, // 25% APR
    displayAPR: "25%",
  },
] as const;

// Platform Configuration
export const PLATFORM_CONFIG = {
  platformFeeBps: 250, // 2.5%
  minListingDuration: 3600, // 1 hour in seconds
} as const;

// Explorer URLs for quick access
export const EXPLORER_LINKS = {
  VRA_NFT: `${EXPLORER_URL}/address/${CONTRACTS.VRA_NFT}`,
  TRR_NFT: `${EXPLORER_URL}/address/${CONTRACTS.TRR_NFT}`,
  LENDING_PROTOCOL: `${EXPLORER_URL}/address/${CONTRACTS.LENDING_PROTOCOL}`,
  SECONDARY_MARKET: `${EXPLORER_URL}/address/${CONTRACTS.SECONDARY_MARKET}`,
  USDC: `${EXPLORER_URL}/token/${TOKENS.USDC.address}`,
  USDT: `${EXPLORER_URL}/token/${TOKENS.USDT.address}`,
} as const;

// Helper function to get transaction URL
export function getTxUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}

// Helper function to get address URL
export function getAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

// Helper function to get risk tier for a score
export function getRiskTierForScore(score: number): typeof RISK_TIERS[number] | null {
  return RISK_TIERS.find(tier => score >= tier.scoreThreshold) || null;
}

// Export all as a single object for convenience
export const ROOMLEN_CONFIG = {
  chainId: CHAIN_ID,
  chainName: CHAIN_NAME,
  rpcUrl: RPC_URL,
  explorerUrl: EXPLORER_URL,
  contracts: CONTRACTS,
  tokens: TOKENS,
  riskTiers: RISK_TIERS,
  platformConfig: PLATFORM_CONFIG,
  explorerLinks: EXPLORER_LINKS,
} as const;

export default ROOMLEN_CONFIG;
