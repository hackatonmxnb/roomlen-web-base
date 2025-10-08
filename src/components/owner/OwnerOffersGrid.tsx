"use client";

import React from "react";
import { formatMXN, formatPercentage } from "@/lib/owner/utils";
import type { OwnerOffer } from "@/lib/owner/types";

interface OwnerOffersGridProps {
  offers: OwnerOffer[];
  onOpen: (offer: OwnerOffer) => void;
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-slate-500">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

export function OwnerOffersGrid({ offers, onOpen }: OwnerOffersGridProps) {
  return (
    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {offers.map((o) => (
        <div key={o.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">Offer for {o.property}</div>
              <div className="text-slate-600 text-sm">{o.location}</div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
              Tier {o.riskTier}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <KV k="Advance" v={formatMXN(o.advance)} />
            <KV k="IRR est." v={formatPercentage(o.irrAPR)} />
            <KV k="Term" v={`${o.termMonths}m`} />
            <KV k="OC/Haircut" v={`${o.ocPct}% / ${o.haircutPct}%`} />
            <KV k="Fees" v={`${o.fees}%`} />
            <KV k="Chain" v={o.chain} />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
              onClick={() => onOpen(o)}
            >
              Review & Accept
            </button>
            <button
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
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
