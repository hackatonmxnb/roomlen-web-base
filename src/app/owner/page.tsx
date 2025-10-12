'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/lib/WalletProvider';
import WalletConnect from '@/components/WalletConnect';
import VRA_NFT_ABI from '@/lib/abi/VerifiableRentalAgreementNFT.json';
import LENDING_PROTOCOL_ABI from '@/lib/abi/LendingProtocol.json';
import { lendingProtocolAddress, rentalNftAddress as VRA_NFT_ADDRESS } from '@/lib/contractAddresses';

type TLeaseStatus = 'Not Tokenized' | 'Tokenized' | 'Escrow Active';
interface Lease {
  id: string; property: string; location: string; rent: number; status: TLeaseStatus; termMonths: number;
  onTimeRatio?: number; rentToIncome?: number; depositMonths?: number; docsQuality?: number; marketIndex?: number;
  nftId?: number;
  publishedTxHash?: string;
  isPublished?: boolean;
}
interface Advance { id: string; amount: number; property: string; location: string; fundedOn: string; remaining: number; ocPct: number; haircutPct: number; stream: string; termMonths: number; rent: number; }
interface OwnerOffer { id: string; property: string; location: string; advance: number; irrAPR: number; termMonths: number; ocPct: number; haircutPct: number; fees: number; chain: string; riskTier: string; rent: number; }

const MOCK_LEASES: Lease[] = [
  { id: 'mock1', property: 'Loft Reforma 210', location: 'CDMX • Juárez', rent: 10000, status: 'Not Tokenized', termMonths: 12, onTimeRatio: 0.98, rentToIncome: 0.3, depositMonths: 2, docsQuality: 0.9, marketIndex: 1.1 },
  { id: 'mock2', property: 'Depto Roma Nte 88', location: 'CDMX • Roma', rent: 8000, status: 'Not Tokenized', termMonths: 12, onTimeRatio: 0.92, rentToIncome: 0.4, depositMonths: 1, docsQuality: 0.7, marketIndex: 1.0 },
  { id: 'mock3', property: 'Casa Lomas 34', location: 'CDMX • Lomas', rent: 12000, status: 'Not Tokenized', termMonths: 18, onTimeRatio: 1.0, rentToIncome: 0.25, depositMonths: 2, docsQuality: 1.0, marketIndex: 1.2 },
];

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
                    <div>
                        <div className="font-medium">{lease.property}</div>
                        <div className="text-slate-600 text-sm">{lease.location} • Rent ${lease.rent.toLocaleString()} / mo</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 bg-green-100 text-green-800`}>{lease.status}</span>
                        {lease.isPublished ? (
                            <>
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 bg-blue-100 text-blue-800">
                                    Published ✓
                                </span>
                                {lease.publishedTxHash && (
                                    <a
                                        href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${lease.publishedTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-sm bg-slate-600 text-white hover:bg-slate-700"
                                    >
                                        View on Explorer
                                    </a>
                                )}
                            </>
                        ) : (
                            <button onClick={() => onGetAdvance(lease)} className="btn-sm bg-green-600 text-white hover:bg-green-700">
                                Get advance
                            </button>
                        )}
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
        {offers.length === 0 ? <p className="mt-2 text-sm text-slate-600 text-center py-4">No offers yet.</p> : offers.map(offer => <div key={offer.id}></div>)}
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
    const handlePDFUpload = () => {
        onShowToast("PDF uploaded successfully!");
        // Para el hackathon, avanzar directo al AI scoring
        setTimeout(() => {
            onRunAI();
        }, 800);
    };

    const handleRoomFiConnect = () => {
        onShowToast("Opening RoomFi...");
        // Abrir RoomFi en nueva pestaña
        window.open('https://roomfi.netlify.app', '_blank');
        // Para el hackathon, avanzar directo al AI scoring
        setTimeout(() => {
            onShowToast("Connected to RoomFi!");
            onRunAI();
        }, 1000);
    };

    const renderStepIndicator = () => {
        const steps = [
            { key: 'upload', label: 'Upload', icon: '📄' },
            { key: 'ai-scoring', label: 'AI Score', icon: '🤖' },
            { key: 'review', label: 'Review', icon: '✓' },
            { key: 'loading', label: 'Processing', icon: '⏳' },
            { key: 'published', label: 'Done', icon: '✓' }
        ];
        const currentIndex = steps.findIndex(s => s.key === flow.step);

        return (
            <div className="flex items-center justify-between mb-6">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                idx < currentIndex ? 'bg-green-500 text-white' :
                                idx === currentIndex ? 'bg-gradient-to-br from-[#16A957] to-[#1297C8] text-white shadow-lg scale-110' :
                                'bg-slate-200 text-slate-400'
                            }`}>
                                {idx < currentIndex ? '✓' : step.icon}
                            </div>
                            <div className={`text-xs mt-1 font-medium ${idx <= currentIndex ? 'text-slate-700' : 'text-slate-400'}`}>
                                {step.label}
                            </div>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                                idx < currentIndex ? 'bg-green-500' : 'bg-slate-200'
                            }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderStepContent = () => {
        switch (flow.step) {
            case 'upload':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <h3 className="font-semibold text-2xl text-slate-900 mb-2">Upload Documentation</h3>
                            <p className="text-slate-600 mb-6">Choose how to provide your rental agreement data for AI analysis.</p>

                            <div className="space-y-4">
                                {/* PDF Upload Option */}
                                <div
                                    className="card border-2 transition-all cursor-pointer hover:border-[#16A957] hover:shadow-md border-slate-200 hover:bg-green-50"
                                    onClick={handlePDFUpload}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ADE0C4] to-[#ACDBE5] flex items-center justify-center text-2xl flex-shrink-0">
                                            📄
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-semibold text-slate-900">Upload Lease PDF</div>
                                            <div className="text-sm text-slate-600 mt-1">
                                                AI will analyze your signed rental agreement, tenant information, and payment history.
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500 italic">
                                                Click to proceed with demo data →
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RoomFi API Option */}
                                <div
                                    className="card border-2 transition-all cursor-pointer hover:border-[#1297C8] hover:shadow-md border-slate-200 hover:bg-blue-50"
                                    onClick={handleRoomFiConnect}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1297C8] to-[#149AB5] flex items-center justify-center text-2xl flex-shrink-0">
                                            🔗
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-semibold text-slate-900">Connect with RoomFi</div>
                                            <div className="text-sm text-slate-600 mt-1">
                                                Automatically pull verified rental data, payment history, and tenant scores from RoomFi.
                                            </div>
                                            <div className="mt-2 text-xs text-blue-600 font-medium">
                                                ⚡ Faster • More accurate • Real-time data
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 pt-6">
                            <p className="text-xs text-slate-500 text-center mb-3">
                                For hackathon demo: Click any option above to continue
                            </p>
                            <button onClick={onClose} className="w-full btn-ghost">Cancel</button>
                        </div>
                    </div>
                );

            case 'ai-scoring':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="relative mb-8">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ADE0C4] to-[#ACDBE5] flex items-center justify-center animate-pulse">
                                <div className="text-6xl">🤖</div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-[#16A957] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        </div>
                        <h3 className="font-bold text-2xl text-slate-900 mb-2">AI is Analyzing...</h3>
                        <p className="text-slate-600 max-w-sm">
                            Our AI is reviewing your lease agreement, calculating risk scores, and estimating your advance amount.
                        </p>
                        <div className="mt-8 space-y-2 text-left w-full max-w-sm">
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</div>
                                <span>Document verification</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</div>
                                <span>Tenant credit analysis</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <span>Risk scoring & pricing...</span>
                            </div>
                        </div>
                    </div>
                );

            case 'review':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#16A957] to-[#1297C8] flex items-center justify-center text-2xl">
                                    ✓
                                </div>
                                <div>
                                    <h3 className="font-bold text-2xl text-slate-900">AI Scoring Complete!</h3>
                                    <p className="text-sm text-slate-600">Review your advance details below</p>
                                </div>
                            </div>

                            {flow.ai ? (
                                <div className="space-y-4 mt-6">
                                    {/* Main Score Card */}
                                    <div className="card bg-gradient-to-br from-[#16A957] to-[#1297C8] text-white border-0 shadow-lg">
                                        <div className="text-center">
                                            <div className="text-sm opacity-90 mb-1">Estimated Advance Amount</div>
                                            <div className="font-bold text-5xl mb-2">${flow.ai.advance?.toLocaleString() || 'N/A'}</div>
                                            <div className="text-sm opacity-90">Based on {flow.lease?.termMonths} month lease</div>
                                        </div>
                                    </div>

                                    {/* Score & Tier Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="card bg-slate-50 border-slate-200">
                                            <div className="text-xs text-slate-500 mb-1">Risk Tier</div>
                                            <div className={`font-bold text-3xl ${
                                                flow.ai.tier === 'A' ? 'text-green-600' :
                                                flow.ai.tier === 'B' ? 'text-blue-600' : 'text-yellow-600'
                                            }`}>
                                                {flow.ai.tier}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {flow.ai.tier === 'A' ? 'Excellent' : flow.ai.tier === 'B' ? 'Good' : 'Fair'}
                                            </div>
                                        </div>
                                        <div className="card bg-slate-50 border-slate-200">
                                            <div className="text-xs text-slate-500 mb-1">AI Credit Score</div>
                                            <div className="font-bold text-3xl text-slate-900">{flow.ai.score}</div>
                                            <div className="text-xs text-slate-500 mt-1">out of 100</div>
                                        </div>
                                    </div>

                                    {/* Terms Breakdown */}
                                    <div className="card bg-white border-slate-200">
                                        <div className="font-semibold text-slate-900 mb-3">Advance Terms</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Haircut</span>
                                                <span className="font-semibold text-slate-900">{flow.ai.haircutPct}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Over-collateral</span>
                                                <span className="font-semibold text-slate-900">{flow.ai.ocPct}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Estimated IRR (APR)</span>
                                                <span className="font-semibold text-slate-900">{flow.ai.irrAPR}%</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                                <span className="text-slate-600">Monthly Rent</span>
                                                <span className="font-semibold text-slate-900">${flow.lease?.rent?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500">Loading AI results...</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 pt-6 space-y-3">
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                                By publishing, you agree to list this advance request on the RoomLen marketplace for lenders to fund.
                            </div>
                            <button onClick={onPublish} className="w-full btn bg-gradient-to-r from-[#16A957] to-[#1297C8] text-white text-lg">
                                Publish to Marketplace
                            </button>
                            <button onClick={onClose} className="w-full btn-ghost">Cancel</button>
                        </div>
                    </div>
                );

            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <img src="/roomlenlogo.png" alt="RoomLen Logo" className="h-24 w-auto animate-pulse mb-6" />
                        <div className="w-16 h-16 border-4 border-[#16A957] border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">Publishing to Blockchain...</h3>
                        <p className="text-slate-600 max-w-sm">Please confirm the transaction in your wallet to publish your advance request.</p>
                    </div>
                );

            case 'published':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#16A957] to-[#1297C8] flex items-center justify-center text-5xl mb-6 shadow-lg">
                            ✓
                        </div>
                        <h3 className="font-bold text-3xl text-slate-900 mb-3">Published Successfully!</h3>
                        <p className="text-slate-600 max-w-sm mb-8">
                            Your advance request is now live on the RoomLen marketplace. Lenders can review and fund your request.
                        </p>
                        <div className="w-full max-w-sm space-y-3">
                            <button onClick={onClose} className="w-full btn bg-gradient-to-r from-[#16A957] to-[#1297C8] text-white">
                                Back to Dashboard
                            </button>
                            <button className="w-full btn-ghost">View in Marketplace</button>
                        </div>
                    </div>
                );

            default:
                return <p className="text-slate-500">Unknown step</p>;
        }
    };

    return (
        <>
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${flow.open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
                <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
            </div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${flow.open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col overflow-y-auto">
                    <div className="flex-shrink-0 flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Get Advance</h2>
                            <div className="text-sm text-slate-600 mt-1">
                                Property: <span className="font-semibold text-slate-800">{flow.lease?.property}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-2xl w-10 h-10 flex items-center justify-center">
                            ✕
                        </button>
                    </div>

                    {flow.step !== 'ai-scoring' && flow.step !== 'loading' && renderStepIndicator()}

                    <div className="flex-grow relative">
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
    const [advanceFlow, setAdvanceFlow] = useState({
        open: false,
        step: 'upload' as 'upload' | 'ai-scoring' | 'review' | 'loading' | 'published',
        lease: null as Lease | null,
        ai: null as any,
        uploadMethod: null as 'pdf' | 'roomfi' | null
    });

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
        setAdvanceFlow({ open: true, step: 'upload', lease, ai: null, uploadMethod: null });
    }
    function closeAdvanceFlow() { setAdvanceFlow({ open: false, step: 'upload', lease: null, ai: null, uploadMethod: null }); }

    async function handleRunAIScoring() {
        if (!advanceFlow.lease) return;

        // Cambiar a step 'ai-scoring'
        setAdvanceFlow(f => ({ ...f, step: 'ai-scoring' }));

        // Simular delay de AI processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Ejecutar scoreAndPrice() con datos del lease
        const lease = advanceFlow.lease;
        const aiInput = {
            onTimeRatio: lease.onTimeRatio || 0.95,
            rentToIncome: lease.rentToIncome || 0.35,
            depositMonths: lease.depositMonths || 1,
            termMonths: lease.termMonths,
            docsQuality: lease.docsQuality || 0.85,
            marketIndex: lease.marketIndex || 1.0,
            rentMXN: lease.rent,
            monthlyDiscPct: 1.5, // Tasa de descuento mensual
            currencyMismatch: false
        };

        const aiResult = scoreAndPrice(aiInput);

        // Cambiar a step 'review' con los resultados
        setAdvanceFlow(f => ({ ...f, step: 'review', ai: aiResult }));
    }

    async function handlePublishAdvance() {
        if (!signer || !advanceFlow.lease?.nftId) return;

        setAdvanceFlow(f => ({ ...f, step: 'loading' }));
        setTxInfo({});
        try {
            const lendingContract = new ethers.Contract(lendingProtocolAddress, LENDING_PROTOCOL_ABI, signer);
            const tx = await lendingContract.requestLoan(advanceFlow.lease.nftId);
            const txHash = tx.hash;
            setTxInfo({ hash: txHash });
            await tx.wait();

            // Actualizar el lease como publicado con el hash de la transacción
            setLeases(prevLeases =>
                prevLeases.map(l =>
                    l.id === advanceFlow.lease?.id
                        ? { ...l, isPublished: true, publishedTxHash: txHash }
                        : l
                )
            );

            setAdvanceFlow(f => ({ ...f, step: 'published' }));
            showToast("Advance requested successfully!");
        } catch (err: any) {
            console.error("Advance request failed:", err);
            const reason = err.reason || 'Transaction failed.';
            setTxInfo({ error: reason });
            showToast(reason);
            setAdvanceFlow(f => ({ ...f, step: 'upload' }));
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
                                    {txInfo.hash ? <a href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${txInfo.hash}`} target="_blank" rel="noopener noreferrer" className="text-sm break-all underline">View on Explorer: {txInfo.hash}</a> : <p className="text-sm">{txInfo.error}</p>}
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
                onRunAI={handleRunAIScoring}
                onPublish={handlePublishAdvance}
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
