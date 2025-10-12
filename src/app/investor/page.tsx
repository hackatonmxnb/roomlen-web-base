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
import LendingProtocolABI from "@/lib/abi/LendingProtocol.json";
import RentalNFTABI from "@/lib/abi/VerifiableRentalAgreementNFT.json";

// Import Viem hooks and utilities
import { createPublicClient, http, formatUnits } from "viem";
import { defineChain } from "viem";

// Define Paseo Testnet chain
const paseoTestnet = defineChain({
  id: 420420422,
  name: 'Paseo Testnet',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
});

// Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  chain: paseoTestnet,
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
                chain: "Paseo Testnet",
                currency: "PAS",
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
            <MarketFilters
              query={query}
              setQuery={setQuery}
              filters={filters}
              setFilters={setFilters}
            />
            {marketplaceError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
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
