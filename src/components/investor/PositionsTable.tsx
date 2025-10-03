import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Position } from "@/lib/investor/types";

interface PositionsTableProps {
  positions: Position[];
  onOpen: (position: Position) => void;
}

export function PositionsTable({ positions, onOpen }: PositionsTableProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Your positions</h2>
        <div className="flex items-center gap-2">
          <span className="pill">Base (L2)</span>
          <span className="pill">USDC</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {[
                "Deal",
                "Status",
                "Advance",
                "Rent/mo",
                "IRR est.",
                "Next payment",
                "Stream",
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
                  <span
                    className={`pill ${
                      p.status === "Active"
                        ? ""
                        : p.status === "Completed"
                        ? ""
                        : "bg-red-50"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">{mxn(p.advance)}</td>
                <td className="px-4 py-3">{mxn(p.rent)}</td>
                <td className="px-4 py-3">{pct(p.irrAPR)}</td>
                <td className="px-4 py-3">{p.nextPayment}</td>
                <td className="px-4 py-3">
                  <StreamBadge status={p.stream} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="btn btn-ghost" onClick={() => onOpen(p)}>
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

function StreamBadge({ status }: { status: "Healthy" | "Delayed" | "Default" }) {
  const map = {
    Healthy: { label: "Healthy", cls: "bg-green-50 text-green-700 ring-green-200" },
    Delayed: { label: "Delayed", cls: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
    Default: { label: "Default", cls: "bg-red-50 text-red-700 ring-red-200" },
  };
  const s = map[status] || map.Healthy;
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}
