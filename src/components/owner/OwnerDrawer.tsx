"use client";

import React from "react";
import { formatMXN } from "@/lib/owner/utils";
import type { Lease, Advance, OwnerOffer } from "@/lib/owner/types";

interface OwnerDrawerProps {
  item: Lease | Advance | OwnerOffer;
  onClose: () => void;
}

function OwnerFlowBars({ rent, months }: { rent: number; months: number }) {
  const arr = Array.from({ length: months || 0 }, (_, i) => ({ m: i + 1, v: rent }));
  const max = rent || 1;
  
  if (!arr.length) return <div className="text-sm text-slate-500 mt-2">No data</div>;
  
  return (
    <div className="mt-2 h-28 w-full">
      <svg viewBox={`0 0 ${arr.length * 36} 100`} className="w-full h-full">
        {arr.map((d, i) => {
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

export function OwnerDrawer({ item, onClose }: OwnerDrawerProps) {
  const isOffer = 'advance' in item && 'irrAPR' in item;
  const isAdvance = 'amount' in item && 'fundedOn' in item;
  const isLease = 'tenant' in item && 'dueDay' in item;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">
              {item.property || (item as any).title || "Details"}
            </div>
            <div className="text-slate-600">{(item as any).location || "—"}</div>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="font-semibold mb-2">Snapshot</div>
            <ul className="text-sm space-y-1 text-slate-700">
              {(item as any).rent && <li>Rent/mo: <b>{formatMXN((item as any).rent)}</b></li>}
              {(item as any).termMonths && <li>Term: <b>{(item as any).termMonths} months</b></li>}
              {isOffer && <li>Advance (offer): <b>{formatMXN((item as OwnerOffer).advance)}</b></li>}
              {isAdvance && <li>Advance (funded): <b>{formatMXN((item as Advance).amount)}</b></li>}
              {((item as any).ocPct !== undefined) && <li>OC/Haircut: <b>{(item as any).ocPct}% / {(item as any).haircutPct}%</b></li>}
              {(item as any).stream && <li>Stream: <b>{(item as any).stream}</b></li>}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="font-semibold mb-2">Documents</div>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>Lease PDF: <b>{(item as any).esignHash || "pending"}</b></li>
              <li>Attestations: <b>{(item as any).attestations || 0}</b></li>
              <li>Tenant score: <b>{(item as any).tenantScore || "—"}</b></li>
              <li>Property score: <b>{(item as any).propertyScore || "—"}</b></li>
            </ul>
          </div>
          <div className="md:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="font-semibold">Cashflow preview</div>
            <OwnerFlowBars rent={(item as any).rent || 0} months={(item as any).termMonths || 0} />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">This is an informational preview.</div>
          {isOffer ? (
            <div className="flex gap-2">
              <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200">
                Request changes
              </button>
              <button
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
              >
                Accept offer
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
              Lease detail
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
