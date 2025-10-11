import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Offer } from "@/lib/investor/types";

interface OfferGridProps {
  offers: Offer[];
  onOpen: (offer: Offer) => void;
}

export function OfferGrid({ offers, onOpen }: OfferGridProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">No marketplace listings available</p>
        <p className="text-slate-400 text-sm mt-2">Check back later for new opportunities</p>
      </div>
    );
  }

  return (
    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {offers.map((o) => (
        <div key={o.id} className="card hover:ring-2 hover:ring-[#1297C8] transition-all">
          {/* Header with property name and tier */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{o.property}</h3>
              <p className="text-slate-500 text-sm mt-1">{o.location}</p>
            </div>
            <span className="pill shrink-0 ml-2">Tier {o.riskTier}</span>
          </div>

          {/* Key metrics in grid */}
          <div className="space-y-3 mb-5 pb-5 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <KV k="Advance" v={mxn(o.advance)} />
              <KV k="Rent/mo" v={mxn(o.rent)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <KV k="IRR est." v={pct(o.irrAPR)} />
              <KV k="Term" v={`${o.termMonths}m`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <KV k="OC/Haircut" v={`${o.ocPct}% / ${o.haircutPct}%`} />
              <KV k="Chain" v={`${o.chain} • ${o.currency}`} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button 
              className="btn btn-primary flex-1" 
              onClick={() => onOpen(o)}
            >
              Preview & Fund
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={() => onOpen(o)}
            >
              Details
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-slate-500 text-xs mb-1">{k}</div>
      <div className="font-semibold text-slate-900">{v}</div>
    </div>
  );
}
