"use client";

import React, { useEffect, useState } from 'react';

interface WelcomeModalProps {
  onClose: () => void;
  onStartTour: () => void;
}

export function WelcomeModal({ onClose, onStartTour }: WelcomeModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to RoomLen! 🏠",
      subtitle: "Cash advances backed by your rental contract",
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 leading-relaxed">
            RoomLen helps you <span className="font-bold text-green-600">get immediate cash</span> using
            your rental contract as collateral.
          </p>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="font-semibold text-green-900 mb-2">How does it work?</div>
            <div className="text-sm text-green-800 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">💰</span>
                <div>
                  <strong>If you&apos;re an owner:</strong> Get up to 90% of your future rent TODAY
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">📈</span>
                <div>
                  <strong>If you&apos;re an investor:</strong> Earn 15-28% annual returns
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600">
            No complicated paperwork. No waiting weeks. Everything automatic.
          </div>
        </div>
      ),
      icon: "🏠"
    },
    {
      title: "Is it secure? 🔒",
      subtitle: "Blockchain technology = total transparency",
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 leading-relaxed">
            We use <span className="font-semibold">blockchain technology</span> (like a digital ledger
            that nobody can modify) to guarantee that:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-semibold text-blue-900">Everything is recorded</div>
                <div className="text-sm text-blue-700">Every transaction is public and verifiable</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="font-semibold text-purple-900">Your money is protected</div>
                <div className="text-sm text-purple-700">Smart contracts protect automatically</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-2xl">🚀</span>
              <div>
                <div className="font-semibold text-green-900">Fast and automatic</div>
                <div className="text-sm text-green-700">No middlemen, no delays</div>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: "🔒"
    },
    {
      title: "Do I need experience? 🤔",
      subtitle: "Not at all! We guide you step by step",
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 leading-relaxed">
            You don&apos;t need to know anything about cryptocurrencies or blockchain. We&apos;ll guide you through each step:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-semibold text-slate-900">Install your digital wallet</div>
                <div className="text-sm text-slate-600">Like a banking app, but for crypto</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-semibold text-slate-900">Connect with RoomLen</div>
                <div className="text-sm text-slate-600">Just one click, super easy</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-semibold text-slate-900">Ready to use!</div>
                <div className="text-sm text-slate-600">Get your advance or invest in minutes</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="font-semibold text-yellow-900">It only takes 5 minutes to set everything up</div>
            <div className="text-sm text-yellow-700 mt-1">And you can do it right now!</div>
          </div>
        </div>
      ),
      icon: "🤔"
    }
  ];

  const currentStep = steps[step];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] animate-fade-in" />

      {/* Modal */}
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Header con logo RoomLen */}
          <div className="relative bg-gradient-to-br from-[#16A957] to-[#1297C8] text-white p-8 rounded-t-3xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-xl transition"
            >
              ×
            </button>

            <div className="text-center">
              {/* Logo de RoomLen animado */}
              <div className="mb-4 flex justify-center">
                <div className="bg-white rounded-2xl p-3 shadow-lg animate-pulse">
                  <img
                    src="/roomlenlogo.png"
                    alt="RoomLen Logo"
                    className="h-16 w-auto"
                  />
                </div>
              </div>
              <h2 className="text-3xl font-bold">{currentStep.title}</h2>
              <p className="text-white/90 mt-2">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {currentStep.content}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 px-8 pb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === step
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 w-8'
                    : 'bg-slate-300 w-2 hover:w-4'
                }`}
              />
            ))}
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-slate-200 p-6 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-6 py-3 text-slate-600 hover:text-slate-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>

            <div className="text-sm font-medium text-slate-500">
              {step + 1} of {steps.length}
            </div>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
              >
                Next →
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-slate-600 hover:text-slate-900 font-semibold transition"
                >
                  Explore alone
                </button>
                <button
                  onClick={onStartTour}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center gap-2"
                >
                  <span>Start guide</span>
                  <span>🚀</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
