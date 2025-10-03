// Type definitions for the investor dashboard

export interface Position {
  id: string;
  property: string;
  location: string;
  advance: number;
  rent: number;
  termMonths: number;
  irrAPR: number;
  nextPayment: string;
  stream: "Healthy" | "Delayed" | "Default";
  status: "Active" | "Completed" | "Default";
  tenantScore?: string;
  propertyScore?: string;
  esignHash?: string;
  attestations?: number;
  streamStatus?: string;
}

export interface Offer {
  id: string;
  property: string;
  location: string;
  advance: number;
  rent: number;
  irrAPR: number;
  termMonths: number;
  ocPct: number;
  haircutPct: number;
  chain: string;
  currency: string;
  riskTier: string;
  tenantScore?: string;
  propertyScore?: string;
  esignHash?: string;
  attestations?: number;
}

export interface Portfolio {
  invested: number;
  monthlyIncome: number;
  netIRR: number;
  active: number;
  cashflow: Array<{ month: number; income: number }>;
}

export interface Filters {
  tier: string;
  term: string;
}
