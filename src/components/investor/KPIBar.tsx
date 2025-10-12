import React from "react";
import { mxn, pct } from "@/lib/investor/utils";
import type { Portfolio } from "@/lib/investor/types";
import { InvestorHelpTooltip, INVESTOR_TERMS } from "./InvestorHelpTooltip";

interface KPIBarProps {
  portfolio: Portfolio;
}

export function KPIBar({ portfolio }: KPIBarProps) {
  const items = [
    {
      label: "Total Invested",
      value: mxn(portfolio.invested),
      icon: "💰",
      tooltip: INVESTOR_TERMS.invested,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      label: "Monthly Income",
      value: mxn(portfolio.monthlyIncome),
      icon: "📈",
      tooltip: INVESTOR_TERMS.monthlyIncome,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      label: "Net IRR (est.)",
      value: pct(portfolio.netIRR),
      icon: "🎯",
      tooltip: INVESTOR_TERMS.netIRR,
      gradient: "from-purple-500 to-pink-600"
    },
    {
      label: "Active Deals",
      value: String(portfolio.active),
      icon: "🏘️",
      tooltip: INVESTOR_TERMS.activeDeals,
      gradient: "from-orange-500 to-red-600"
    },
  ];

  return (
    <section className="grid md:grid-cols-4 gap-4 mb-6">
      {items.map((k, i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:ring-2 hover:ring-[#1297C8] transition-all p-5">
          {/* Background gradient accent */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${k.gradient} opacity-10 rounded-full blur-2xl`}></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="text-lg">{k.icon}</span>
                {k.label}
                <InvestorHelpTooltip {...k.tooltip} />
              </div>
            </div>
            <div className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r ${k.gradient} bg-clip-text text-transparent`}>
              {k.value}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
