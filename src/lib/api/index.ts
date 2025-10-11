/**
 * API Module Index
 * Central export point for all API-related functionality
 */

// Client exports
export { ApiClient, ApiError } from './client';
export type { ApiClientConfig, RequestOptions } from './client';

// RoomFi API exports
export { roomfiClient, marketplaceApi, portfolioApi, investmentApi } from './roomfi';
export type { 
  MarketplaceResponse, 
  MarketplaceListing,
  LoanApplication,
  PortfolioResponse,
  ActiveLoan,
  InvestmentRequest,
  InvestmentResponse
} from './roomfi';
