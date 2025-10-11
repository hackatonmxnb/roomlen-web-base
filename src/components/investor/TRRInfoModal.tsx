"use client";

import type { Position } from "@/lib/investor/types";
import { lenderReceiptNftAddress } from "@/lib/contractAddresses";

interface TRRInfoModalProps {
  position: Position;
  onClose: () => void;
}

export const TRRInfoModal = ({ position, onClose }: TRRInfoModalProps) => {
  const openseaUrl = `https://testnets.opensea.io/assets/moonbase/${lenderReceiptNftAddress}/${position.id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <h3 className="text-xl font-semibold text-slate-900">Your Digital Asset: TRR Token</h3>
        <p className="mt-2 text-sm text-slate-600">
          This is an NFT (Non-Fungible Token) that represents your investment in the loan for the property <strong>{position.property}</strong>. 
          It's a unique digital asset that you can transfer, sell, or use on other DeFi platforms.
        </p>

        <div className="mt-6">
          <h4 className="font-semibold text-slate-800">What can you do with your TRR?</h4>
          <div className="mt-4 space-y-4">
            <a 
              href={openseaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-semibold transition-colors"
            >
              Sell on OpenSea
            </a>
            <a 
              href="#" 
              onClick={() => alert("Coming soon: We'll integrate with lending protocols so you can use your TRR as collateral.")}
              className="block w-full text-center px-4 py-3 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-semibold transition-colors"
            >
              Use as Collateral (Coming Soon)
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          By selling this NFT, you transfer your right to receive future payments from this loan to the buyer.
        </p>
      </div>
    </div>
  );
};
