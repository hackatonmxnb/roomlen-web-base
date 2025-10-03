// Utility functions for the investor dashboard

import type { Position, Portfolio } from "./types";

export function mxn(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function pct(x: number): string {
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(1) + "%";
}

export function summarize(positions: Position[]): Portfolio {
  const active = positions.filter((p) => p.status === "Active");
  const invested = active.reduce((s, p) => s + p.advance, 0);
  const monthlyIncome = active.reduce((s, p) => s + p.rent, 0);
  const netIRR = avg(active.map((p) => p.irrAPR));
  const cashflow = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: monthlyIncome,
  }));
  return { invested, monthlyIncome, netIRR, active: active.length, cashflow };
}

function avg(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}
