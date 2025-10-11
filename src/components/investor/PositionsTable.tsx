import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Position } from "@/lib/investor/types";

interface PositionsTableProps {
  positions: Position[];
  onOpen: (position: Position) => void;
  onShowTRR: (position: Position) => void; // New prop to handle TRR modal
}

export function PositionsTable({ positions, onOpen, onShowTRR }: PositionsTableProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Your Positions</h2>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {[
                "Property",
                "Status",
                "Principal",
                "Rent/mo",
                "IRR est.",
                "Next Payment",
                "Digital Asset (TRR)",
                "",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.property}</div>
                  <div className="text-slate-500">{p.location}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">{mxn(p.advance)}</td>
                <td className="px-4 py-3">{mxn(p.rent)}</td>
                <td className="px-4 py-3">{pct(p.irrAPR)}</td>
                <td className="px-4 py-3">{p.nextPayment}</td>
                <td className="px-4 py-3">
                  <button className="btn btn-sm btn-outline" onClick={() => onShowTRR(p)}>
                    View TRR
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="btn btn-ghost" onClick={() => onOpen(p)}>
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

function StatusBadge({ status }: { status: "Active" | "Completed" | "Default" }) {
  const map = {
    Active: { label: "Active", cls: "bg-green-50 text-green-700 ring-green-200" },
    Completed: { label: "Completed", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
    Default: { label: "Default", cls: "bg-red-50 text-red-700 ring-red-200" },
  };
  const s = map[status] || map.Active;
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}
