"use client";

import React, { useMemo, useState } from "react";
import { Topbar } from "@/components/investor/Topbar";
import { KPIBar } from "@/components/investor/KPIBar";
import { CashflowStrip } from "@/components/investor/CashflowStrip";
import { PositionsTable } from "@/components/investor/PositionsTable";
import { MarketFilters } from "@/components/investor/MarketFilters";
import { OfferGrid } from "@/components/investor/OfferGrid";
import { DealDrawer } from "@/components/investor/DealDrawer";
import { Footer } from "@/components/investor/Footer";
import { SAMPLE_POSITIONS, SAMPLE_OFFERS } from "@/lib/investor/sampleData";
import { summarize } from "@/lib/investor/utils";
import type { Position, Offer } from "@/lib/investor/types";

// RoomLen — Investor Dashboard (MVP)
// Next.js App Router page with modular components

export default function InvestorDashboard() {
  const [tab, setTab] = useState<"portfolio" | "market">("portfolio");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ tier: "all", term: "all" });
  const [selected, setSelected] = useState<Position | Offer | null>(null);

  const positions = useMemo(() => SAMPLE_POSITIONS, []);
  const offers = useMemo(() => SAMPLE_OFFERS, []);

  const portfolio = useMemo(() => summarize(positions), [positions]);

  const filteredOffers = useMemo(() => {
    return offers.filter((o: Offer) => {
      const q = query.toLowerCase();
      const matchQ = [o.property, o.location, o.chain, o.currency].some((x: string) =>
        x.toLowerCase().includes(q)
      );
      const matchTier = filters.tier === "all" || o.riskTier === filters.tier;
      const matchTerm =
        filters.term === "all" ||
        (filters.term === "short" && o.termMonths <= 6) ||
        (filters.term === "med" && o.termMonths > 6 && o.termMonths <= 12) ||
        (filters.term === "long" && o.termMonths > 12);
      return matchQ && matchTier && matchTerm;
    });
  }, [offers, query, filters]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Topbar tab={tab} onTab={setTab} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {tab === "portfolio" && (
          <>
            <KPIBar portfolio={portfolio} />
            <CashflowStrip portfolio={portfolio} />
            <PositionsTable positions={positions} onOpen={setSelected} />
          </>
        )}

        {tab === "market" && (
          <>
            <MarketFilters
              query={query}
              setQuery={setQuery}
              filters={filters}
              setFilters={setFilters}
            />
            <OfferGrid offers={filteredOffers} onOpen={setSelected} />
          </>
        )}
      </main>

      {selected && (
        <DealDrawer deal={selected} onClose={() => setSelected(null)} />
      )}

      <Footer />
    </div>
  );
}
