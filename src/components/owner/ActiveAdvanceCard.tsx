"use client";

import React from "react";
import { formatMXN, formatPercentage } from "@/lib/owner/utils";
import type { Advance, Lease } from "@/lib/owner/types";

interface ActiveAdvanceCardProps {
  advance: Advance | null;
  leases: Lease[];
  onEarlySettle: () => void;
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-slate-500">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

export function ActiveAdvanceCard({ advance, leases, onEarlySettle }: ActiveAdvanceCardProps) {
  if (!advance) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="font-semibold">No active advance</div>
        <div className="text-sm text-slate-600">Import a lease and request an advance to get started.</div>
      </section>
    );
  }

  const lease = leases.find((l) => l.id === advance.id);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-600">Active advance</div>
          <div className="text-xl font-bold">{lease?.property} — {lease?.location}</div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
          Escrow active
        </span>
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
        <KV k="You received" v={formatMXN(advance.amount)} />
        <KV k="Months remaining" v={`${advance.remaining}`} />
        <KV k="Next rent" v={advance.fundedOn} />
        <KV k="OC / Haircut" v={`${advance.ocPct}% / ${advance.haircutPct}%`} />
        <KV k="IRR (investor)" v={formatPercentage(0.12)} />
        <KV k="Rent / mo" v={formatMXN(lease?.rent || 0)} />
      </div>
      <div className="mt-4 flex gap-2">
        <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200">
          View escrow
        </button>
        <button 
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
          onClick={onEarlySettle}
        >
          Settle early
        </button>
      </div>
    </section>
  );
}
