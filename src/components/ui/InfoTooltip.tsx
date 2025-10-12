"use client";

import React, { useState } from 'react';

interface InfoTooltipProps {
  title: string;
  description: string;
  example?: string;
}

export function InfoTooltip({ title, description, example }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-help"
        aria-label={`Information about ${title}`}
      >
        ?
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 p-4 bg-white rounded-xl shadow-xl border border-slate-200 -top-2 left-6 transform animate-fade-in">
          <div className="absolute -left-2 top-3 w-3 h-3 bg-white border-l border-t border-slate-200 transform rotate-45"></div>

          <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>
          <p className="text-sm text-slate-600 mb-2">{description}</p>

          {example && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Example:</span> {example}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Glossary of financial terms in simple language
export const FINANCIAL_TERMS = {
  advance: {
    title: "Advance",
    description: "It's the money you receive TODAY upfront. Instead of waiting month by month for your rent, we give you a single payment now.",
    example: "If your tenant pays $10,000/month for 12 months, you can receive up to $92,000 today."
  },
  haircut: {
    title: "Safety Discount",
    description: "It's a small percentage that is deducted to protect investors from risk. The better your payment history, the lower this discount will be.",
    example: "With 10% discount: If your total rent is $120,000, the calculation starts from $108,000."
  },
  oc: {
    title: "Extra Guarantee",
    description: "Over-Collateralization (OC) means that your property is worth more than the money you receive. This gives investors confidence.",
    example: "If you receive $90,000, your rental contract must be worth at least $99,000."
  },
  irr: {
    title: "Annual Return",
    description: "IRR (Internal Rate of Return) is how much the investor earns per year. It's like loan interest, but in reverse.",
    example: "15% annual means that for every $100,000 they invest, they earn $15,000 per year."
  },
  riskTier: {
    title: "Trust Level",
    description: "Based on your payment history and information, we assign you a letter: A (excellent), B (good) or C (regular). Better letter = better conditions.",
    example: "Level A: You always pay on time, have deposit, good contract → you get up to 90% advance."
  },
  trr: {
    title: "Rent Receipt Token",
    description: "It's a digital certificate (NFT) that proves you invested in a property. You can sell it if you need your money earlier.",
    example: "Like a traditional promissory note, but digital and you can sell it on Kodadot."
  },
  termMonths: {
    title: "Contract Term",
    description: "It's how many months your rental contract is signed for. The longer, the more advance you can receive.",
    example: "12-month contract = 12 monthly rent payments that you can advance."
  },
  monthlyRent: {
    title: "Monthly Rent",
    description: "It's the money your tenant pays you each month for living in your property.",
    example: "$10,000 MXN that your tenant deposits on the 1st of each month."
  },
  tenantScore: {
    title: "Tenant Rating",
    description: "A number from 0 to 100 that measures how reliable your tenant is based on their payment history, income and references.",
    example: "85 points = Excellent tenant who always pays on time."
  },
  escrow: {
    title: "Protected Account",
    description: "It's like a secure bank account where money is kept until everything is correct. No one can touch the money until conditions are met.",
    example: "Your tenant pays rent → It's kept in escrow → It's released to the investor automatically."
  }
};
