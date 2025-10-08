"use client";

import React from "react";
import { formatMXN } from "@/lib/owner/utils";
import type { Lease } from "@/lib/owner/types";

interface OwnerLeasesTableProps {
  leases: Lease[];
  onOpen: (lease: Lease) => void;
  compact?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-green-50 text-green-700 ring-green-200",
    Pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    Closed: "bg-slate-50 text-slate-700 ring-slate-200"
  };
  const cls = map[status] || map.Active;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white ${cls}`}>
      {status}
    </span>
  );
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

export function OwnerLeasesTable({ leases, onOpen, compact }: OwnerLeasesTableProps) {
  return (
    <section className="mt-6">
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Leases</h2>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
            {leases.length} total
          </span>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {["Property", "Tenant", "Rent/mo", "Due date", "Escrow", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leases.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{l.property}</div>
                  <div className="text-slate-500">{l.location}</div>
                </td>
                <td className="px-4 py-3">{l.tenant}</td>
                <td className="px-4 py-3">{formatMXN(l.rent)}</td>
                <td className="px-4 py-3">{l.dueDay} each month</td>
                <td className="px-4 py-3">
                  <StreamBadge status={l.escrow} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
                    onClick={() => onOpen(l)}
                  >
                    View
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
