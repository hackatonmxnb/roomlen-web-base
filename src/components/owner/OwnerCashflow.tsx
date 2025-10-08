"use client";

import React from "react";
import type { Lease } from "@/lib/owner/types";

interface OwnerCashflowProps {
  leases: Lease[];
}

export function OwnerCashflow({ leases }: OwnerCashflowProps) {
  const income = leases.filter(l => l.status !== "Closed").reduce((s, l) => s + l.rent, 0);
  const data = Array.from({ length: 12 }, (_, i) => ({ m: i + 1, v: income }));
  const max = income || 1;

  return (
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Tenant rent schedule</div>
          <div className="text-sm text-slate-600">Projected inflows to escrow (next 12 months)</div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
          Escrow active
        </span>
      </div>
      <div className="mt-3 h-24 w-full">
        <svg viewBox={`0 0 ${data.length * 40} 100`} className="w-full h-full">
          {data.map((d, i) => {
            const h = (d.v / max) * 90 + 2;
            return (
              <rect
                key={i}
                x={i * 40 + 6}
                y={100 - h}
                width={24}
                height={h}
                rx={6}
                fill="#1297C8"
                opacity={0.85}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}
