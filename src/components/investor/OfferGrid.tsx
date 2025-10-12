import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Offer } from "@/lib/investor/types";
import { InvestorHelpTooltip, INVESTOR_TERMS } from "./InvestorHelpTooltip";

interface OfferGridProps {
  offers: Offer[];
  onOpen: (offer: Offer) => void;
}

export function OfferGrid({ offers, onOpen }: OfferGridProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏘️</div>
        <p className="text-slate-500 text-lg font-semibold">No marketplace listings available</p>
        <p className="text-slate-400 text-sm mt-2">Check back later for new investment opportunities</p>
      </div>
    );
  }

  return (
    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {offers.map((o) => (
        <div key={o.id} className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:ring-2 hover:ring-[#1297C8] transition-all p-5 group">
          {/* Tier Badge - Top Right */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            o.riskTier === 'A' ? 'bg-green-100 text-green-800 ring-1 ring-green-300' :
            o.riskTier === 'B' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300' :
            'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300'
          }`}>
            Tier {o.riskTier}
            <InvestorHelpTooltip {...INVESTOR_TERMS.riskTier} />
          </div>

          {/* Header with property name */}
          <div className="mb-4 pr-20">
            <h3 className="font-bold text-lg text-slate-900 mb-1">{o.property}</h3>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              📍 {o.location}
            </p>
          </div>

          {/* Main Advance Amount - Highlighted */}
          <div className="mb-4 p-4 bg-gradient-to-br from-[#ADE0C4] to-[#ACDBE5] rounded-xl">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
              Advance Amount
              <InvestorHelpTooltip {...INVESTOR_TERMS.advance} />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{mxn(o.advance)}</div>
          </div>

          {/* Key metrics in grid */}
          <div className="space-y-3 mb-5 pb-5 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <KVWithTooltip k="Monthly Rent" v={mxn(o.rent)} tooltip={INVESTOR_TERMS.termMonths} />
              <KVWithTooltip k="IRR (APR)" v={pct(o.irrAPR)} tooltip={INVESTOR_TERMS.irr} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <KVWithTooltip k="Term" v={`${o.termMonths} months`} tooltip={INVESTOR_TERMS.termMonths} />
              <KVSimple k="Currency" v={o.currency} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <KVWithTooltip k="Haircut" v={`${o.haircutPct.toFixed(1)}%`} tooltip={INVESTOR_TERMS.haircut} />
              <KVWithTooltip k="Over-Collat." v={`${o.ocPct.toFixed(1)}%`} tooltip={INVESTOR_TERMS.oc} />
            </div>
          </div>

          {/* Chain Badge */}
          <div className="mb-4 flex items-center gap-2 text-xs">
            <img src="/polkadot_logo.png" alt="Polkadot" className="h-4 w-auto" />
            <span className="font-semibold text-slate-600">{o.chain}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#16A957] to-[#1297C8] text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
              onClick={() => onOpen(o)}
            >
              💰 Fund Now
            </button>
            <button
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
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

function KVWithTooltip({ k, v, tooltip }: { k: string; v: string; tooltip: any }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
        {k}
        <InvestorHelpTooltip {...tooltip} />
      </div>
      <div className="font-semibold text-slate-900">{v}</div>
    </div>
  );
}

function KVSimple({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-slate-500 text-xs mb-1">{k}</div>
      <div className="font-semibold text-slate-900">{v}</div>
    </div>
  );
}
