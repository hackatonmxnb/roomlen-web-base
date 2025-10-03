import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Offer } from "@/lib/investor/types";

interface OfferGridProps {
  offers: Offer[];
  onOpen: (offer: Offer) => void;
}

export function OfferGrid({ offers, onOpen }: OfferGridProps) {
  return (
    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {offers.map((o) => (
        <div key={o.id} className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{o.property}</div>
              <div className="text-slate-600 text-sm">{o.location}</div>
            </div>
            <span className="pill">Tier {o.riskTier}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <KV k="Advance" v={mxn(o.advance)} />
            <KV k="Rent/mo" v={mxn(o.rent)} />
            <KV k="IRR est." v={pct(o.irrAPR)} />
            <KV k="Term" v={`${o.termMonths}m`} />
            <KV k="OC/Haircut" v={`${o.ocPct}% / ${o.haircutPct}%`} />
            <KV k="Chain" v={`${o.chain} • ${o.currency}`} />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" onClick={() => onOpen(o)}>
              Preview & Fund
            </button>
            <button className="btn btn-ghost" onClick={() => onOpen(o)}>
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
      <div className="text-slate-500">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}
