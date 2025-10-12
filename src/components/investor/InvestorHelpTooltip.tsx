"use client";

import React, { useState } from 'react';

interface HelpTooltipProps {
  term: string;
  explanation: string;
  example?: string;
  blockchainIntegration?: string;
}

export function InvestorHelpTooltip({ term, explanation, example, blockchainIntegration }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <span className="relative inline-flex items-center group">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggle}
        className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-[#16A957] to-[#1297C8] text-white hover:scale-110 transition-transform text-xs font-bold shadow-md z-30"
        aria-label={`Help about ${term}`}
      >
        ?
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[35]"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={tooltipRef}
            className="absolute z-[60] w-80 bg-white rounded-xl shadow-2xl border-2 border-[#1297C8] p-4 bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fade-in pointer-events-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-8 border-transparent border-t-[#1297C8]"></div>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16A957] to-[#1297C8] flex items-center justify-center text-white font-bold">
                ?
              </div>
              <div className="font-bold text-slate-900">{term}</div>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed mb-3">
              {explanation}
            </div>

            {example && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-semibold text-blue-900 mb-1">💡 Example:</div>
                <div className="text-xs text-blue-800">{example}</div>
              </div>
            )}

            {blockchainIntegration && (
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/polkadot_logo.png"
                    alt="Polkadot"
                    className="h-4 w-auto"
                  />
                  <div className="text-xs font-semibold text-purple-900">On Polkadot:</div>
                </div>
                <div className="text-xs text-purple-800 leading-relaxed">{blockchainIntegration}</div>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </span>
  );
}

// Specific terms for Investor Dashboard
export const INVESTOR_TERMS = {
  invested: {
    term: "Total Invested",
    explanation: "The total amount of capital you've deployed across all active rental property investments on the platform.",
    example: "If you funded 3 properties with $50k, $30k, and $20k advances, your total invested is $100k.",
    blockchainIntegration: "This value is calculated by summing all your funded loan amounts stored in the LendingProtocol smart contract on Polkadot."
  },
  monthlyIncome: {
    term: "Monthly Income",
    explanation: "Expected monthly cash flow from all your active investments. This is the total rent payments coming to you each month.",
    example: "Property A pays $2k/month, Property B pays $1.5k/month → Your monthly income is $3.5k.",
    blockchainIntegration: "Smart contracts automatically stream rent payments to your wallet monthly. Track all payments on-chain via Blockscout."
  },
  netIRR: {
    term: "Net IRR (Internal Rate of Return)",
    explanation: "Your portfolio's annualized return rate after accounting for all cash flows (investments and payments). Higher is better!",
    example: "15% Net IRR means for every $100 invested, you earn $15 profit per year.",
    blockchainIntegration: "IRR is calculated using on-chain payment history from the smart contract. All transactions are verifiable and transparent."
  },
  activeDeals: {
    term: "Active Deals",
    explanation: "Number of rental properties you're currently funding. These are investments where rent payments are actively streaming to you.",
    example: "If you funded 5 properties and 2 completed their terms, you have 3 active deals remaining.",
    blockchainIntegration: "Each deal is represented by a loan NFT (TRR token) you hold. View all your NFTs on Kodadot marketplace."
  },
  riskTier: {
    term: "Risk Tier",
    explanation: "A letter grade (A, B, C) indicating the quality and risk of the rental property. Tier A = lowest risk, best tenants.",
    example: "Tier A: Excellent tenant, always pays on time, stable income → Lower IRR but safer. Tier C: Higher risk → Higher IRR to compensate.",
    blockchainIntegration: "Risk tier is algorithmically calculated from tenant credit score stored in the rental NFT metadata on Polkadot."
  },
  advance: {
    term: "Advance Amount",
    explanation: "The lump sum the property owner receives upfront. You (investor) provide this capital in exchange for future rent payments.",
    example: "Owner requests $90k advance for a property worth $120k in total rent over 12 months.",
    blockchainIntegration: "When you fund a deal, wMXNB tokens are transferred from your wallet to the owner's wallet via smart contract."
  },
  irr: {
    term: "IRR (APR)",
    explanation: "Your annual percentage return on this investment. This is the interest rate you earn for providing the advance.",
    example: "12% IRR means if you invest $100k, you'll receive ~$112k back over the term (monthly installments).",
    blockchainIntegration: "IRR parameters are set in the RiskTier contract and enforced on-chain. Can't be changed after deployment."
  },
  haircut: {
    term: "Haircut",
    explanation: "Safety buffer (discount) applied to the property's total rent value before calculating advance. Protects you from defaults.",
    example: "Property has $100k total rent, 15% haircut → Only $85k is used for advance calculation. You're protected if tenant pays late.",
    blockchainIntegration: "Haircut percentage is stored in the smart contract's risk tier parameters and automatically applied to all calculations."
  },
  oc: {
    term: "Over-Collateralization (OC)",
    explanation: "Extra security requirement. The property must be worth MORE than what you lend. Protects investors from loss.",
    example: "10% OC means: If advance is $90k, property's rental contract must be worth at least $99k ($90k ÷ 0.91).",
    blockchainIntegration: "Smart contract verifies OC ratio before allowing loan requests. Your capital is always over-collateralized on-chain."
  },
  trr: {
    term: "TRR (Tokenized Rent Receipt)",
    explanation: "An NFT you receive when funding a property. It proves your investment and can be sold on secondary markets if you need liquidity.",
    example: "You fund Property #123 → Receive TRR NFT #123 → Can sell it on Kodadot to exit early.",
    blockchainIntegration: "TRRs are ERC-721 NFTs minted on Polkadot when you fund a loan. Trade them on Kodadot or keep for rent streams."
  },
  termMonths: {
    term: "Term (Months)",
    explanation: "Duration of the investment. How long you'll receive monthly rent payments before the loan is fully repaid.",
    example: "12-month term means you'll receive monthly payments for 1 year, then your capital + profit is fully returned.",
    blockchainIntegration: "Term is stored in the loan struct on-chain. Smart contract enforces payment schedules based on this duration."
  },
  marketplace: {
    term: "Marketplace",
    explanation: "Where you browse available properties to fund. Property owners list their advance requests here for investors like you.",
    example: "See 20 properties available: Filter by Tier A, 12-month term, 15%+ IRR → Choose best match for your strategy.",
    blockchainIntegration: "Marketplace pulls live data from Polkadot blockchain. All listed properties have verified NFTs and on-chain data."
  },
  nextPayment: {
    term: "Next Payment",
    explanation: "Date when you'll receive the next rent installment. Payments are typically monthly and automated via smart contracts.",
    example: "If next payment is Dec 1st, expect rent to hit your wallet automatically on that date.",
    blockchainIntegration: "Payment dates are calculated from the loan funding timestamp. Rent streams automatically via smart contract."
  },
  status: {
    term: "Loan Status",
    explanation: "Current state of your investment: Active (earning rent), Completed (fully paid), or Default (payment issues).",
    example: "Active = Rent streaming normally. Completed = Term ended, all paid. Default = Tenant stopped paying (escrow activates).",
    blockchainIntegration: "Status is updated on-chain by the smart contract. Monitor status changes via blockchain events in real-time."
  }
};
