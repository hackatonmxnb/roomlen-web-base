// Type definitions for the owner dashboard

export interface Lease {
  id: string;
  property: string;
  location: string;
  tenant: string;
  rent: number;
  dueDay: string;
  escrow: "Healthy" | "Delayed" | "Default";
  status: "Active" | "Pending" | "Closed" | "Ready" | "Escrow active";
  termMonths: number;
  tenantScore?: string;
  propertyScore?: string;
  esignHash?: string;
  attestations?: number;
  // AI scoring fields
  onTimeRatio?: number;
  rentToIncome?: number;
  depositMonths?: number;
  docsQuality?: number;
  marketIndex?: number;
  // Flow fields
  imported?: boolean;
  docs?: boolean;
}

export interface Advance {
  id: string;
  amount: number;
  property: string;
  location: string;
  fundedOn: string;
  remaining: number;
  ocPct: number;
  haircutPct: number;
  stream: "Healthy" | "Delayed" | "Default";
  termMonths?: number;
  rent?: number;
}

export interface OwnerOffer {
  id: string;
  property: string;
  location: string;
  advance: number;
  irrAPR: number;
  termMonths: number;
  ocPct: number;
  haircutPct: number;
  fees: number;
  chain: string;
  riskTier: string;
  rent: number;
  tenantScore?: string;
  propertyScore?: string;
  esignHash?: string;
  attestations?: number;
}

export interface OwnerKPIs {
  totalAdvance: number;
  nextDue: string;
  onTimeRate: number;
  activeLeases: number;
}

export interface OwnerTask {
  title: string;
  desc: string;
  cta: string;
  color: string;
}

export interface NewAdvanceForm {
  property: string;
  location: string;
  tenant: string;
  rent: number;
  termMonths: number;
  discountMonthlyPct: number;
  haircutPct: number;
  ocPct: number;
}

export interface AdvanceCalculation {
  PV: number;
  advance: number;
}
