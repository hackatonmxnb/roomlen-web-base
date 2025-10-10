import React from "react";
import type { Portfolio } from "@/lib/investor/types";

interface CashflowStripProps {
  portfolio: Portfolio;
}

export function CashflowStrip({ portfolio }: CashflowStripProps) {
<<<<<<< Updated upstream
  const months = portfolio.cashflow || [];
=======
  // Use optional chaining and default to an empty array to prevent runtime errors
  const months = portfolio?.cashflow || [];

  // Return null if there's no data to display, preventing further errors
  if (months.length === 0) {
    return null;
  }

>>>>>>> Stashed changes
  const max = Math.max(...months.map((m) => m.income), 1);
  
  if (months.length === 0) {
    return (
      <section className="mt-6 card">
        <div className="text-center py-8 text-slate-500">
          No cashflow data available
        </div>
      </section>
    );
  }
  
  return (
    <section className="mt-6 card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Projected monthly income</div>
          <div className="text-sm text-slate-600">Next 12 months</div>
        </div>
        <div className="pill">Assumes on-time streams</div>
      </div>
      <div className="mt-3 h-24 w-full relative">
        <svg viewBox={`0 0 ${months.length * 40} 100`} className="w-full h-full">
          {months.map((m, i) => {
            const h = (m.income / max) * 90 + 2;
            return (
              <rect
                key={i}
                x={i * 40 + 6}
                y={100 - h}
                width={24}
                height={h}
                rx={6}
                fill={"#1297C8"}
                opacity={0.85}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}
