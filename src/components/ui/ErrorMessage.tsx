"use client";

import React from 'react';

interface ErrorMessageProps {
  error: string | Error;
  title?: string;
  onRetry?: () => void;
  friendly?: boolean;
}

// Mapeo de errores técnicos a mensajes amigables
const FRIENDLY_ERRORS: Record<string, { title: string; message: string; action?: string }> = {
  'user rejected': {
    title: 'Transacción Cancelada',
    message: 'Cancelaste la transacción en tu wallet. No te preocupes, tu dinero está seguro.',
    action: 'Puedes intentar de nuevo cuando quieras'
  },
  'insufficient funds': {
    title: 'Fondos Insuficientes',
    message: 'No tienes suficientes tokens PAS para pagar esta transacción.',
    action: 'Obtén tokens gratis del faucet de Polkadot'
  },
  'network': {
    title: 'Error de Conexión',
    message: 'No pudimos conectar con la blockchain. Puede ser tu internet o la red está ocupada.',
    action: 'Intenta de nuevo en unos segundos'
  },
  'execution reverted': {
    title: 'La Transacción Falló',
    message: 'El contrato rechazó la transacción. Esto puede pasar si los datos son incorrectos o si alguien más ya usó esta propiedad.',
    action: 'Revisa los datos e intenta nuevamente'
  },
  'nonce': {
    title: 'Error de Sincronización',
    message: 'Tu wallet no está sincronizada con la red. Esto pasa cuando haces muchas transacciones rápido.',
    action: 'Espera 10 segundos e intenta de nuevo'
  },
  'gas': {
    title: 'Sin Gas para la Transacción',
    message: 'Necesitas tokens PAS para pagar la transacción. Es como la gasolina para que funcione.',
    action: 'Obtén PAS gratis del faucet'
  },
  'timeout': {
    title: 'Transacción Lenta',
    message: 'La red está tardando más de lo normal. Tu transacción puede estar procesándose todavía.',
    action: 'Espera 1 minuto y revisa el explorador de bloques'
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
    title: 'Algo Salió Mal',
    message: 'Ocurrió un error inesperado. No te preocupes, tu dinero está seguro.',
    action: 'Intenta de nuevo o contáctanos si el problema persiste'
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
                <span className="font-semibold">💡 Qué hacer:</span> {errorDetails.action}
              </p>
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 btn bg-red-600 hover:bg-red-700 text-white"
            >
              Intentar de Nuevo
            </button>
          )}

          {!friendly && (
            <details className="mt-4">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                Ver detalles técnicos →
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
