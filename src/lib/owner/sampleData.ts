// Sample data for the owner dashboard

import type { Lease, Advance, OwnerOffer, OwnerTask } from './types';

export const SAMPLE_LEASES: Lease[] = [
  {
    id: "l1",
    property: "Loft Reforma 210",
    location: "CDMX • Juárez",
    tenant: "A. Pérez",
    rent: 10000,
    dueDay: "28th",
    escrow: "Healthy",
    status: "Ready",
    termMonths: 12,
    tenantScore: "A-",
    propertyScore: "A",
    esignHash: "0x7a...e2",
    attestations: 4
  },
  {
    id: "l2",
    property: "Depto Roma Nte 88",
    location: "CDMX • Roma",
    tenant: "M. López",
    rent: 8000,
    dueDay: "19th",
    escrow: "Healthy",
    status: "Ready",
    termMonths: 12,
    tenantScore: "B+",
    propertyScore: "A-",
    esignHash: "0x3f...91",
    attestations: 3
  },
  {
    id: "l3",
    property: "Casa Lomas 34",
    location: "CDMX • Lomas",
    tenant: "C. Ruiz",
    rent: 12000,
    dueDay: "03rd",
    escrow: "Delayed",
    status: "Ready",
    termMonths: 10,
    tenantScore: "A",
    propertyScore: "A",
    esignHash: "0x9b...c4",
    attestations: 5
  }
];

export const SAMPLE_ROOMFI_LEASES: Lease[] = [
  {
    id: "l1",
    property: "Loft Reforma 210",
    location: "CDMX • Juárez",
    tenant: "A. Pérez",
    rent: 10000,
    dueDay: "28th",
    escrow: "Healthy",
    status: "Ready",
    termMonths: 12,
    tenantScore: "A-",
    propertyScore: "A",
    esignHash: "0x7a...e2",
    attestations: 4,
    onTimeRatio: 0.96,
    rentToIncome: 0.28,
    depositMonths: 1,
    docsQuality: 0.92,
    marketIndex: 0.85
  },
  {
    id: "l2",
    property: "Depto Roma Nte 88",
    location: "CDMX • Roma",
    tenant: "M. López",
    rent: 8000,
    dueDay: "19th",
    escrow: "Healthy",
    status: "Ready",
    termMonths: 12,
    tenantScore: "B+",
    propertyScore: "A-",
    esignHash: "0x3f...91",
    attestations: 3,
    onTimeRatio: 0.88,
    rentToIncome: 0.34,
    depositMonths: 1,
    docsQuality: 0.9,
    marketIndex: 0.8
  },
  {
    id: "l3",
    property: "Casa Lomas 34",
    location: "CDMX • Lomas",
    tenant: "C. Ruiz",
    rent: 12000,
    dueDay: "03rd",
    escrow: "Delayed",
    status: "Ready",
    termMonths: 10,
    tenantScore: "A",
    propertyScore: "A",
    esignHash: "0x9b...c4",
    attestations: 5,
    onTimeRatio: 0.9,
    rentToIncome: 0.36,
    depositMonths: 0,
    docsQuality: 0.82,
    marketIndex: 0.78
  }
];

export const SAMPLE_ADVANCES: Advance[] = [
  {
    id: "a1",
    amount: 89243,
    property: "Loft Reforma 210",
    location: "Juárez",
    fundedOn: "12 Sep",
    remaining: 9,
    ocPct: 10,
    haircutPct: 10,
    stream: "Healthy",
    termMonths: 12,
    rent: 10000
  },
  {
    id: "a2",
    amount: 118000,
    property: "Casa Lomas 34",
    location: "Lomas",
    fundedOn: "02 Aug",
    remaining: 6,
    ocPct: 12,
    haircutPct: 8,
    stream: "Delayed",
    termMonths: 10,
    rent: 12000
  }
];

export const SAMPLE_OWNER_OFFERS: OwnerOffer[] = [
  {
    id: "of1",
    property: "PH Coyoacán 12",
    location: "Coyoacán",
    advance: 81200,
    irrAPR: 0.61,
    termMonths: 12,
    ocPct: 10,
    haircutPct: 10,
    fees: 1.0,
    chain: "Base",
    riskTier: "A",
    rent: 9000,
    tenantScore: "A-",
    propertyScore: "A",
    esignHash: "0x7a...e2",
    attestations: 4
  },
  {
    id: "of2",
    property: "Loft Condesa 5",
    location: "Condesa",
    advance: 65600,
    irrAPR: 0.72,
    termMonths: 9,
    ocPct: 12,
    haircutPct: 8,
    fees: 1.2,
    chain: "Base",
    riskTier: "B",
    rent: 7000,
    tenantScore: "B+",
    propertyScore: "A-",
    esignHash: "0x3f...91",
    attestations: 3
  }
];

export const SAMPLE_OWNER_TASKS: OwnerTask[] = [
  {
    title: "Invite tenant to e‑sign",
    desc: "Send signature link for Lease 210 – Juárez",
    cta: "Send",
    color: "var(--rf-blue)"
  },
  {
    title: "Connect payout account",
    desc: "Bank ****1234 for advance disbursement",
    cta: "Connect",
    color: "var(--rf-green)"
  },
  {
    title: "Upload lease addendum",
    desc: "Update indexation clause (PDF)",
    cta: "Upload",
    color: "var(--rf-blueTeal)"
  }
];
