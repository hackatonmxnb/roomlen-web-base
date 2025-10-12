"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/WalletProvider';
import { lenderReceiptNftAddress, wmxnbAddress, escrowAddress } from '@/lib/contractAddresses';
import { ethers } from 'ethers';
import TinyEscrowABI from '@/lib/abi/TinyEscrow.json';

// Required ABIs
const ERC721_ABI = [
  'function approve(address to, uint256 tokenId) external',
  'function getApproved(uint256 tokenId) external view returns (address)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

// Types for secondary market
interface TRRListing {
  id: string; // Listing ID from database
  tokenId: string;
  seller: string;
  askPrice: string;
  suggestedPrice: string;
  timestamp: number;
  loanDetails: {
    property: string;
    advance: string;
    irrAPR: number;
    termMonths: number;
    remainingMonths: number;
    dueDate: string;
    status: string;
  };
}

interface MyTRR {
  tokenId: string;
  loanId: string;
  property: string;
  advance: string;
  irrAPR: number;
  remainingMonths: number;
}

export function SecondaryMarketTab() {
  const [view, setView] = useState<'listings' | 'my-nfts'>('listings');
  const [listings, setListings] = useState<TRRListing[]>([]);
  const [myTRRs, setMyTRRs] = useState<MyTRR[]>([]);
  const [loading, setLoading] = useState(false);
  const { account, isConnected } = useWallet();

  // TODO: Fetch real data from SecondaryMarket contract
  // For now we use sample data
  useEffect(() => {
    if (isConnected && account) {
      fetchMarketData();
      fetchMyTRRs();
    }
  }, [isConnected, account]);

  const fetchMarketData = async () => {
    // TODO: Implement real blockchain fetch
    // Example mock data
    setListings([
      {
        id: '1',
        tokenId: '1',
        seller: '0x1234...5678',
        askPrice: '42000',
        suggestedPrice: '40950',
        timestamp: Date.now(),
        loanDetails: {
          property: 'Casa en Polanco',
          advance: '45000',
          irrAPR: 15,
          termMonths: 12,
          remainingMonths: 8,
          dueDate: '2025-06-15',
          status: 'Active'
        }
      },
      {
        id: '3',
        tokenId: '3',
        seller: '0xabcd...efgh',
        askPrice: '28000',
        suggestedPrice: '27300',
        timestamp: Date.now(),
        loanDetails: {
          property: 'Departamento en Condesa',
          advance: '30000',
          irrAPR: 20,
          termMonths: 12,
          remainingMonths: 10,
          dueDate: '2025-08-20',
          status: 'Active'
        }
      }
    ]);
  };

  const fetchMyTRRs = async () => {
    // TODO: Implement real blockchain fetch
    setMyTRRs([
      {
        tokenId: '5',
        loanId: '5',
        property: 'Casa en Santa Fe',
        advance: '50000',
        irrAPR: 15,
        remainingMonths: 6
      }
    ]);
  };

  const handleBuyTRR = async (tokenId: string, seller: string, price: string) => {
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Convert price to wei (assuming price is in whole wMXNB)
      const priceInWei = ethers.parseEther(price);

      // Contracts
      const wmxnb = new ethers.Contract(wmxnbAddress, ERC20_ABI, signer);
      const escrow = new ethers.Contract(escrowAddress, TinyEscrowABI, signer);

      console.log('Step 1: Approving wMXNB...');
      const approveTx = await wmxnb.approve(escrowAddress, priceInWei);
      await approveTx.wait();
      console.log('✅ wMXNB approved');

      console.log('Step 2: Executing trade...');
      const tradeTx = await escrow.trade(
        tokenId,
        seller,
        account, // buyer
        priceInWei
      );
      await tradeTx.wait();
      console.log('✅ Trade completed!');

      alert('Purchase successful! 🎉 You now own TRR #' + tokenId);
      fetchMarketData();
    } catch (error: any) {
      console.error('Error buying TRR:', error);
      alert('Purchase failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleListForSale = async (tokenId: string, price: string) => {
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const trrNFT = new ethers.Contract(lenderReceiptNftAddress, ERC721_ABI, signer);

      console.log('Step 1: Approving NFT to escrow...');
      const approveTx = await trrNFT.approve(escrowAddress, tokenId);
      await approveTx.wait();
      console.log('✅ NFT approved to escrow');

      // Here you should save the listing to your database
      // For now we just show confirmation
      console.log('Step 2: Saving listing to database...');
      // TODO: await saveListingToDatabase(tokenId, account, price);

      alert(`Listed successfully! 🏷️\n\nTRR #${tokenId} is now for sale at ${price} wMXNB\n\nBuyers can now purchase it through the marketplace.`);
      fetchMyTRRs();
    } catch (error: any) {
      console.error('Error listing TRR:', error);
      alert('Listing failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-slate-50 p-12 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-slate-600">
          Connect your wallet to access the secondary market
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Info Banner */}
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Trade TRR tokens for instant liquidity. Buyers receive all future loan payments.
            </p>
          </div>
        </div>
      </div>

      {/* Compact Toggle Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('listings')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
            view === 'listings'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🛒 Buy
        </button>
        <button
          onClick={() => setView('my-nfts')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
            view === 'my-nfts'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🎫 Sell
        </button>
      </div>

      {/* Listings View */}
      {view === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">No listings available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.tokenId}
                  className="rounded-lg bg-white p-4 ring-1 ring-slate-200 hover:ring-blue-300 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        TRR #{listing.tokenId}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {listing.loanDetails.property}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-slate-500">Loan</p>
                      <p className="font-bold">${listing.loanDetails.advance}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">APR</p>
                      <p className="font-bold">{listing.loanDetails.irrAPR}%</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Price:</span>
                      <span className="font-bold text-sm">${listing.askPrice}</span>
                    </div>
                    {parseFloat(listing.askPrice) < parseFloat(listing.suggestedPrice) && (
                      <p className="text-xs text-green-600 mt-1">
                        💰 Good deal!
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleBuyTRR(listing.tokenId, listing.seller, listing.askPrice)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `Buy $${listing.askPrice}`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My NFTs View */}
      {view === 'my-nfts' && (
        <div>
          {myTRRs.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">You don't have any TRR tokens yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Fund a loan to receive a TRR token
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTRRs.map((nft) => (
                <SellTRRCard
                  key={nft.tokenId}
                  nft={nft}
                  onList={handleListForSale}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Component for selling your TRR NFT (compact version)
function SellTRRCard({ nft, onList, loading }: { nft: MyTRR; onList: (tokenId: string, price: string) => void; loading: boolean }) {
  const [sellPrice, setSellPrice] = useState('');
  const [showSellForm, setShowSellForm] = useState(false);

  const suggestedPrice = (parseFloat(nft.advance) * 0.95).toFixed(0); // 5% discount

  return (
    <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900">TRR #{nft.tokenId}</h4>
          <p className="text-xs text-slate-600">{nft.property}</p>
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
          Owned
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-slate-500">Loan</p>
          <p className="font-bold">${nft.advance}</p>
        </div>
        <div>
          <p className="text-slate-500">APR</p>
          <p className="font-bold">{nft.irrAPR}%</p>
        </div>
        <div>
          <p className="text-slate-500">Remaining</p>
          <p className="font-bold">{nft.remainingMonths}m</p>
        </div>
        <div>
          <p className="text-slate-500">Suggested</p>
          <p className="font-bold">${suggestedPrice}</p>
        </div>
      </div>

      {!showSellForm ? (
        <button
          onClick={() => setShowSellForm(true)}
          className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold hover:scale-105 transition"
        >
          🏷️ List for Sale
        </button>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sale Price (wMXNB)
            </label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder={suggestedPrice}
              className="w-full px-3 py-2 text-sm rounded-lg ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Suggested: ${suggestedPrice} (5% discount)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onList(nft.tokenId, sellPrice || suggestedPrice)}
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Listing...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowSellForm(false)}
              className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
