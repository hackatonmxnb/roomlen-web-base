"use client";

import React, { useMemo, useState } from "react";
import { TopbarOwner } from "@/components/owner/TopbarOwner";
import { ActiveAdvanceCard } from "@/components/owner/ActiveAdvanceCard";
import { PropertiesCard } from "@/components/owner/PropertiesCard";
import { OffersCard } from "@/components/owner/OffersCard";
import { TipsCard } from "@/components/owner/TipsCard";
import { AdvanceFlowModal } from "@/components/owner/AdvanceFlowModal";
import { Footer } from "@/components/owner/Footer";
import { SAMPLE_ROOMFI_LEASES } from "@/lib/owner/sampleData";
import type { Lease, Advance, OwnerOffer } from "@/lib/owner/types";

// RoomLen — Owner Dashboard (Simplified MVP)
// Focused, mobile-first flow with AI scoring

export default function OwnerDashboard() {
  const [leases, setLeases] = useState(SAMPLE_ROOMFI_LEASES);
  const [activeAdvance, setActiveAdvance] = useState<Advance | null>(null);
  const [offers, setOffers] = useState<OwnerOffer[]>([]);
  const [flow, setFlow] = useState({ 
    open: false, 
    step: 1, 
    lease: null as Lease | null, 
    ai: null as any, 
    published: false, 
    busy: false 
  });

  // Actions
  function openFlow(lease: Lease) {
    setFlow({ open: true, step: 1, lease, ai: null, published: false, busy: false });
  }

  function closeFlow() { 
    setFlow({ open: false, step: 1, lease: null, ai: null, published: false, busy: false }); 
  }

  function importFromRoomFi() {
    if (!flow.lease) return;
    setFlow((f) => ({ ...f, lease: { ...f.lease!, imported: true, docs: true } }));
  }

  function runAI() {
    if (!flow.lease) return;
    const l = flow.lease;
    const inputs = {
      rentMXN: l.rent,
      termMonths: l.termMonths,
      monthlyDiscPct: 1.5,
      onTimeRatio: l.onTimeRatio ?? 0.9,
      rentToIncome: l.rentToIncome ?? 0.32,
      depositMonths: l.depositMonths ?? 1,
      docsQuality: l.docsQuality ?? 0.9,
      marketIndex: l.marketIndex ?? 0.8,
      currencyMismatch: false,
    };
    const priced = scoreAndPrice(inputs);
    setFlow((f) => ({ ...f, ai: priced }));
  }

  function publishToMarketplace() {
    if (!flow.ai || !flow.lease) return;
    setFlow((f) => ({ ...f, busy: true }));
    
    setTimeout(() => {
      const base = flow.ai;
      const offer: OwnerOffer = {
        id: `of_${Date.now()}`,
        property: flow.lease!.property,
        location: flow.lease!.location,
        advance: Math.round(base.advance),
        irrAPR: base.irrAPR / 100,
        termMonths: flow.lease!.termMonths,
        ocPct: base.ocPct,
        haircutPct: base.haircutPct,
        fees: 1.0,
        chain: "Base",
        riskTier: base.tier,
        rent: flow.lease!.rent,
      };
      setOffers((prev) => [offer, ...prev]);
      setFlow((f) => ({ ...f, published: true, busy: false }));
    }, 900);
  }

  function acceptOffer(offer: OwnerOffer) {
    setActiveAdvance({
      id: offer.id,
      amount: offer.advance,
      property: offer.property,
      location: offer.location,
      fundedOn: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      remaining: offer.termMonths,
      ocPct: offer.ocPct,
      haircutPct: offer.haircutPct,
      stream: "Healthy",
      termMonths: offer.termMonths,
      rent: offer.rent,
    });
    
    setLeases((prev) => prev.map((l) => 
      l.id === offer.id ? { ...l, status: "Escrow active" } : l
    ));
    
    setOffers((prev) => prev.filter((x) => x.id !== offer.id));
  }

  function earlySettle() {
    setActiveAdvance(null);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopbarOwner />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActiveAdvanceCard 
              advance={activeAdvance} 
              leases={leases} 
              onEarlySettle={earlySettle} 
            />
            <PropertiesCard 
              leases={leases} 
              onGetAdvance={openFlow} 
            />
          </div>
          <div className="space-y-6">
            <OffersCard 
              offers={offers} 
              onAccept={acceptOffer} 
            />
            <TipsCard />
          </div>
        </div>
      </main>

      {flow.open && (
        <AdvanceFlowModal
          flow={flow}
          setFlow={setFlow}
          onClose={closeFlow}
          onImport={importFromRoomFi}
          onRunAI={runAI}
          onPublish={publishToMarketplace}
        />
      )}

      <Footer />
    </div>
  );
}

// Risk engine (fixed tiers)
function scoreAndPrice(i: any) {
  const s =
    30 * Math.min(1, i.onTimeRatio) +
    20 * (1 - Math.min(1, i.rentToIncome)) +
    10 * Math.min(1, i.depositMonths / 2) +
    10 * (i.termMonths <= 12 ? 1 : Math.max(0, 1 - (i.termMonths - 12) / 12)) +
    20 * Math.min(1, i.docsQuality) +
    10 * Math.min(1, i.marketIndex);

  const tier = s >= 80 ? "A" : s >= 60 ? "B" : s >= 40 ? "C" : "REJECT";
  if (tier === "REJECT") return { tier, reason: "Low score", score: Math.round(s) };

  let haircut = tier === "A" ? 0.10 : tier === "B" ? 0.15 : 0.22;
  let oc = tier === "A" ? 0.08 : tier === "B" ? 0.12 : 0.16;

  if (i.depositMonths >= 1) oc = Math.max(0.06, oc - 0.02);
  if (i.termMonths > 12) haircut += 0.03;
  if (i.docsQuality < 0.8) haircut += 0.03;
  if (i.currencyMismatch) haircut += 0.02;

  const r = i.monthlyDiscPct / 100;
  const PV = i.rentMXN * (1 - Math.pow(1 + r, -i.termMonths)) / r;
  const advance = (PV * (1 - haircut)) / (1 + oc);

  const irrMonthly = solveIRRMonthly(-advance, i.rentMXN, i.termMonths);
  const irrAPR = Math.pow(1 + irrMonthly, 12) - 1;

  return {
    tier,
    score: Math.round(s),
    haircutPct: +(haircut * 100).toFixed(1),
    ocPct: +(oc * 100).toFixed(1),
    PV: Math.round(PV),
    advance: Math.round(advance),
    irrAPR: +(irrAPR * 100).toFixed(1),
  };
}

function solveIRRMonthly(negAdvance: number, rent: number, n: number) {
  let lo = 0.0001, hi = 0.2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const pv = rent * (1 - Math.pow(1 + mid, -n)) / mid;
    (pv + negAdvance > 0) ? lo = mid : hi = mid;
  }
  return (lo + hi) / 2;
}
