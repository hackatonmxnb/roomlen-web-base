// Utility functions for the owner dashboard

import type { Lease, Advance, OwnerKPIs, NewAdvanceForm, AdvanceCalculation } from './types';

// Format currency in Mexican Pesos
export function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return (value * 100).toFixed(1) + "%";
}

// Compute KPIs from leases and advances
export function computeKPIs({ leases, advances }: { leases: Lease[]; advances: Advance[] }): OwnerKPIs {
  const activeLeases = leases.filter(l => l.status !== "Closed");
  const nextDue = activeLeases.length ? `${activeLeases[0].dueDay} of month` : "—";
  const totalAdvance = advances.reduce((s, a) => s + a.amount, 0);
  const onTimeRate = 0.93; // placeholder - would be calculated from actual payment data
  return { totalAdvance, nextDue, onTimeRate, activeLeases: activeLeases.length };
}

// Calculate advance amount based on form parameters
export function calculateAdvance(form: NewAdvanceForm): AdvanceCalculation {
  const r = Math.max(0, Number(form.discountMonthlyPct)) / 100;
  const R = Math.max(0, Number(form.rent));
  const n = Math.max(1, Math.floor(Number(form.termMonths)));
  
  // Calculate present value of rent stream
  let PV = 0;
  for (let t = 1; t <= n; t++) {
    PV += R / Math.pow(1 + r, t);
  }
  
  // Apply haircut and over-collateralization
  const advance = (PV * (1 - form.haircutPct / 100)) / (1 + form.ocPct / 100);
  
  return { PV, advance };
}

// Bisection solver for IRR (monthly)
export function bisectionIRR(R: number, n: number, advance: number): number {
  let lo = 0, hi = 1; // 0%..100% monthly
  const f = (x: number) => {
    let s = 0;
    for (let t = 1; t <= n; t++) {
      s += R / Math.pow(1 + x, t);
    }
    return s - advance;
  };
  
  // Expand hi if needed
  while (f(hi) > 0 && hi < 5) hi *= 1.5; // up to 500% monthly guard
  
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const val = f(mid);
    if (Math.abs(val) < 1e-7) return mid;
    if (val > 0) lo = mid; else hi = mid;
  }
  
  return (lo + hi) / 2;
}
