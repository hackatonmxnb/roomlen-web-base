"use client";

import React from 'react';

interface ErrorMessageProps {
  error: string | Error;
  title?: string;
  onRetry?: () => void;
  friendly?: boolean;
}

// Mapping of technical errors to user-friendly messages
const FRIENDLY_ERRORS: Record<string, { title: string; message: string; action?: string }> = {
  'user rejected': {
    title: 'Transaction Cancelled',
    message: 'You cancelled the transaction in your wallet. Don\'t worry, your funds are safe.',
    action: 'You can try again whenever you want'
  },
  'insufficient funds': {
    title: 'Insufficient Funds',
    message: 'You don\'t have enough ETH tokens to pay for this transaction.',
    action: 'Get free tokens from the Base faucet'
  },
  'network': {
    title: 'Connection Error',
    message: 'We couldn\'t connect to the blockchain. It might be your internet or the network is busy.',
    action: 'Try again in a few seconds'
  },
  'execution reverted': {
    title: 'Transaction Failed',
    message: 'The contract rejected the transaction. This can happen if the data is incorrect or if someone else already used this property.',
    action: 'Review the data and try again'
  },
  'nonce': {
    title: 'Synchronization Error',
    message: 'Your wallet is not synchronized with the network. This happens when you make many transactions quickly.',
    action: 'Wait 10 seconds and try again'
  },
  'gas': {
    title: 'Out of Gas',
    message: 'You need ETH tokens to pay for the transaction. It\'s like gas to make it work.',
    action: 'Get free ETH from the Base faucet'
  },
  'timeout': {
    title: 'Slow Transaction',
    message: 'The network is taking longer than normal. Your transaction might still be processing.',
    action: 'Wait 1 minute and check the block explorer'
  }
};

function getFriendlyError(error: string | Error): { title: string; message: string; action?: string } {
  const errorStr = typeof error === 'string' ? error.toLowerCase() : error.message.toLowerCase();

  for (const [key, value] of Object.entries(FRIENDLY_ERRORS)) {
    if (errorStr.includes(key)) {
      return value;
    }
  }

  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Don\'t worry, your funds are safe.',
    action: 'Try again or contact us if the problem persists'
  };
}

export function ErrorMessage({ error, title, onRetry, friendly = true }: ErrorMessageProps) {
  const errorDetails = friendly ? getFriendlyError(error) : null;
  const displayTitle = title || errorDetails?.title || 'Error';
  const errorMessage = typeof error === 'string' ? error : error.message;
  const displayMessage = errorDetails?.message || errorMessage;

  return (
    <div className="rounded-xl bg-red-50 border-2 border-red-200 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="flex-grow">
          <h3 className="font-bold text-red-900 text-lg mb-2">{displayTitle}</h3>
          <p className="text-red-800 mb-3">{displayMessage}</p>

          {errorDetails?.action && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                <span className="font-semibold">💡 What to do:</span> {errorDetails.action}
              </p>
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 btn bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </button>
          )}

          {!friendly && (
            <details className="mt-4">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                View technical details →
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded-lg text-xs text-red-900 overflow-x-auto">
                {errorMessage}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar éxito
export function SuccessMessage({
  title,
  message,
  action
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-green-50 border-2 border-green-200 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex-grow">
          <h3 className="font-bold text-green-900 text-lg mb-2">{title}</h3>
          <p className="text-green-800 mb-3">{message}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}
