"use client";

import React from "react";
import { formatMXN } from "@/lib/owner/utils";
import type { Lease } from "@/lib/owner/types";

interface PropertiesCardProps {
  leases: Lease[];
  onGetAdvance: (lease: Lease) => void;
}

export function PropertiesCard({ leases, onGetAdvance }: PropertiesCardProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Your properties</div>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
          {leases.length} total
        </span>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {leases.map((l) => (
          <div key={l.id} className="py-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{l.property}</div>
              <div className="text-slate-600 text-sm">{l.location} • Rent {formatMXN(l.rent)} / mo</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white ${
                l.status === 'Escrow active' ? 'bg-green-50 text-green-700 ring-green-200' : ''
              }`}>
                {l.status}
              </span>
              <button 
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                onClick={() => onGetAdvance(l)} 
                disabled={l.status === 'Escrow active'}
              >
                {l.status === 'Escrow active' ? 'Streaming' : 'Get advance'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
