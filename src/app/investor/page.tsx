"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Topbar } from "@/components/investor/Topbar";
import { KPIBar } from "@/components/investor/KPIBar";
import { CashflowStrip } from "@/components/investor/CashflowStrip";
import { PositionsTable } from "@/components/investor/PositionsTable";
import { MarketFilters } from "@/components/investor/MarketFilters";
import { OfferGrid } from "@/components/investor/OfferGrid";
import { DealDrawer } from "@/components/investor/DealDrawer";
import { Footer } from "@/components/investor/Footer";
import { summarize } from "@/lib/investor/utils";
import type { Position, Offer } from "@/lib/investor/types";

// Import contract configurations
import { lendingProtocolAddress, rentalNftAddress } from "@/lib/contractAddresses";
import LendingProtocolABI from "@/lib/abi/LendingProtocolV2.json";
import RentalNFTABI from "@/lib/abi/VerifiableRentalAgreementNFTV2.json";

// Import Viem hooks and utilities
import { createPublicClient, http, formatUnits } from "viem";
import { defineChain } from "viem";

// Define Base Sepolia Testnet chain
const baseSepoliaTestnet = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
});

// Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  chain: baseSepoliaTestnet,
  transport: http(),
});

// Helper to format date from timestamp
const formatDate = (timestamp: bigint) => {
  if (timestamp === 0n) return "N/A";
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
};

import { TRRInfoModal } from "@/components/investor/TRRInfoModal";
import { useMarketplace } from "@/hooks/useMarketplace";
import { usePortfolio } from "@/hooks/usePortfolio";
import { SecondaryMarketTab } from "@/components/investor/SecondaryMarket";

type RiskTier = {
  scoreThreshold: number;
  haircutBps: bigint;
  ocBps: bigint;
  interestRateBps: bigint;
};

// RoomLen — Investor Dashboard (MVP)
// Next.js App Router page with modular components

export default function InvestorDashboard() {
  const [tab, setTab] = useState<"portfolio" | "market">("portfolio");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ tier: "all", term: "all" });
  const [selected, setSelected] = useState<Position | Offer | null>(null);
  const [showTRRModalFor, setShowTRRModalFor] = useState<Position | null>(null);

  // --- REAL-TIME BLOCKCHAIN DATA ---
  const [positions, setPositions] = useState<Position[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [portfolio, setPortfolio] = useState<any>({}); // Using any for now

  // --- MARKETPLACE API DATA ---
  const { 
    data: marketplaceListings, 
    isLoading: isLoadingMarketplace, 
    error: marketplaceError,
    refetch: refetchMarketplace
  } = useMarketplace();

  // --- PORTFOLIO API DATA ---
  const { 
    positions: apiPositions,
    portfolioSummary,
    isLoading: isLoadingPortfolio,
    error: portfolioError,
    refetch: refetchPortfolio
  } = usePortfolio('550e8400-e29b-41d4-a716-446655440002');

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        const loanCount = await publicClient.readContract({
          address: lendingProtocolAddress as `0x${string}`,
          abi: LendingProtocolABI,
          functionName: "getLoansCount",
        });

        const riskTiers = await publicClient.readContract({
            address: lendingProtocolAddress as `0x${string}`,
            abi: LendingProtocolABI,
            functionName: "getRiskTiers",
        }) as RiskTier[];

        const loanPromises = [];
        for (let i = 0; i < Number(loanCount); i++) {
          loanPromises.push(
            publicClient.readContract({
              address: lendingProtocolAddress as `0x${string}`,
              abi: LendingProtocolABI,
              functionName: "getLoan",
              args: [BigInt(i)],
            })
          );
        }
        const rawLoans = await Promise.all(loanPromises);

        const fullLoanDetails = await Promise.all(rawLoans.map(async (loan: any, index) => {
            const agreementData: any = await publicClient.readContract({
                address: rentalNftAddress as `0x${string}`,
                abi: RentalNFTABI,
                functionName: "getAgreementData",
                args: [loan.nftId],
            });

            const tier = riskTiers.find(t => t.scoreThreshold <= Number(agreementData.tenantScore)) || riskTiers[riskTiers.length-1];
            const irrAPR = tier ? Number(tier.interestRateBps) / 100 : 0;

            return { loan, agreementData, tier, irrAPR, index };
        }));

        const allPositions: Position[] = fullLoanDetails
            .filter(({ loan }) => loan.status !== 0) // 0 = Requested
            .map(({ loan, agreementData, irrAPR, index }) => ({
                id: index.toString(),
                property: agreementData.propertyName,
                location: agreementData.location,
                advance: parseFloat(formatUnits(loan.amount, 18)),
                rent: parseFloat(formatUnits(agreementData.rentAmount, 18)),
                termMonths: loan.termMonths,
                irrAPR: irrAPR,
                nextPayment: formatDate(loan.dueDate),
                stream: "Healthy", // Placeholder
                status: loan.status === 2 ? "Completed" : loan.status === 3 ? "Default" : "Active",
            }));

        const allOffers: Offer[] = fullLoanDetails
            .filter(({ loan }) => loan.status === 0) // 0 = Requested
            .map(({ loan, agreementData, tier, irrAPR, index }) => ({
                id: index.toString(),
                property: agreementData.propertyName,
                location: agreementData.location,
                advance: parseFloat(formatUnits(loan.amount, 18)),
                rent: parseFloat(formatUnits(agreementData.rentAmount, 18)),
                termMonths: loan.termMonths,
                irrAPR: irrAPR,
                ocPct: tier ? Number(tier.ocBps) / 100 : 0,
                haircutPct: tier ? Number(tier.haircutBps) / 100 : 0,
                chain: "Base Sepolia",
                currency: "USDC",
                riskTier: String.fromCharCode(65 + riskTiers.indexOf(tier)), // A, B, C...
            }));

        setPositions(allPositions);
        setOffers(allOffers);

      } catch (error) {
        console.error("Failed to fetch contract data:", error);
        setPositions([]);
        setOffers([]);
      }
    };

    fetchContractData();
  }, []);

  // Merge blockchain offers with marketplace API data
  useEffect(() => {
    // Always refresh the offers state with latest data
    // Filter blockchain offers (those without 'API' chain) and merge with API data
    setOffers(currentOffers => {
      // Keep only blockchain offers (not from API)
      const blockchainOffers = currentOffers.filter(o => o.chain !== 'API');
      
      // Add all API marketplace listings
      const apiOffers = (marketplaceListings || []).map(listing => ({
        ...listing,
        property: listing.property || 'N/A',
        location: listing.location || 'N/A',
        chain: 'API',
        currency: listing.currency || 'USD',
        riskTier: listing.riskTier || 'N/A',
      }));

      // Merge: blockchain offers + API offers (API data always fresh)
      return [...blockchainOffers, ...apiOffers];
    });
  }, [marketplaceListings]);

  // Merge blockchain positions with API portfolio data
  useEffect(() => {
    // Always refresh positions with latest data
    // Filter blockchain positions and merge with API data
    setPositions(currentPositions => {
      // Keep only blockchain positions (filter out API ones by location marker)
      const blockchainPositions = currentPositions.filter(p => 
        p.location !== 'API Loan'
      );
      
      // Add all API positions
      const apiPositionsFormatted = (apiPositions || []).map(position => ({
        ...position,
        property: position.property || 'N/A',
        location: position.location || 'N/A',
      }));

      // Merge: blockchain positions + API positions (API data always fresh)
      return [...blockchainPositions, ...apiPositionsFormatted];
    });
  }, [apiPositions]);

  useEffect(() => {
    if (positions) {
      setPortfolio(summarize(positions));
    }
  }, [positions]);

  // --- END REAL-TIME BLOCKCHAIN DATA ---

  const filteredOffers = useMemo(() => {
    
    const filtered = offers.filter((o: Offer) => {
      const q = query.toLowerCase();
      const matchQ = [o.property, o.location, o.chain, o.currency].some((x: string) =>
        x.toLowerCase().includes(q)
      );
      const matchTier = filters.tier === "all" || o.riskTier === filters.tier;
      const matchTerm =
        filters.term === "all" ||
        (filters.term === "short" && o.termMonths <= 6) ||
        (filters.term === "med" && o.termMonths > 6 && o.termMonths <= 12) ||
        (filters.term === "long" && o.termMonths > 12);
      return matchQ && matchTier && matchTerm;
    });
    
    return filtered;
  }, [offers, query, filters]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Topbar tab={tab} onTab={setTab} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {tab === "portfolio" && (
          <>
            {portfolioError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <p className="font-semibold">Error loading portfolio data:</p>
                <p className="text-sm">{portfolioError}</p>
              </div>
            )}
            {isLoadingPortfolio && positions.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading portfolio...</div>
              </div>
            )}
            <KPIBar portfolio={portfolio} />
            <CashflowStrip portfolio={portfolio} />
            <PositionsTable positions={positions} onOpen={setSelected} onShowTRR={setShowTRRModalFor} />
          </>
        )}

        {tab === "market" && (
          <>
            {/* Header del Marketplace Unificado */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                🏪 RoomLen Marketplace
              </h2>
              <p className="text-slate-600">
                Invest in new loans or trade existing positions for instant liquidity
              </p>
            </div>

            {/* Bot de Liquidación Banner */}
            <div className="mb-6 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Automated Liquidation Bot Active</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Our smart bot monitors all loans 24/7 and automatically liquidates defaulted positions to protect investors.
                    Collateral is distributed fairly among TRR holders.
                  </p>
                </div>
              </div>
            </div>

            {/* Layout de 2 columnas: Primary + Secondary Market */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* COLUMNA IZQUIERDA: PRIMARY MARKET (Loans) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">
                    💰 Primary Market
                  </h3>
                  <span className="text-sm text-slate-500">Fund new loans</span>
                </div>

                <MarketFilters
                  query={query}
                  setQuery={setQuery}
                  filters={filters}
                  setFilters={setFilters}
                />

                {marketplaceError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <p className="font-semibold">Error loading marketplace data:</p>
                    <p className="text-sm">{marketplaceError}</p>
                  </div>
                )}

                {isLoadingMarketplace && offers.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-slate-600">Loading marketplace...</div>
                  </div>
                )}

                <OfferGrid offers={filteredOffers} onOpen={setSelected} />
              </div>

              {/* COLUMNA DERECHA: SECONDARY MARKET (TRR Tokens) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">
                    💱 Secondary Market
                  </h3>
                  <span className="text-sm text-slate-500">Trade TRR tokens</span>
                </div>

                <SecondaryMarketTab />
              </div>
            </div>
          </>
        )}
      </main>

      {selected && (
        <DealDrawer 
          deal={selected} 
          onClose={() => setSelected(null)}
          onInvestmentSuccess={() => {
            refetchMarketplace();
            refetchPortfolio();
          }}
        />
      )}

      {showTRRModalFor && (
        <TRRInfoModal position={showTRRModalFor} onClose={() => setShowTRRModalFor(null)} />
      )}

      <Footer />
    </div>
  );
}
