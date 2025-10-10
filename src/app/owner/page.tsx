'use client';

import React, { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/lib/WalletProvider';
import WalletConnect from '@/components/WalletConnect';

// --- ABI Y DIRECCIÓN DEL CONTRATO (Placeholder) ---
const VRA_NFT_ABI = ["function mint(address owner, string memory tokenURI, uint96 rentAmount, uint16 termMonths, uint8 tenantScore) returns (uint256)"];
const VRA_NFT_ADDRESS = '0x1acB65533d0f5DBB99D6F3c30AcAd0A5499325c2';

// --- TIPOS DE DATOS ---
type TLeaseStatus = 'Not Tokenized' | 'Tokenized' | 'Escrow Active';
interface Lease {
  id: string; property: string; location: string; rent: number; status: TLeaseStatus; termMonths: number;
  onTimeRatio?: number; rentToIncome?: number; depositMonths?: number; docsQuality?: number; marketIndex?: number;
}
interface Advance { id: string; amount: number; property: string; location: string; fundedOn: string; remaining: number; ocPct: number; haircutPct: number; stream: string; termMonths: number; rent: number; }
interface OwnerOffer { id: string; property: string; location: string; advance: number; irrAPR: number; termMonths: number; ocPct: number; haircutPct: number; fees: number; chain: string; riskTier: string; rent: number; }

// --- DATOS DE EJEMPLO ---
const SAMPLE_LEASES: Lease[] = [
    { id: 'L001', property: 'Loft Reforma 210', location: 'CDMX • Juárez', rent: 10000, status: 'Tokenized', termMonths: 12, onTimeRatio: 1, rentToIncome: 0.3, depositMonths: 2, docsQuality: 0.95, marketIndex: 0.9 },
    { id: 'L002', property: 'Depto Roma Nte 88', location: 'CDMX • Roma', rent: 8000, status: 'Not Tokenized', termMonths: 12, onTimeRatio: 0.95, rentToIncome: 0.4, depositMonths: 1, docsQuality: 0.8, marketIndex: 0.85 },
    { id: 'L003', property: 'Casa Lomas 34', location: 'CDMX • Lomas', rent: 12000, status: 'Tokenized', termMonths: 18, onTimeRatio: 0.98, rentToIncome: 0.25, depositMonths: 1, docsQuality: 0.9, marketIndex: 0.95 },
];

// --- COMPONENTES DE UI ---

const Header = () => (
    <header className="bg-white ring-1 ring-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition"><img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-14 w-auto" /></a>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block"><div className="font-bold text-slate-800">Owner</div><div className="text-xs text-slate-500">KYC ✓ • Payout: CLABE ****1234</div></div>
                <WalletConnect />
            </div>
        </div>
    </header>
);

const ActiveAdvanceCard = ({ advance }: { advance: Advance | null }) => {
    if (!advance) return (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="font-semibold">No active advance</div><div className="text-sm text-slate-600">Import a lease and request an advance to get started.</div></section>
    );
    return <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="font-semibold text-lg">Active Advance</h3>{/* UI for active advance... */}</section>;
};

const PropertiesCard = ({ leases, onGetAdvance, onTokenize }: { leases: Lease[], onGetAdvance: (lease: Lease) => void, onTokenize: (lease: Lease) => void }) => (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between"><div className="font-semibold">Your properties</div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">{leases.length} total</span></div>
        <div className="mt-4 divide-y divide-slate-100">
            {leases.map(lease => (
                <div key={lease.id} className="py-3 flex items-center justify-between gap-3">
                    <div><div className="font-medium">{lease.property}</div><div className="text-slate-600 text-sm">{lease.location} • Rent ${lease.rent.toLocaleString()} / mo</div></div>
                    <div className="flex items-center gap-2">
                         <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${lease.status === 'Tokenized' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{lease.status}</span>
                        {lease.status === 'Tokenized' ? <button onClick={() => onGetAdvance(lease)} className="btn-sm bg-green-600 text-white">Get advance</button> : <button onClick={() => onTokenize(lease)} className="btn-sm bg-blue-600 text-white">Tokenize</button>}
                    </div>
                </div>
            ))}
        </div>
    </section>
);

const OffersCard = ({ offers }: { offers: OwnerOffer[] }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-lg text-slate-800">Offers <span className="text-sm text-slate-500 font-normal ml-1">{offers.length} new</span></h3>
        {offers.length === 0 ? <p className="mt-2 text-sm text-slate-600 text-center py-4">No offers yet.</p> : offers.map(offer => <div key={offer.id}> {/* UI for offer... */} </div>)}
    </div>
);

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

const TokenizePanel = ({ isOpen, onClose, onConfirm, lease }: { isOpen: boolean, onClose: () => void, onConfirm: (tokenURI: string, tenantScore: number) => Promise<void>, lease: Lease | null }) => {
    const [tokenURI, setTokenURI] = useState('ipfs://example-uri');
    const [tenantScore, setTenantScore] = useState(85);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        await onConfirm(tokenURI, tenantScore);
        setIsLoading(false);
    };

    return (
        <>
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
                <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
            </div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex-shrink-0 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900">Tokenize Lease</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">✕</button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">Property: <span className="font-semibold text-slate-800">{lease?.property}</span></div>
                    
                    {isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center">
                            <img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-24 w-auto animate-pulse" />
                            <p className="mt-4 text-slate-600 font-semibold">Tokenizing on the blockchain...</p>
                            <p className="text-sm text-slate-500">Please confirm the transaction in your wallet.</p>
                        </div>
                    ) : (
                        <div className="flex-grow mt-6 flex flex-col">
                            <div className="flex-grow space-y-6">
                                <div>
                                    <label htmlFor="tokenURI" className="block text-sm font-medium text-slate-700">Token URI</label>
                                    <input type="text" name="tokenURI" value={tokenURI} onChange={(e) => setTokenURI(e.target.value)} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                    <p className="mt-2 text-xs text-slate-500">This is the link to the off-chain metadata for your NFT (e.g., on IPFS).</p>
                                </div>
                                <div>
                                    <label htmlFor="tenantScore" className="block text-sm font-medium text-slate-700">Tenant Score (0-100)</label>
                                    <input type="number" name="tenantScore" value={tenantScore} onChange={(e) => setTenantScore(parseInt(e.target.value, 10))} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm" />
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-4">
                                <button onClick={handleConfirm} className="w-full btn bg-blue-600 hover:bg-blue-700 text-lg">Confirm & Tokenize</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const AdvanceFlowPanel = ({ flow, onClose, onImport, onRunAI, onPublish, onShowToast }: { flow: any, onClose: () => void, onImport: () => void, onRunAI: () => void, onPublish: () => void, onShowToast: (msg: string) => void }) => {
    const renderStepContent = () => {
        switch (flow.step) {
            case 'start':
                return (
                    <>
                        <h3 className="font-semibold text-lg">1. Import Data Source</h3>
                        <p className="mt-1 text-slate-600">To calculate an advance, first import your verified lease data.</p>
                        <div className="mt-4 space-y-4">
                            <a href="https://roomfi.netlify.app" target="_blank" rel="noopener noreferrer" onClick={onImport} className="block w-full text-left p-4 rounded-xl ring-2 ring-slate-200 hover:ring-blue-500 transition-all">
                                <div className="font-semibold">Connect with RoomFi</div>
                                <div className="text-sm text-slate-500">Connects with the RoomFi app to identify your rental agreement NFTs and use them for tokenization.</div>
                            </a>
                            <button onClick={() => onShowToast('Coming Soon: Upload and analyze your PDF contract.')} className="w-full text-left p-4 rounded-xl ring-1 ring-slate-200 hover:bg-slate-50">
                                <div className="font-semibold">Upload PDF</div>
                                <div className="text-sm text-slate-500">(Coming Soon) Upload your PDF contract for our AI to extract the data and tokenize the agreement.</div>
                            </button>
                        </div>
                    </>
                );
            case 'imported':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <h3 className="font-semibold text-lg">2. Run AI Pricing</h3>
                            <p className="mt-2 text-slate-600">Data has been imported. Now, run the RoomLen AI risk engine to calculate a potential advance.</p>
                        </div>
                        <div className="flex-shrink-0 pt-4">
                            <button onClick={onRunAI} className="w-full btn bg-green-600 hover:bg-green-700 text-lg">Estimate Advance with AI</button>
                        </div>
                    </div>
                );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-24 w-auto animate-pulse" />
                        <p className="mt-4 text-slate-600 font-semibold">Analyzing with AI...</p>
                    </div>
                );
            case 'result':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <h3 className="font-semibold text-lg">3. Review & Publish</h3>
                            {flow.ai ? (
                                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-slate-100 rounded-xl"><div className="text-sm text-slate-500">Risk Tier</div><div className="font-bold text-2xl">{flow.ai.tier}</div></div>
                                    <div className="p-4 bg-slate-100 rounded-xl"><div className="text-sm text-slate-500">AI Score</div><div className="font-bold text-2xl">{flow.ai.score}</div></div>
                                    <div className="p-4 bg-green-100 text-green-800 rounded-xl col-span-2"><div className="text-sm">Estimated Advance</div><div className="font-bold text-3xl">${flow.ai.advance.toLocaleString()}</div></div>
                                </div>
                            ) : <p>Loading results...</p>}
                        </div>
                        <div className="flex-shrink-0 pt-4">
                            <p className="text-xs text-slate-500 mb-4">This is an estimate. By publishing, you agree to list this advance on the RoomLen marketplace.</p>
                            <button onClick={onPublish} className="w-full btn bg-blue-600 hover:bg-blue-700 text-lg">Publish to Marketplace</button>
                        </div>
                    </div>
                );
            case 'published':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h3 className="font-semibold text-xl text-green-700">Published!</h3>
                        <p className="mt-2 text-slate-600">Your advance request is now live on the marketplace.</p>
                        <button onClick={onClose} className="mt-6 btn-outline">Close</button>
                    </div>
                );
            default: return <p>Unknown step</p>;
        }
    };

    return (
        <>
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${flow.open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
                <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
            </div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${flow.open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex-shrink-0 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900">Get Advance</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">✕</button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">Property: <span className="font-semibold text-slate-800">{flow.lease?.property}</span></div>
                    <div className="mt-6 flex-grow relative">
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

const Toast = ({ message, show }: { message: string, show: boolean }) => {
    if (!show) return null;
    return (
        <div className="fixed top-5 right-5 bg-slate-800 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce">
            {message}
        </div>
    );
};

const Footer = () => <footer className="py-10 text-center text-sm text-slate-500">© {new Date().getFullYear()} RoomLen — Owner dashboard</footer>;

// --- COMPONENTE PRINCIPAL ---
export default function OwnerDashboardPage() {
    const { isConnected, signer, account } = useWallet();
    const [leases, setLeases] = useState<Lease[]>(SAMPLE_LEASES);
    const [activeAdvance, setActiveAdvance] = useState<Advance | null>(null);
    const [offers, setOffers] = useState<OwnerOffer[]>([]);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [txInfo, setTxInfo] = useState<{ hash?: string; error?: string }>({});

    // State for Tokenize flow
    const [tokenizeFlow, setTokenizeFlow] = useState({ isOpen: false, lease: null as Lease | null });

    // State for Get Advance flow
    const [advanceFlow, setAdvanceFlow] = useState({ open: false, step: 'start' as 'start' | 'imported' | 'loading' | 'result' | 'published', lease: null as Lease | null, ai: null as any });

    const showToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // --- Tokenize Handlers ---
    function openTokenizePanel(lease: Lease) { setTokenizeFlow({ isOpen: true, lease }); }
    function closeTokenizePanel() { setTokenizeFlow({ isOpen: false, lease: null }); }
    async function handleTokenizeConfirm(tokenURI: string, tenantScore: number) {
        if (!signer || !account || !tokenizeFlow.lease) return;
        setTxInfo({});
        try {
            const contract = new ethers.Contract(VRA_NFT_ADDRESS, VRA_NFT_ABI, signer);
            const rentAmount = ethers.parseUnits(tokenizeFlow.lease.rent.toString(), 18);
            const tx = await contract.mint(account, tokenURI, rentAmount, 12, tenantScore);
            setTxInfo({ hash: tx.hash });
            await tx.wait();
            setLeases(prev => prev.map(l => l.id === tokenizeFlow.lease?.id ? { ...l, status: 'Tokenized' } : l));
            closeTokenizePanel();
        } catch (err: any) {
            console.error("Tokenization failed:", err);
            setTxInfo({ error: err.reason || 'Transaction failed.' });
            // Keep panel open on error so user can retry
        }
    }

    // --- Advance Handlers ---
    function openAdvanceFlow(lease: Lease) { setAdvanceFlow({ open: true, step: 'start', lease, ai: null }); }
    function closeAdvanceFlow() { setAdvanceFlow({ open: false, step: 'start', lease: null, ai: null }); }
    function handleImport() {
        setTimeout(() => setAdvanceFlow(f => ({ ...f, step: 'imported' })), 500);
    }
    function runAIWithLoading() {
        if (!advanceFlow.lease) return;
        setAdvanceFlow(f => ({ ...f, step: 'loading' }));
        setTimeout(() => {
            const l = advanceFlow.lease!;
            const inputs = { rentMXN: l.rent, termMonths: l.termMonths, monthlyDiscPct: 1.5, onTimeRatio: l.onTimeRatio ?? 0.9, rentToIncome: l.rentToIncome ?? 0.32, depositMonths: l.depositMonths ?? 1, docsQuality: l.docsQuality ?? 0.9, marketIndex: l.marketIndex ?? 0.8, currencyMismatch: false };
            const priced = scoreAndPrice(inputs);
            setAdvanceFlow(f => ({ ...f, ai: priced, step: 'result' }));
        }, 3000);
    }
    function publishToMarketplace() {
        if (!advanceFlow.ai || !advanceFlow.lease) return;
        setAdvanceFlow(f => ({ ...f, step: 'published' }));
    }

    const renderDashboard = () => (
        <>
            <Header />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ActiveAdvanceCard advance={activeAdvance} />
                        <PropertiesCard leases={leases} onGetAdvance={openAdvanceFlow} onTokenize={openTokenizePanel} />
                        { (txInfo.hash || txInfo.error) && (
                            <div className={`mt-6 p-4 rounded-xl ${txInfo.hash ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                <p className="font-semibold">{txInfo.hash ? 'Transaction Sent!' : 'Error'}</p>
                                {txInfo.hash ? <a href={`https://paseo.moonscan.io/tx/${txInfo.hash}`} target="_blank" rel="noopener noreferrer" className="text-sm break-all underline">View on Moonscan: {txInfo.hash}</a> : <p className="text-sm">{txInfo.error}</p>}
                            </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        <OffersCard offers={offers} />
                        <TipsCard />
                    </div>
                </div>
            </main>
            <TokenizePanel isOpen={tokenizeFlow.isOpen} onClose={closeTokenizePanel} onConfirm={handleTokenizeConfirm} lease={tokenizeFlow.lease} />
            <AdvanceFlowPanel flow={advanceFlow} onClose={closeAdvanceFlow} onImport={handleImport} onRunAI={runAIWithLoading} onPublish={publishToMarketplace} onShowToast={showToast} />
            <Toast message={toast.message} show={toast.show} />
            <Footer />
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
        <div className="min-h-screen bg-slate-50">
            {isConnected ? renderDashboard() : renderConnectMessage()}
        </div>
    );
}

// --- LÓGICA DEL MOTOR DE RIESGO ---
function scoreAndPrice(i: any) {
  const s = 30 * Math.min(1, i.onTimeRatio) + 20 * (1 - Math.min(1, i.rentToIncome)) + 10 * Math.min(1, i.depositMonths / 2) + 10 * (i.termMonths <= 12 ? 1 : Math.max(0, 1 - (i.termMonths - 12) / 12)) + 20 * Math.min(1, i.docsQuality) + 10 * Math.min(1, i.marketIndex);
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
  return { tier, score: Math.round(s), haircutPct: +(haircut * 100).toFixed(1), ocPct: +(oc * 100).toFixed(1), PV: Math.round(PV), advance: Math.round(advance), irrAPR: +(irrAPR * 100).toFixed(1) };
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

