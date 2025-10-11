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
 * Portfolio Endpoints
 */
export const portfolioApi = {
  /**
   * Get investor portfolio data
   */
  getPortfolio: async (userId: string) => {
    return roomfiClient.get<PortfolioResponse>(`/lending/investor/portfolio?user_id=${userId}`);
  },
};

/**
 * Investment Endpoints
 */
export const investmentApi = {
  /**
   * Invest in a loan application
   */
  invest: async (userId: string, data: InvestmentRequest) => {
    return roomfiClient.post<InvestmentResponse>(`/lending/investor/invest?user_id=${userId}`, data);
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

/**
 * Portfolio API Response Types
 */
export interface PortfolioResponse {
  active_loans: ActiveLoan[];
  total_invested: number;
  total_returns: number;
}

export interface ActiveLoan {
  loan_id: string;
  borrower_user_id: string;
  principal_amount: number;
  interest_rate: number;
  remaining_balance: number;
  next_payment_date: string;
  loan_status: string;
}

/**
 * Investment API Request/Response Types
 */
export interface InvestmentRequest {
  loan_application_id: string;
  investment_amount: number;
}

export interface InvestmentResponse {
  success: boolean;
  message?: string;
  loan_id?: string;
  investment_id?: string;
}
