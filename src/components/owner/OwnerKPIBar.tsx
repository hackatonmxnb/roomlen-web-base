"use client";

import React from "react";
import { formatMXN, formatPercentage } from "@/lib/owner/utils";
import type { OwnerKPIs } from "@/lib/owner/types";

interface OwnerKPIBarProps {
  kpis: OwnerKPIs;
}

export function OwnerKPIBar({ kpis }: OwnerKPIBarProps) {
  const items = [
    { label: "Advance received", value: formatMXN(kpis.totalAdvance) },
    { label: "Next rent due", value: kpis.nextDue },
    { label: "On‑time rate", value: formatPercentage(kpis.onTimeRate) },
    { label: "Active leases", value: String(kpis.activeLeases) },
  ];

  return (
    <section className="grid md:grid-cols-4 gap-4">
      {items.map((k, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm text-slate-600">{k.label}</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">{k.value}</div>
        </div>
      ))}
    </section>
  );
}
