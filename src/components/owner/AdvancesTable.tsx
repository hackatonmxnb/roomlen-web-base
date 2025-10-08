"use client";

import React from "react";
import { formatMXN } from "@/lib/owner/utils";
import type { Advance } from "@/lib/owner/types";

interface AdvancesTableProps {
  advances: Advance[];
  onOpen: (advance: Advance) => void;
}

function StreamBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Healthy: "bg-green-50 text-green-700 ring-green-200",
    Delayed: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    Default: "bg-red-50 text-red-700 ring-red-200"
  };
  const s = map[status] || map.Healthy;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white ${s}`}>
      {status}
    </span>
  );
}

export function AdvancesTable({ advances, onOpen }: AdvancesTableProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Your advances</h2>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
          {advances.length} active
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {["Advance", "Lease", "Funded on", "Remaining term", "OC/Haircut", "Stream", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {advances.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{formatMXN(a.amount)}</td>
                <td className="px-4 py-3">{a.property} • {a.location}</td>
                <td className="px-4 py-3">{a.fundedOn}</td>
                <td className="px-4 py-3">{a.remaining}m</td>
                <td className="px-4 py-3">{a.ocPct}% / {a.haircutPct}%</td>
                <td className="px-4 py-3">
                  <StreamBadge status={a.stream} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
                    onClick={() => onOpen(a)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
