'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/lib/WalletProvider';
import WalletConnect from '@/components/WalletConnect';

// Contract ABIs and Addresses
import VRA_NFT_ABI from '@/lib/abi/VerifiableRentalAgreementNFT.json';
import LENDING_PROTOCOL_ABI from '@/lib/abi/LendingProtocol.json';
import { lendingProtocolAddress, rentalNftAddress } from '@/lib/contractAddresses';

// IMPORTANT: This page is for testing purposes only on Moonbase Alpha testnet
// Network ID: 1287
// Native Token: DEV (no real value)

export default function TestPage() {
  const { isConnected, account, provider, signer } = useWallet();
  const [networkName, setNetworkName] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);

  // Contract instances
  const [vraContract, setVraContract] = useState<ethers.Contract | null>(null);
  const [lendingContract, setLendingContract] = useState<ethers.Contract | null>(null);

  // State for reads
  const [loansCount, setLoansCount] = useState<string>('0');
  const [riskTiers, setRiskTiers] = useState<any[]>([]);
  const [latestLoan, setLatestLoan] = useState<any>(null);

  // State for write operations
  const [txHash, setTxHash] = useState<string>('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);

  // Form inputs for minting NFT
  const [mintForm, setMintForm] = useState({
    owner: '',
    agreementId: Math.floor(Math.random() * 1000000),
    rentAmount: '10000',
    termMonths: 12,
    tenantScore: 85,
    propertyName: 'Test Property',
    location: 'CDMX'
  });

  // Check network on mount
  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);

          // Moonbase Alpha chainId is 1287
          if (chainId === 1287) {
            setNetworkName('Moonbase Alpha (Testnet)');
            setIsCorrectNetwork(true);
          } else {
            setNetworkName(`Wrong Network (Chain ID: ${chainId})`);
            setIsCorrectNetwork(false);
          }
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };

    checkNetwork();
  }, [provider]);

  // Initialize contracts
  useEffect(() => {
    if (signer && isCorrectNetwork) {
      const vra = new ethers.Contract(rentalNftAddress, VRA_NFT_ABI, signer);
      const lending = new ethers.Contract(lendingProtocolAddress, LENDING_PROTOCOL_ABI, signer);

      setVraContract(vra);
      setLendingContract(lending);

      // Set owner address for minting
      if (account) {
        setMintForm(prev => ({ ...prev, owner: account }));
      }
    }
  }, [signer, account, isCorrectNetwork]);

  // Read data from blockchain
  const fetchData = async () => {
    if (!lendingContract || !vraContract) return;

    try {
      // Get loans count
      const count = await lendingContract.getLoansCount();
      setLoansCount(count.toString());

      // Get risk tiers
      const tiers = await lendingContract.getRiskTiers();
      setRiskTiers(tiers);

      // Get latest loan if exists
      if (Number(count) > 0) {
        const loan = await lendingContract.getLoan(Number(count) - 1);
        setLatestLoan(loan);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (lendingContract && vraContract) {
      fetchData();
    }
  }, [lendingContract, vraContract]);

  // WRITE FUNCTION: Mint NFT
  const handleMintNFT = async () => {
    if (!vraContract || !account) return;

    setTxStatus('pending');
    setTxError('');
    setTxHash('');
    setEvents([]);

    try {
      const rentAmountWei = ethers.parseUnits(mintForm.rentAmount, 18);

      const tx = await vraContract.mint(
        mintForm.owner,
        mintForm.agreementId,
        rentAmountWei,
        mintForm.termMonths,
        mintForm.tenantScore,
        mintForm.propertyName,
        mintForm.location
      );

      setTxHash(tx.hash);
      setTxStatus('pending');

      const receipt = await tx.wait();

      // Parse events
      const parsedEvents = receipt.logs.map((log: any) => {
        try {
          return vraContract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);

      setEvents(parsedEvents);
      setTxStatus('success');

      // Refresh data
      await fetchData();

    } catch (error: any) {
      console.error('Mint error:', error);
      setTxError(error.reason || error.message || 'Transaction failed');
      setTxStatus('error');
    }
  };

  // WRITE FUNCTION: Request Loan
  const handleRequestLoan = async (nftId: number) => {
    if (!lendingContract) return;

    setTxStatus('pending');
    setTxError('');
    setTxHash('');
    setEvents([]);

    try {
      const tx = await lendingContract.requestLoan(nftId);
      setTxHash(tx.hash);

      const receipt = await tx.wait();

      const parsedEvents = receipt.logs.map((log: any) => {
        try {
          return lendingContract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);

      setEvents(parsedEvents);
      setTxStatus('success');

      await fetchData();

    } catch (error: any) {
      console.error('Request loan error:', error);
      setTxError(error.reason || error.message || 'Transaction failed');
      setTxStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Meta tag for noindex */}
      <meta name="robots" content="noindex, nofollow" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">RoomLen Test Interface</h1>
              <p className="text-sm text-slate-600 mt-1">Direct Smart Contract Interaction - Moonbase Alpha Testnet</p>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Warning Banner */}
        <div className="mb-6 rounded-xl bg-yellow-50 border-2 border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900">Testnet Only - No Real Value</h3>
              <p className="text-sm text-yellow-800 mt-1">
                This interface interacts with smart contracts deployed on <strong>Moonbase Alpha testnet</strong>.
                DEV tokens have no real monetary value. This is for demonstration and testing purposes only.
              </p>
            </div>
          </div>
        </div>

        {!isConnected ? (
          // Not Connected State
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Your Wallet</h2>
            <p className="text-slate-600 mb-6">Connect to Moonbase Alpha testnet to interact with smart contracts</p>
            <WalletConnect />
          </div>
        ) : (
          <>
            {/* Network Status */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Connection Status</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600">Connected Account</div>
                  <div className="font-mono text-sm mt-1 break-all">{account}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600">Network</div>
                  <div className={`font-semibold mt-1 ${isCorrectNetwork ? 'text-green-600' : 'text-red-600'}`}>
                    {networkName} {isCorrectNetwork ? '✓' : '✗'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600">Status</div>
                  <div className="font-semibold text-green-600 mt-1">Connected ✓</div>
                </div>
              </div>

              {!isCorrectNetwork && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                  <strong>Wrong Network!</strong> Please switch to Moonbase Alpha testnet (Chain ID: 1287)
                </div>
              )}
            </div>

            {/* Contract Addresses */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Deployed Contracts</h2>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600">Verifiable Rental Agreement NFT</div>
                  <a
                    href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${rentalNftAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm mt-1 text-blue-600 hover:underline break-all"
                  >
                    {rentalNftAddress} →
                  </a>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600">Lending Protocol</div>
                  <a
                    href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${lendingProtocolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm mt-1 text-blue-600 hover:underline break-all"
                  >
                    {lendingProtocolAddress} →
                  </a>
                </div>
              </div>
            </div>

            {/* READ FUNCTIONS */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">📖 Read Functions (Current State)</h2>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Refresh Data
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-sm text-green-700">Total Loans</div>
                  <div className="text-3xl font-bold text-green-900 mt-2">{loansCount}</div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-sm text-blue-700">Risk Tiers Configured</div>
                  <div className="text-3xl font-bold text-blue-900 mt-2">{riskTiers.length}</div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="text-sm text-purple-700">Latest Loan ID</div>
                  <div className="text-3xl font-bold text-purple-900 mt-2">
                    {Number(loansCount) > 0 ? Number(loansCount) - 1 : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Risk Tiers Display */}
              {riskTiers.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Risk Tiers:</h3>
                  <div className="space-y-2">
                    {riskTiers.map((tier: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                        <strong>Tier {idx}:</strong> Score ≥ {tier.scoreThreshold.toString()},
                        Haircut: {(Number(tier.haircutBps) / 100).toFixed(1)}%,
                        OC: {(Number(tier.ocBps) / 100).toFixed(1)}%,
                        APR: {(Number(tier.interestRateBps) / 100).toFixed(1)}%
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Loan Display */}
              {latestLoan && (
                <div className="mt-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Latest Loan Details:</h3>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm space-y-1">
                    <div><strong>NFT ID:</strong> {latestLoan.nftId.toString()}</div>
                    <div><strong>Borrower:</strong> <span className="font-mono">{latestLoan.borrower}</span></div>
                    <div><strong>Amount:</strong> {ethers.formatUnits(latestLoan.amount, 18)} DEV</div>
                    <div><strong>Status:</strong> {['Requested', 'Funded', 'Repaid', 'Defaulted'][latestLoan.status]}</div>
                  </div>
                </div>
              )}
            </div>

            {/* WRITE FUNCTIONS */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">✍️ Write Functions (State Changes)</h2>

              {/* Mint NFT Form */}
              <div className="p-6 bg-blue-50 rounded-xl mb-4">
                <h3 className="font-semibold text-blue-900 mb-3">1. Mint Rental Agreement NFT</h3>
                <p className="text-sm text-blue-800 mb-4">Create a new rental agreement NFT to use as collateral.</p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
                    <input
                      type="text"
                      value={mintForm.propertyName}
                      onChange={(e) => setMintForm({...mintForm, propertyName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={mintForm.location}
                      onChange={(e) => setMintForm({...mintForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent (DEV)</label>
                    <input
                      type="number"
                      value={mintForm.rentAmount}
                      onChange={(e) => setMintForm({...mintForm, rentAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Term (months)</label>
                    <input
                      type="number"
                      value={mintForm.termMonths}
                      onChange={(e) => setMintForm({...mintForm, termMonths: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tenant Score (0-100)</label>
                    <input
                      type="number"
                      value={mintForm.tenantScore}
                      onChange={(e) => setMintForm({...mintForm, tenantScore: parseInt(e.target.value)})}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleMintNFT}
                  disabled={txStatus === 'pending' || !isCorrectNetwork}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {txStatus === 'pending' ? 'Processing...' : 'Mint NFT'}
                </button>
              </div>

              {/* Request Loan Button */}
              {Number(loansCount) === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> First mint an NFT above, then you can request a loan with that NFT ID.
                </div>
              )}
            </div>

            {/* TRANSACTION STATUS */}
            {txStatus !== 'idle' && (
              <div className={`mb-6 rounded-2xl shadow-sm border p-6 ${
                txStatus === 'success' ? 'bg-green-50 border-green-200' :
                txStatus === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <h2 className="text-lg font-semibold mb-4">
                  {txStatus === 'pending' && '⏳ Transaction Pending'}
                  {txStatus === 'success' && '✅ Transaction Successful'}
                  {txStatus === 'error' && '❌ Transaction Failed'}
                </h2>

                {txHash && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Transaction Hash:</div>
                    <a
                      href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:underline break-all"
                    >
                      {txHash} →
                    </a>
                  </div>
                )}

                {txError && (
                  <div className="p-3 bg-red-100 rounded-lg text-red-800 text-sm">
                    <strong>Error:</strong> {txError}
                  </div>
                )}

                {events.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Emitted Events:</div>
                    <div className="space-y-2">
                      {events.map((event: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white rounded-lg text-sm">
                          <strong>{event.name}</strong>
                          <pre className="mt-1 text-xs overflow-x-auto">
                            {JSON.stringify(event.args, (key, value) =>
                              typeof value === 'bigint' ? value.toString() : value
                            , 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>RoomLen Test Interface - Hackathon Demo - Moonbase Alpha Testnet Only</p>
          <p className="mt-1 text-xs">This page is not indexed by search engines and is for testing purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
