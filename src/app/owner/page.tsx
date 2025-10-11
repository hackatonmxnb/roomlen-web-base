'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/lib/WalletProvider';
import WalletConnect from '@/components/WalletConnect';
import { marketplaceApi } from '@/lib/api/roomfi';

// --- ABIs Y DIRECCIONES ---
import VRA_NFT_ABI from '@/lib/abi/VerifiableRentalAgreementNFT.json';
import LENDING_PROTOCOL_ABI from '@/lib/abi/LendingProtocol.json';
import { lendingProtocolAddress, rentalNftAddress as VRA_NFT_ADDRESS } from '@/lib/contractAddresses';


// --- TIPOS DE DATOS ---
type TLeaseStatus = 'Not Tokenized' | 'Tokenized' | 'Escrow Active';
interface Lease {
  id: string; property: string; location: string; rent: number; status: TLeaseStatus; termMonths: number;
  onTimeRatio?: number; rentToIncome?: number; depositMonths?: number; docsQuality?: number; marketIndex?: number;
  nftId?: number; // Add nftId to link to the contract
}
interface Advance { id: string; amount: number; property: string; location: string; fundedOn: string; remaining: number; ocPct: number; haircutPct: number; stream: string; termMonths: number; rent: number; }
interface OwnerOffer { id: string; property: string; location: string; advance: number; irrAPR: number; termMonths: number; ocPct: number; haircutPct: number; fees: number; chain: string; riskTier: string; rent: number; }

// --- DATOS DE PRUEBA ---
const MOCK_LEASES: Lease[] = [
  { id: 'mock1', property: 'Loft Reforma 21000', location: 'CDMX • Juárez', rent: 10000, status: 'Not Tokenized', termMonths: 12, onTimeRatio: 0.98, rentToIncome: 0.3, depositMonths: 2, docsQuality: 0.9, marketIndex: 1.1 },
  { id: 'mock2', property: 'Depto Roma Nte 88', location: 'CDMX • Roma', rent: 8000, status: 'Not Tokenized', termMonths: 12, onTimeRatio: 0.92, rentToIncome: 0.4, depositMonths: 1, docsQuality: 0.7, marketIndex: 1.0 },
  { id: 'mock3', property: 'Casa Lomas 34', location: 'CDMX • Lomas', rent: 12000, status: 'Not Tokenized', termMonths: 18, onTimeRatio: 1.0, rentToIncome: 0.25, depositMonths: 2, docsQuality: 1.0, marketIndex: 1.2 },
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
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="font-semibold">No active advance</div><div className="text-sm text-slate-600">Request an advance on one of your tokenized properties to get started.</div></section>
    );
    return (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-lg text-green-600">Active Advance</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                    <div className="text-sm text-slate-500">Property</div>
                    <div className="font-semibold text-slate-800">{advance.property}</div>
                </div>
                <div>
                    <div className="text-sm text-slate-500">Funded On</div>
                    <div className="font-semibold text-slate-800">{advance.fundedOn}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl col-span-2">
                    <div className="text-sm text-green-700">Advance Amount</div>
                    <div className="font-bold text-2xl text-green-800">${advance.amount.toLocaleString()}</div>
                </div>
                 <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500">Term</div>
                    <div className="font-bold text-xl text-slate-800">{advance.termMonths} months</div>
                </div>
                 <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500">Monthly Rent</div>
                    <div className="font-bold text-xl text-slate-800">${advance.rent.toLocaleString()}</div>
                </div>
            </div>
        </section>
    );
};

const PropertiesCard = ({ leases, onGetAdvance }: { leases: Lease[], onGetAdvance: (lease: Lease) => void }) => (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between"><div className="font-semibold">Your Properties</div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">{leases.length} total</span></div>
        <div className="mt-4 divide-y divide-slate-100">
            {leases.length === 0 ? (
                <div className="py-3 text-center text-slate-500">No properties tokenized yet.</div>
            ) : leases.map(lease => (
                <div key={lease.id} className="py-3 flex items-center justify-between gap-3">
                    <div><div className="font-medium">{lease.property}</div><div className="text-slate-600 text-sm">{lease.location} • Rent ${lease.rent.toLocaleString()} / mo</div></div>
                    <div className="flex items-center gap-2">
                         <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 bg-green-100 text-green-800`}>{lease.status}</span>
                        <button onClick={() => onGetAdvance(lease)} className="btn-sm bg-green-600 text-white">Get advance</button>
                    </div>
                </div>
            ))}
        </div>
    </section>
);

const DemoPropertiesCard = ({ leases, onTokenize }: { leases: Lease[], onTokenize: (lease: Lease) => void }) => (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 border-2 border-dashed border-blue-300">
        <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-800">Demo Properties</div>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-blue-200 bg-blue-50 text-blue-700">For Hackathon Demo</span>
        </div>
        <p className="text-sm text-slate-600 mt-2">These are sample properties. Use the 'Tokenize' button to create a verifiable NFT on the blockchain and enable advances.</p>
        <div className="mt-4 divide-y divide-slate-100">
            {leases.map(lease => (
                <div key={lease.id} className="py-3 flex items-center justify-between gap-3">
                    <div><div className="font-medium">{lease.property}</div><div className="text-slate-600 text-sm">{lease.location} • Rent ${lease.rent.toLocaleString()} / mo</div></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onTokenize(lease)} className="btn-sm bg-blue-600 text-white">Tokenize</button>
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
    const [tokenURI, setTokenURI] = useState('ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'); // Example IPFS URI
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
                        <h3 className="font-semibold text-lg">1. Request Advance</h3>
                        <p className="mt-1 text-slate-600">Your tokenized lease is eligible for an advance. Review the details and publish to the marketplace.</p>
                        <div className="mt-4 space-y-4">
                           <button onClick={onRunAI} className="w-full btn bg-green-600 hover:bg-green-700 text-lg">Estimate & Request Advance</button>
                        </div>
                    </>
                );
            case 'loading':
                 return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-24 w-auto animate-pulse" />
                        <p className="mt-4 text-slate-600 font-semibold">Requesting loan on-chain...</p>
                        <p className="text-sm text-slate-500">Please confirm the transaction in your wallet.</p>
                    </div>
                );
            case 'result':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <h3 className="font-semibold text-lg">Review & Publish</h3>
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
    const { isConnected, signer, account, provider } = useWallet();
    const [leases, setLeases] = useState<Lease[]>([]);
    const [demoLeases, setDemoLeases] = useState<Lease[]>(MOCK_LEASES);
    const [activeAdvance, setActiveAdvance] = useState<Advance | null>(null);
    const [offers, setOffers] = useState<OwnerOffer[]>([]);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [txInfo, setTxInfo] = useState<{ hash?: string; error?: string }>({});
    const [isLoading, setIsLoading] = useState(true);

    const [tokenizeFlow, setTokenizeFlow] = useState({ isOpen: false, lease: null as Lease | null });
    const [advanceFlow, setAdvanceFlow] = useState({ open: false, step: 'start' as 'start' | 'loading' | 'result' | 'published', lease: null as Lease | null, ai: null as any });

    useEffect(() => {
        const fetchOwnerData = async () => {
            if (!account || !provider) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const lendingContract = new ethers.Contract(lendingProtocolAddress, LENDING_PROTOCOL_ABI, provider);
                const loanIds = await lendingContract.getLoanIdsByBorrower(account);
                const loanDataPromises = loanIds.map((loanId: any) => lendingContract.getLoanUIData(loanId));
                const settledPromises = await Promise.allSettled(loanDataPromises);

                const fetchedLeases: Lease[] = [];
                let fetchedAdvance: Advance | null = null;

                settledPromises.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        const [loan, tier, agreement] = result.value;
                        fetchedLeases.push({
                            id: `L${Number(loan.nftId)}`,
                            nftId: Number(loan.nftId),
                            property: `NFT #${Number(loan.nftId)}`,
                            location: 'On-chain',
                            rent: parseFloat(ethers.formatUnits(agreement.rentAmount, 18)),
                            termMonths: Number(agreement.termMonths),
                            status: 'Tokenized',
                        });
                        if (Number(loan.status) === 1) { // Funded
                             fetchedAdvance = {
                                id: `A${index}`,
                                amount: parseFloat(ethers.formatUnits(loan.amount, 18)),
                                property: `NFT #${Number(loan.nftId)}`,
                                location: 'On-chain',
                                fundedOn: new Date(Number(loan.fundingDate) * 1000).toLocaleDateString(),
                                remaining: 0, ocPct: Number(tier.ocBps) / 100, haircutPct: Number(tier.haircutBps) / 100, stream: '...',
                                termMonths: Number(loan.termInMonths),
                                rent: parseFloat(ethers.formatUnits(agreement.rentAmount, 18)),
                            };
                        }
                    }
                });
                setLeases(fetchedLeases);
                setActiveAdvance(fetchedAdvance);
            } catch (error) {
                console.error("Failed to fetch owner data:", error);
                showToast("Could not fetch your data from the blockchain.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOwnerData();
    }, [account, provider]);


    const showToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // --- Handlers ---
    function openTokenizePanel(lease: Lease) { setTokenizeFlow({ isOpen: true, lease }); }
    function closeTokenizePanel() { setTokenizeFlow({ isOpen: false, lease: null }); }
    async function handleTokenizeConfirm(tokenURI: string, tenantScore: number) {
        if (!signer || !account || !tokenizeFlow.lease) return;
        setTxInfo({});
        try {
            const contract = new ethers.Contract(VRA_NFT_ADDRESS, VRA_NFT_ABI, signer);
            const rentAmount = ethers.parseUnits(tokenizeFlow.lease.rent.toString(), 18);
            
            // Arguments for the new mint function signature
            const agreementId = Math.floor(Math.random() * 100000); // Using a random ID for demo
            const propertyName = tokenizeFlow.lease.property;
            const location = tokenizeFlow.lease.location;
            const termMonths = tokenizeFlow.lease.termMonths;

            const tx = await contract.mint(
                account,
                agreementId,
                rentAmount,
                termMonths,
                tenantScore,
                propertyName,
                location
            );
            
            setTxInfo({ hash: tx.hash });
            showToast("Tokenization transaction sent!");
            await tx.wait();
            showToast("Tokenization confirmed!");

            const tokenizedLease = tokenizeFlow.lease;
            const nftId = Math.floor(Math.random() * 10000); // Mock NFT ID for demo

            const newOnChainLease: Lease = {
                ...tokenizedLease,
                status: 'Tokenized',
                id: `L${nftId}`,
                nftId: nftId,
            };

            setLeases(prev => [newOnChainLease, ...prev]);
            setDemoLeases(prev => prev.filter(l => l.id !== tokenizedLease.id));
            
            // Create marketplace listing
            try {
                const listingResponse = await marketplaceApi.createListing(account, {
                    property_id: nftId,
                    requested_amount: tokenizedLease.rent * tokenizedLease.termMonths * 0.8, // 80% of total rent
                    monthly_rent: tokenizedLease.rent,
                    term_months: tokenizedLease.termMonths,
                    purpose: "Property investment"
                });
                
                if (listingResponse.success) {
                    showToast("Property listed on marketplace!");
                }
            } catch (apiError: any) {
                console.error("Failed to create marketplace listing:", apiError);
                showToast("Warning: Tokenized but marketplace listing failed");
            }
            
            closeTokenizePanel();

        } catch (err: any) {
            console.error("Tokenization failed:", err);
            const reason = err.reason || 'Transaction failed.';
            setTxInfo({ error: reason });
            showToast(reason);
        }
    }

    async function openAdvanceFlow(lease: Lease) { 
        if (!lease.nftId) return;
        setAdvanceFlow({ open: true, step: 'start', lease, ai: null });
    }
    function closeAdvanceFlow() { setAdvanceFlow({ open: false, step: 'start', lease: null, ai: null }); }
    
    async function handleRequestAdvance() {
        if (!signer || !advanceFlow.lease?.nftId) return;

        setAdvanceFlow(f => ({ ...f, step: 'loading' }));
        setTxInfo({});
        try {
            const lendingContract = new ethers.Contract(lendingProtocolAddress, LENDING_PROTOCOL_ABI, signer);
            const tx = await lendingContract.requestLoan(advanceFlow.lease.nftId);
            setTxInfo({ hash: tx.hash });
            await tx.wait();
            setAdvanceFlow(f => ({ ...f, step: 'published' }));
            showToast("Advance requested successfully!");
        } catch (err: any) {
            console.error("Advance request failed:", err);
            const reason = err.reason || 'Transaction failed.';
            setTxInfo({ error: reason });
            showToast(reason);
            setAdvanceFlow(f => ({ ...f, step: 'start' }));
        }
    }

    const renderDashboard = () => (
        <>
            <Header />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                 {isLoading ? (
                    <div className="text-center"><p className="font-semibold text-slate-600">Loading your on-chain data...</p></div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <ActiveAdvanceCard advance={activeAdvance} />
                            <PropertiesCard leases={leases} onGetAdvance={openAdvanceFlow} />
                            {demoLeases.length > 0 && <DemoPropertiesCard leases={demoLeases} onTokenize={openTokenizePanel} />}
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
                )}
            </main>
            <TokenizePanel isOpen={tokenizeFlow.isOpen} onClose={closeTokenizePanel} onConfirm={handleTokenizeConfirm} lease={tokenizeFlow.lease} />
            <AdvanceFlowPanel 
                flow={advanceFlow} 
                onClose={closeAdvanceFlow} 
                onImport={() => {}} 
                onRunAI={handleRequestAdvance}
                onPublish={handleRequestAdvance}
                onShowToast={showToast} 
            />
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
