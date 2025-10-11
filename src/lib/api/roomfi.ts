/**
 * RoomFi API Client
 * Handles all requests to the RoomFi lending API
 */

import { ApiClient } from './client';

// Initialize the RoomFi API client
export const roomfiClient = new ApiClient({
  baseURL: 'https://unstruct.xyz/roomfi',
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Marketplace Endpoints
 */
export const marketplaceApi = {
  /**
   * Get all marketplace lending opportunities
   */
  getMarketplace: async () => {
    return roomfiClient.get<MarketplaceResponse>('/lending/marketplace');
  },
};

/**
 * Type definitions for API responses
 */
export interface MarketplaceResponse {
  loan_applications: LoanApplication[];
  total_count: number;
}

export interface LoanApplication {
  loan_application_id: string;
  borrower_user_id: string;
  property_address: string;
  requested_amount: number;
  interest_rate: number;
  loan_term_months: number;
  risk_tier: string;
  property_value: number;
}

export interface MarketplaceListing {
  id: string;
  property: string;
  location: string;
  advance: number;
  rent: number;
  termMonths: number;
  irrAPR: number;
  ocPct: number;
  haircutPct: number;
  chain: string;
  currency: string;
  riskTier: string;
  tenantScore?: string;
  propertyScore?: string;
  esignHash?: string;
  attestations?: number;
}
