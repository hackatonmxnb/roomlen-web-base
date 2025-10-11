/**
 * Custom hook for fetching marketplace data
 */

import { useState, useEffect, useCallback } from 'react';
import { marketplaceApi, MarketplaceListing, LoanApplication } from '@/lib/api/roomfi';
import { ApiError } from '@/lib/api/client';

interface UseMarketplaceResult {
  data: MarketplaceListing[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Transform API loan application to marketplace listing format
 */
function transformLoanApplication(app: LoanApplication): MarketplaceListing {
  // Extract property name and location from address
  const addressParts = app.property_address.split(',');
  const property = addressParts[0]?.trim() || app.property_address;
  const location = addressParts.slice(1).join(',').trim() || 'N/A';
  
  // Calculate estimated rent (assuming 1% of property value per month)
  const estimatedRent = app.property_value * 0.01;
  
  // Calculate LTV ratio
  const ltvRatio = (app.requested_amount / app.property_value) * 100;
  
  return {
    id: app.loan_application_id,
    property,
    location,
    advance: app.requested_amount,
    rent: estimatedRent,
    termMonths: app.loan_term_months,
    irrAPR: app.interest_rate,
    ocPct: 100 - ltvRatio, // Overcollateralization = 100% - LTV
    haircutPct: 10, // Default haircut
    chain: 'API',
    currency: 'USD',
    riskTier: app.risk_tier,
  };
}

export function useMarketplace(): UseMarketplaceResult {
  const [data, setData] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketplace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await marketplaceApi.getMarketplace();
      
      // Transform loan applications to marketplace listings
      const listings = response.loan_applications.map(transformLoanApplication);
      
      setData(listings);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to fetch marketplace: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchMarketplace,
  };
}
