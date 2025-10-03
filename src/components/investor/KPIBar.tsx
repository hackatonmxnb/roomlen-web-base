import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Portfolio } from "@/lib/investor/types";

interface KPIBarProps {
  portfolio: Portfolio;
}

export function KPIBar({ portfolio }: KPIBarProps) {
  const items = [
    { label: "Invested", value: mxn(portfolio.invested) },
    { label: "Monthly income", value: mxn(portfolio.monthlyIncome) },
    { label: "Net IRR (est.)", value: pct(portfolio.netIRR) },
    { label: "Active deals", value: String(portfolio.active) },
  ];
  
  return (
    <section className="grid md:grid-cols-4 gap-4">
      {items.map((k, i) => (
        <div key={i} className="card">
          <div className="text-sm text-slate-600">{k.label}</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">
            {k.value}
          </div>
        </div>
      ))}
    </section>
  );
}
