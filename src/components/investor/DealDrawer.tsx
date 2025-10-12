import React, { useState } from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Position, Offer } from "@/lib/investor/types";
import { investmentApi } from "@/lib/api";

interface DealDrawerProps {
  deal: Position | Offer;
  onClose: () => void;
  onInvestmentSuccess?: () => void;
}

export function DealDrawer({ deal, onClose, onInvestmentSuccess }: DealDrawerProps) {
  const isOffer = "riskTier" in deal;
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentError, setInvestmentError] = useState<string | null>(null);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);

  const handleFund = async () => {
    if (!isOffer) return;

    setIsInvesting(true);
    setInvestmentError(null);

    try {
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const response = await investmentApi.invest(userId, {
        loan_application_id: deal.id,
        investment_amount: deal.advance,
      });

      if (response.success) {
        setInvestmentSuccess(true);
        
        // Trigger data refresh
        if (onInvestmentSuccess) {
          onInvestmentSuccess();
        }
        
        // Wait 2 seconds and close
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setInvestmentError(response.message || 'Investment failed');
      }
    } catch (error) {
      setInvestmentError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsInvesting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">{deal.property}</div>
            <div className="text-slate-600">{deal.location}</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="font-semibold mb-2">Terms</div>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>
                Advance: <b>{mxn(deal.advance)}</b>
              </li>
              <li>
                Rent per month: <b>{mxn(deal.rent)}</b>
              </li>
              <li>
                Term: <b>{deal.termMonths} months</b>
              </li>
              <li>
                IRR (est.): <b>{pct(deal.irrAPR)}</b>
              </li>
              {isOffer && (
                <>
                  <li>
                    OC/Haircut:{" "}
                    <b>
                      {deal.ocPct.toFixed(2)} % / {deal.haircutPct.toFixed(2)} %
                    </b>
                  </li>
                  <li>
                    Currency: <b>{deal.currency}</b>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="card">
            <div className="font-semibold mb-2">Risk & docs</div>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>
                Tenant score: <b>{deal.tenantScore || "—"}</b>
              </li>
              <li>
                Property score: <b>{deal.propertyScore || "—"}</b>
              </li>
              <li>
                E-sign hash: <b>{deal.esignHash || "0x…"}</b>
              </li>
              <li>
                Attestations (EAS): <b>{deal.attestations || 3}</b>
              </li>
              <li>
                Stream status:{" "}
                <b>
                  {"stream" in deal
                    ? deal.stream
                    : "—"}
                </b>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2 card">
            <div className="font-semibold">Cashflow preview</div>
            <div className="mt-2 text-sm text-slate-600">
              Projected rent stream (gross, before fees/taxes).
            </div>
            <DealFlowPreview rent={deal.rent} months={deal.termMonths} />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          {investmentError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <p className="font-semibold">Investment failed:</p>
              <p>{investmentError}</p>
            </div>
          )}
          
          {investmentSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              <p className="font-semibold">✓ Investment successful!</p>
              <p>Your investment has been processed.</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Not an offer; informational preview only.
            </div>
            {isOffer ? (
              <div className="flex gap-2">
                <button className="btn btn-outline">Simulate</button>
                <button 
                  className="btn btn-primary"
                  onClick={handleFund}
                  disabled={isInvesting || investmentSuccess}
                >
                  {isInvesting ? 'Processing...' : investmentSuccess ? 'Invested ✓' : 'Fund now'}
                </button>
              </div>
            ) : (
              <div className="pill">Position detail</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DealFlowPreview({ rent, months }: { rent: number; months: number }) {
  const data = Array.from({ length: months }, (_, i) => ({ m: i + 1, v: rent }));
  const max = rent;
  
  return (
    <div className="mt-3 h-28 w-full">
      <svg viewBox={`0 0 ${months * 36} 100`} className="w-full h-full">
        {data.map((d, i) => {
          const h = (d.v / max) * 90 + 2;
          return (
            <rect
              key={i}
              x={i * 36 + 6}
              y={100 - h}
              width={24}
              height={h}
              rx={6}
              fill="#16A289"
            />
          );
        })}
      </svg>
    </div>
  );
}
