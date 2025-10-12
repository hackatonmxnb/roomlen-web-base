"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CHAIN_ID, RPC_URL, CHAIN_NAME } from '@/lib/contractAddresses';

interface WalletGuideProps {
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLDivElement>;
}

export function WalletGuide({ onClose, buttonRef }: WalletGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (currentStep === 0 && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setSpotlightPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  }, [currentStep, buttonRef]);

  const steps = [
    {
      title: "¡Bienvenido a RoomLen!",
      description: "Te vamos a guiar paso a paso para que conectes tu billetera digital. Es súper fácil, ¡solo sigue las instrucciones!",
      icon: "👋",
      iconType: "emoji",
      action: null,
      spotlight: true
    },
    {
      title: "Instala MetaMask",
      description: "MetaMask es la wallet más popular y segura. Es una extensión gratuita para tu navegador.",
      icon: "/metammask_logo.png",
      iconType: "image",
      action: (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-orange-500 hover:bg-orange-600 text-white w-full flex items-center justify-center gap-2"
        >
          <img src="/metammask_logo.png" alt="MetaMask" className="h-5 w-auto" />
          Descargar MetaMask →
        </a>
      )
    },
    {
      title: "Agrega la red Paseo",
      description: "RoomLen funciona en la red Paseo de Polkadot. Es gratis y seguro. Haz click en el botón para agregar la red automáticamente.",
      icon: "🌐",
      iconType: "emoji",
      action: (
        <button
          onClick={async () => {
            try {
              if (!window.ethereum) {
                alert('Por favor instala MetaMask primero');
                return;
              }

              await (window.ethereum as any).request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: CHAIN_NAME,
                  nativeCurrency: {
                    name: 'PAS',
                    symbol: 'PAS',
                    decimals: 18
                  },
                  rpcUrls: [RPC_URL],
                  blockExplorerUrls: ['https://blockscout-passet-hub.parity-testnet.parity.io']
                }]
              });

              alert('¡Red agregada exitosamente! 🎉');
              setCurrentStep(currentStep + 1);
            } catch (error: any) {
              console.error('Error adding network:', error);
              alert(`Error: ${error.message || 'No se pudo agregar la red'}`);
            }
          }}
          className="btn bg-blue-600 hover:bg-blue-700 text-white w-full"
        >
          ✨ Agregar Red Paseo (1 click)
        </button>
      )
    },
    {
      title: "Consigue tokens PAS gratis",
      description: "Necesitas tokens PAS para pagar las transacciones. Son GRATIS y solo para pruebas. No tienen valor real.",
      icon: "💰",
      iconType: "emoji",
      action: (
        <div className="space-y-3">
          <a
            href="https://faucet.polkadot.io/?parachain=1111"
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            Obtener PAS Gratis →
          </a>
          <p className="text-xs text-slate-500 text-center">
            1. Copia tu dirección de wallet<br />
            2. Pégala en el faucet<br />
            3. Espera 30 segundos ⏱️
          </p>
        </div>
      )
    },
    {
      title: "¡Todo listo!",
      description: "Ya tienes todo configurado. Ahora puedes conectar tu wallet y usar RoomLen sin problemas.",
      icon: "🎉",
      iconType: "emoji",
      action: (
        <button
          onClick={onClose}
          className="btn bg-green-600 hover:bg-green-700 text-white w-full"
        >
          Empezar a usar RoomLen →
        </button>
      )
    }
  ];

  const step = steps[currentStep];

  const getCardPosition = () => {
    if (currentStep === 0 && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: `${rect.bottom + 20}px`,
        left: `${Math.min(rect.left, window.innerWidth - 450)}px`,
        maxWidth: '420px'
      };
    }
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '520px'
    };
  };

  return (
    <>
      {/* Overlay oscuro con spotlight */}
      <div className="fixed inset-0 z-[60]" style={{ pointerEvents: 'none' }}>
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {step.spotlight && spotlightPosition.width > 0 && (
                <rect
                  x={spotlightPosition.left - 8}
                  y={spotlightPosition.top - 8}
                  width={spotlightPosition.width + 16}
                  height={spotlightPosition.height + 16}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            className="transition-all duration-500"
          />
        </svg>
      </div>

      {/* Borde animado alrededor del spotlight */}
      {step.spotlight && spotlightPosition.width > 0 && (
        <div
          className="fixed z-[61] pointer-events-none"
          style={{
            top: spotlightPosition.top - 8,
            left: spotlightPosition.left - 8,
            width: spotlightPosition.width + 16,
            height: spotlightPosition.height + 16,
          }}
        >
          <div className="w-full h-full rounded-2xl border-4 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
        </div>
      )}

      {/* Card de la guía */}
      <div
        className="fixed z-[62] animate-fade-in"
        style={getCardPosition()}
      >
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-6 w-full">
          {/* Flecha apuntando al botón (solo en paso 1) */}
          {currentStep === 0 && (
            <div className="absolute -top-3 left-8 w-6 h-6 bg-blue-500 transform rotate-45 border-t-2 border-l-2 border-blue-500"></div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition"
          >
            ×
          </button>

          <div className="text-center mb-5">
            <div className="mb-3 flex items-center justify-center">
              {step.iconType === 'emoji' ? (
                <div className="text-5xl animate-bounce">{step.icon}</div>
              ) : (
                <img src={step.icon} alt={step.title} className="h-20 w-auto animate-bounce" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
          </div>

          <div className="mb-5">
            {step.action}
          </div>

          {/* Indicadores de progreso */}
          <div className="flex gap-2 justify-center mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-blue-600 w-8' :
                  index < currentStep ? 'bg-green-500 w-2' :
                  'bg-slate-300 w-2'
                }`}
              />
            ))}
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const newStep = Math.max(0, currentStep - 1);
                setCurrentStep(newStep);
              }}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>

            <div className="text-xs font-semibold text-slate-500">
              Paso {currentStep + 1} de {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  const newStep = currentStep + 1;
                  setCurrentStep(newStep);
                }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ¡Listo! ✨
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click en overlay para cerrar */}
      <div
        className="fixed inset-0 z-[59]"
        onClick={onClose}
      />
    </>
  );
}

// Componente para mostrar en el botón de wallet cuando no está conectado
export function WalletHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-blue-600 hover:text-blue-700 underline"
    >
      ¿Primera vez? Ver guía →
    </button>
  );
}
