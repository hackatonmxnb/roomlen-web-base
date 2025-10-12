"use client";

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', message, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-green-600 rounded-full animate-spin`}></div>
        <img
          src="/roomlenlogo.png"
          alt="RoomLen"
          className={`absolute inset-0 m-auto ${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} opacity-50`}
        />
      </div>
      {message && (
        <p className="text-slate-600 font-medium text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface TransactionStepsProps {
  steps: Array<{
    label: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
  }>;
}

export function TransactionSteps({ steps }: TransactionStepsProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {step.status === 'completed' && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {step.status === 'loading' && (
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            )}
            {step.status === 'error' && (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {step.status === 'pending' && (
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-slate-400 text-sm font-bold">{index + 1}</span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <p className={`font-medium ${
              step.status === 'completed' ? 'text-green-700' :
              step.status === 'loading' ? 'text-blue-700' :
              step.status === 'error' ? 'text-red-700' :
              'text-slate-400'
            }`}>
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
