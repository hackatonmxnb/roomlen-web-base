<<<<<<< Updated upstream
"use client";

import React, { useMemo, useState } from "react";
import { TopbarOwner } from "@/components/owner/TopbarOwner";
import { ActiveAdvanceCard } from "@/components/owner/ActiveAdvanceCard";
import { PropertiesCard } from "@/components/owner/PropertiesCard";
import { OffersCard } from "@/components/owner/OffersCard";
import { TipsCard } from "@/components/owner/TipsCard";
import { AdvanceFlowModal } from "@/components/owner/AdvanceFlowModal";
import { Footer } from "@/components/owner/Footer";
import { SAMPLE_ROOMFI_LEASES } from "@/lib/owner/sampleData";
import type { Lease, Advance, OwnerOffer } from "@/lib/owner/types";

// RoomLen — Owner Dashboard (Simplified MVP)
// Focused, mobile-first flow with AI scoring

export default function OwnerDashboard() {
  const [leases, setLeases] = useState(SAMPLE_ROOMFI_LEASES);
  const [activeAdvance, setActiveAdvance] = useState<Advance | null>(null);
  const [offers, setOffers] = useState<OwnerOffer[]>([]);
  const [flow, setFlow] = useState({ 
    open: false, 
    step: 1, 
    lease: null as Lease | null, 
    ai: null as any, 
    published: false, 
    busy: false 
  });

  // Actions
  function openFlow(lease: Lease) {
    setFlow({ open: true, step: 1, lease, ai: null, published: false, busy: false });
  }

  function closeFlow() { 
    setFlow({ open: false, step: 1, lease: null, ai: null, published: false, busy: false }); 
  }

  function importFromRoomFi() {
    if (!flow.lease) return;
    setFlow((f) => ({ ...f, lease: { ...f.lease!, imported: true, docs: true } }));
  }

  function runAI() {
    if (!flow.lease) return;
    const l = flow.lease;
    const inputs = {
      rentMXN: l.rent,
      termMonths: l.termMonths,
      monthlyDiscPct: 1.5,
      onTimeRatio: l.onTimeRatio ?? 0.9,
      rentToIncome: l.rentToIncome ?? 0.32,
      depositMonths: l.depositMonths ?? 1,
      docsQuality: l.docsQuality ?? 0.9,
      marketIndex: l.marketIndex ?? 0.8,
      currencyMismatch: false,
    };
    const priced = scoreAndPrice(inputs);
    setFlow((f) => ({ ...f, ai: priced }));
  }

  function publishToMarketplace() {
    if (!flow.ai || !flow.lease) return;
    setFlow((f) => ({ ...f, busy: true }));
    
    setTimeout(() => {
      const base = flow.ai;
      const offer: OwnerOffer = {
        id: `of_${Date.now()}`,
        property: flow.lease!.property,
        location: flow.lease!.location,
        advance: Math.round(base.advance),
        irrAPR: base.irrAPR / 100,
        termMonths: flow.lease!.termMonths,
        ocPct: base.ocPct,
        haircutPct: base.haircutPct,
        fees: 1.0,
        chain: "Base",
        riskTier: base.tier,
        rent: flow.lease!.rent,
      };
      setOffers((prev) => [offer, ...prev]);
      setFlow((f) => ({ ...f, published: true, busy: false }));
    }, 900);
  }

  function acceptOffer(offer: OwnerOffer) {
    setActiveAdvance({
      id: offer.id,
      amount: offer.advance,
      property: offer.property,
      location: offer.location,
      fundedOn: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      remaining: offer.termMonths,
      ocPct: offer.ocPct,
      haircutPct: offer.haircutPct,
      stream: "Healthy",
      termMonths: offer.termMonths,
      rent: offer.rent,
    });
    
    setLeases((prev) => prev.map((l) => 
      l.id === offer.id ? { ...l, status: "Escrow active" } : l
    ));
    
    setOffers((prev) => prev.filter((x) => x.id !== offer.id));
  }

  function earlySettle() {
    setActiveAdvance(null);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopbarOwner />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActiveAdvanceCard 
              advance={activeAdvance} 
              leases={leases} 
              onEarlySettle={earlySettle} 
            />
            <PropertiesCard 
              leases={leases} 
              onGetAdvance={openFlow} 
            />
          </div>
          <div className="space-y-6">
            <OffersCard 
              offers={offers} 
              onAccept={acceptOffer} 
            />
            <TipsCard />
          </div>
        </div>
      </main>

      {flow.open && (
        <AdvanceFlowModal
          flow={flow}
          setFlow={setFlow}
          onClose={closeFlow}
          onImport={importFromRoomFi}
          onRunAI={runAI}
          onPublish={publishToMarketplace}
        />
      )}

      <Footer />
=======
'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/lib/WalletProvider';
import WalletConnect from '@/components/WalletConnect';

// --- ABI Y DIRECCIÓN DEL CONTRATO ---
const VRA_NFT_ABI = [
    "function mint(address owner, string memory tokenURI, uint96 rentAmount, uint16 termMonths, uint8 tenantScore) returns (uint256)"
];
const VRA_NFT_ADDRESS = '0x1acB65533d0f5DBB99D6F3c30AcAd0A5499325c2'; // VerifiableRentalAgreementNFT

// --- TIPOS Y DATOS DE EJEMPLO ---
type PropertyStatus = 'Ready' | 'Not Ready';
interface Property {
  id: number;
  name: string;
  location: string;
  rent: number;
  status: PropertyStatus;
}

const mockProperties: Property[] = [
  { id: 1, name: 'Loft Reforma 210', location: 'CDMX • Juárez', rent: 10000, status: 'Ready' },
  { id: 2, name: 'Depto Roma Nte 88', location: 'CDMX • Roma', rent: 8000, status: 'Not Ready' },
  { id: 3, name: 'Casa Lomas 34', location: 'CDMX • Lomas', rent: 12000, status: 'Ready' },
];

// --- SUB-COMPONENTES DE LA UI ---

const TipsCard = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
    <h3 className="font-semibold text-lg text-slate-800">Tips</h3>
    <ul className="mt-3 space-y-3 text-sm text-slate-600 list-disc list-inside">
      <li>Upload the full lease PDF with signatures to speed up the AI score.</li>
      <li>Security deposit helps lower OC; renewals improve on-time score.</li>
      <li>Keep tenant contact updated for smooth rent streaming.</li>
    </ul>
  </div>
);

const OffersCard = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
    <h3 className="font-semibold text-lg text-slate-800">Offers <span className="text-sm text-slate-500 font-normal ml-1">0 new</span></h3>
    <p className="mt-2 text-sm text-slate-600 text-center py-4">No offers yet. Publish a lease to the marketplace.</p>
  </div>
);

const ActiveAdvanceCard = () => (
  <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
    <div className="font-semibold">No active advance</div>
    <div className="text-sm text-slate-600">Import a lease and request an advance to get started.</div>
  </section>
);

const Header = () => (
  <header className="bg-white ring-1 ring-slate-200">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
        <img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-14 w-auto" />
      </a>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-bold text-slate-800">Owner</div>
          <div className="text-xs text-slate-500">KYC ✓ • Payout: CLABE ****1234</div>
        </div>
        <WalletConnect />
      </div>
    </div>
  </header>
);

const TokenizeModal = ({ prop, onClose, onConfirm }: { prop: Property; onClose: () => void; onConfirm: (tokenURI: string, tenantScore: number) => void; }) => {
    const [tokenURI, setTokenURI] = useState('ipfs://example-uri');
    const [tenantScore, setTenantScore] = useState(85);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full space-y-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-900">Tokenize Lease: {prop.name}</h2>
                <div>
                    <label htmlFor="tokenURI" className="block text-sm font-medium text-slate-700">Token URI</label>
                    <input type="text" name="tokenURI" value={tokenURI} onChange={(e) => setTokenURI(e.target.value)} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    <p className="mt-2 text-xs text-slate-500">Link to off-chain metadata (IPFS, Arweave, etc.).</p>
                </div>
                <div>
                    <label htmlFor="tenantScore" className="block text-sm font-medium text-slate-700">Tenant Score (0-100)</label>
                    <input type="number" name="tenantScore" value={tenantScore} onChange={(e) => setTenantScore(parseInt(e.target.value, 10))} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="btn-outline ring-slate-300 hover:ring-slate-400">Cancel</button>
                    <button onClick={() => onConfirm(tokenURI, tenantScore)} className="btn bg-blue-600 hover:bg-blue-700">Confirm & Tokenize</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---

export default function OwnerDashboardPage() {
  const { isConnected, signer, account } = useWallet();
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txInfo, setTxInfo] = useState<{ hash?: string; error?: string }>({});

  const handleOpenTokenizeModal = (prop: Property) => {
    setSelectedProp(prop);
    setIsModalOpen(true);
    setTxInfo({});
  };

  const handleTokenizeConfirm = async (tokenURI: string, tenantScore: number) => {
    if (!signer || !account || !selectedProp) return;

    setIsLoading(true);
    setTxInfo({});

    try {
        const contract = new ethers.Contract(VRA_NFT_ADDRESS, VRA_NFT_ABI, signer);
        const rentAmount = ethers.parseUnits(selectedProp.rent.toString(), 18); // Asumiendo 18 decimales
        
        const tx = await contract.mint(account, tokenURI, rentAmount, 12, tenantScore); // Hardcoding termMonths a 12 por ahora
        setTxInfo({ hash: tx.hash });
        await tx.wait();

        // Actualizar UI en tiempo real
        setProperties(prev => prev.map(p => p.id === selectedProp.id ? { ...p, status: 'Ready' } : p));
        setIsModalOpen(false);

    } catch (err: any) {
        console.error("Tokenization failed:", err);
        setTxInfo({ error: err.reason || 'Transaction failed.' });
    } finally {
        setIsLoading(false);
    }
  };

  const renderDashboard = () => (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActiveAdvanceCard />
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Your properties</div>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">{properties.length} total</span>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {properties.map(prop => (
                  <div key={prop.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{prop.name}</div>
                      <div className="text-slate-600 text-sm">{prop.location} • Rent ${prop.rent.toLocaleString()} / mo</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 ${prop.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{prop.status}</span>
                      {prop.status === 'Ready' ? (
                          <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white">Get advance</button>
                      ) : (
                          <button onClick={() => handleOpenTokenizeModal(prop)} className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-blue-600 text-white">Tokenize</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="space-y-6">
            <OffersCard />
            <TipsCard />
          </div>
        </div>
        { (txInfo.hash || txInfo.error) && (
            <div className={`mt-6 p-4 rounded-xl ${txInfo.hash ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="font-semibold">{txInfo.hash ? 'Transaction Sent!' : 'Error'}</p>
                {txInfo.hash ? <a href={`https://paseo.moonscan.io/tx/${txInfo.hash}`} target="_blank" rel="noopener noreferrer" className="text-sm break-all underline">View on Moonscan: {txInfo.hash}</a> : <p className="text-sm">{txInfo.error}</p>}
            </div>
        )}
      </main>
      <Footer />
      {isModalOpen && selectedProp && <TokenizeModal prop={selectedProp} onClose={() => setIsModalOpen(false)} onConfirm={handleTokenizeConfirm} />}
    </>
  );

  const renderConnectMessage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-20 w-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-800">Owner Dashboard</h2>
        <p className="mt-2 text-slate-600">Please connect your wallet to continue.</p>
        <div className="mt-6"><WalletConnect /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
        {isConnected ? renderDashboard() : renderConnectMessage()}
>>>>>>> Stashed changes
    </div>
  );
}

<<<<<<< Updated upstream
// Risk engine (fixed tiers)
function scoreAndPrice(i: any) {
  const s =
    30 * Math.min(1, i.onTimeRatio) +
    20 * (1 - Math.min(1, i.rentToIncome)) +
    10 * Math.min(1, i.depositMonths / 2) +
    10 * (i.termMonths <= 12 ? 1 : Math.max(0, 1 - (i.termMonths - 12) / 12)) +
    20 * Math.min(1, i.docsQuality) +
    10 * Math.min(1, i.marketIndex);

  const tier = s >= 80 ? "A" : s >= 60 ? "B" : s >= 40 ? "C" : "REJECT";
  if (tier === "REJECT") return { tier, reason: "Low score", score: Math.round(s) };

  let haircut = tier === "A" ? 0.10 : tier === "B" ? 0.15 : 0.22;
  let oc = tier === "A" ? 0.08 : tier === "B" ? 0.12 : 0.16;

  if (i.depositMonths >= 1) oc = Math.max(0.06, oc - 0.02);
  if (i.termMonths > 12) haircut += 0.03;
  if (i.docsQuality < 0.8) haircut += 0.03;
  if (i.currencyMismatch) haircut += 0.02;

  const r = i.monthlyDiscPct / 100;
  const PV = i.rentMXN * (1 - Math.pow(1 + r, -i.termMonths)) / r;
  const advance = (PV * (1 - haircut)) / (1 + oc);

  const irrMonthly = solveIRRMonthly(-advance, i.rentMXN, i.termMonths);
  const irrAPR = Math.pow(1 + irrMonthly, 12) - 1;

  return {
    tier,
    score: Math.round(s),
    haircutPct: +(haircut * 100).toFixed(1),
    ocPct: +(oc * 100).toFixed(1),
    PV: Math.round(PV),
    advance: Math.round(advance),
    irrAPR: +(irrAPR * 100).toFixed(1),
  };
}

function solveIRRMonthly(negAdvance: number, rent: number, n: number) {
  let lo = 0.0001, hi = 0.2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const pv = rent * (1 - Math.pow(1 + mid, -n)) / mid;
    (pv + negAdvance > 0) ? lo = mid : hi = mid;
  }
  return (lo + hi) / 2;
}
=======
const Footer = () => (
    <footer className="py-10 text-center text-sm text-slate-500">© {new Date().getFullYear()} RoomLen — Owner dashboard</footer>
);
>>>>>>> Stashed changes
