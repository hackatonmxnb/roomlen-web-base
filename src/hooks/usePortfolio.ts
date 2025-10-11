/**
 * Custom hook for fetching investor portfolio data
 */

import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, ActiveLoan, PortfolioResponse } from '@/lib/api/roomfi';
import { ApiError } from '@/lib/api/client';
import type { Position, Portfolio } from '@/lib/investor/types';

interface UsePortfolioResult {
  positions: Position[];
  portfolioSummary: PortfolioSummary;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface PortfolioSummary {
  totalInvested: number;
  totalReturns: number;
  activeLoans: number;
}

/**
 * Transform API active loan to position format
 */
function transformActiveLoan(loan: ActiveLoan): Position {
  // Calculate monthly payment and rent estimate
  const monthlyInterestRate = loan.interest_rate / 12;
  const estimatedMonthlyPayment = loan.principal_amount * monthlyInterestRate;
  
  // Determine stream status based on loan status
  const stream: "Healthy" | "Delayed" | "Default" = 
    loan.loan_status === 'active' ? 'Healthy' :
    loan.loan_status === 'late' ? 'Delayed' : 'Default';
  
  const status: "Active" | "Completed" | "Default" = 
    loan.loan_status === 'active' ? 'Active' :
    loan.loan_status === 'completed' ? 'Completed' : 'Default';

  // Format next payment date
  const nextPaymentDate = new Date(loan.next_payment_date).toLocaleDateString();

  return {
    id: loan.loan_id,
    property: `Loan #${loan.loan_id}`,
    location: 'API Loan', // Could be enhanced with actual property data
    advance: loan.principal_amount,
    rent: estimatedMonthlyPayment,
    termMonths: 0, // Not provided by API, could be calculated
    irrAPR: loan.interest_rate * 100, // Convert to percentage
    nextPayment: nextPaymentDate,
    stream,
    status,
  };
}

export function usePortfolio(userId: string): UsePortfolioResult {
  const [positions, setPositions] = useState<Position[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalInvested: 0,
    totalReturns: 0,
    activeLoans: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: PortfolioResponse = await portfolioApi.getPortfolio(userId);

      // Transform active loans to positions
      const transformedPositions = response.active_loans.map(transformActiveLoan);

      setPositions(transformedPositions);
      setPortfolioSummary({
        totalInvested: response.total_invested,
        totalReturns: response.total_returns,
        activeLoans: response.active_loans.length,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to fetch portfolio: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setPositions([]);
      setPortfolioSummary({
        totalInvested: 0,
        totalReturns: 0,
        activeLoans: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    positions,
    portfolioSummary,
    isLoading,
    error,
    refetch: fetchPortfolio,
  };
}
