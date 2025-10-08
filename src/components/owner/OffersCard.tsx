"use client";

import React from "react";
import { formatMXN, formatPercentage } from "@/lib/owner/utils";
import type { OwnerOffer } from "@/lib/owner/types";

interface OffersCardProps {
  offers: OwnerOffer[];
  onAccept: (offer: OwnerOffer) => void;
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-slate-500">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

export function OffersCard({ offers, onAccept }: OffersCardProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Offers</div>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
          {offers.length} new
        </span>
      </div>
      {offers.length === 0 ? (
        <div className="mt-2 text-sm text-slate-600">No offers yet. Publish a lease to the marketplace.</div>
      ) : (
        <div className="mt-4 grid gap-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-xl ring-1 ring-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{o.property}</div>
                  <div className="text-slate-600 text-sm">{o.location}</div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
                  Tier {o.riskTier}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <KV k="Advance" v={formatMXN(o.advance)} />
                <KV k="IRR (APR)" v={formatPercentage(o.irrAPR)} />
                <KV k="Term" v={`${o.termMonths} m`} />
                <KV k="OC / Haircut" v={`${o.ocPct}% / ${o.haircutPct}%`} />
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                  onClick={() => onAccept(o)}
                >
                  Accept
                </button>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
