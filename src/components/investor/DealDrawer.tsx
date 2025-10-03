import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Position, Offer } from "@/lib/investor/types";

interface DealDrawerProps {
  deal: Position | Offer;
  onClose: () => void;
}

export function DealDrawer({ deal, onClose }: DealDrawerProps) {
  const isOffer = "riskTier" in deal;
  
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
                      {deal.ocPct}% / {deal.haircutPct}%
                    </b>
                  </li>
                  <li>
                    Chain/Currency: <b>{deal.chain}</b> • <b>{deal.currency}</b>
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

        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Not an offer; informational preview only.
          </div>
          {isOffer ? (
            <div className="flex gap-2">
              <button className="btn">Simulate</button>
              <button className="btn btn-primary">Fund now</button>
            </div>
          ) : (
            <div className="pill">Position detail</div>
          )}
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
