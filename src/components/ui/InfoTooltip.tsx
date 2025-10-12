"use client";

import React, { useState } from 'react';

interface InfoTooltipProps {
  title: string;
  description: string;
  example?: string;
}

export function InfoTooltip({ title, description, example }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-help"
        aria-label={`Información sobre ${title}`}
      >
        ?
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 p-4 bg-white rounded-xl shadow-xl border border-slate-200 -top-2 left-6 transform animate-fade-in">
          <div className="absolute -left-2 top-3 w-3 h-3 bg-white border-l border-t border-slate-200 transform rotate-45"></div>

          <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>
          <p className="text-sm text-slate-600 mb-2">{description}</p>

          {example && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Ejemplo:</span> {example}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Glosario de términos financieros en español simple
export const FINANCIAL_TERMS = {
  advance: {
    title: "Anticipo",
    description: "Es el dinero que recibes HOY por adelantado. En lugar de esperar mes a mes tu renta, te damos un pago único ahora.",
    example: "Si tu inquilino paga $10,000/mes por 12 meses, puedes recibir hasta $92,000 hoy mismo."
  },
  haircut: {
    title: "Descuento de Seguridad",
    description: "Es un pequeño porcentaje que se resta para proteger a los inversionistas del riesgo. Entre mejor sea tu historial de pagos, menor será este descuento.",
    example: "Con 10% de descuento: Si tu renta total es $120,000, el cálculo empieza desde $108,000."
  },
  oc: {
    title: "Garantía Extra",
    description: "Over-Collateralization (OC) significa que tu propiedad vale más que el dinero que recibes. Esto da confianza a los inversionistas.",
    example: "Si recibes $90,000, tu contrato de renta debe valer al menos $99,000."
  },
  irr: {
    title: "Ganancia Anual",
    description: "IRR (Tasa Interna de Retorno) es cuánto gana el inversionista al año. Es como los intereses de un préstamo, pero al revés.",
    example: "15% anual significa que por cada $100,000 que invierten, ganan $15,000 al año."
  },
  riskTier: {
    title: "Nivel de Confianza",
    description: "Según tu historial de pagos e información, te asignamos una letra: A (excelente), B (bueno) o C (regular). Mejor letra = mejores condiciones.",
    example: "Nivel A: Pagas siempre a tiempo, tienes depósito, buen contrato → obtienes hasta 90% de anticipo."
  },
  trr: {
    title: "Token de Recibo de Renta",
    description: "Es un certificado digital (NFT) que prueba que invertiste en una propiedad. Lo puedes vender si necesitas tu dinero antes.",
    example: "Como un pagaré tradicional, pero digital y que puedes vender en Kodadot."
  },
  termMonths: {
    title: "Plazo del Contrato",
    description: "Es por cuántos meses está firmado tu contrato de renta. Mientras más largo, más anticipo puedes recibir.",
    example: "Contrato de 12 meses = 12 pagos mensuales de renta que puedes adelantar."
  },
  monthlyRent: {
    title: "Renta Mensual",
    description: "Es el dinero que tu inquilino te paga cada mes por vivir en tu propiedad.",
    example: "$10,000 MXN que tu inquilino deposita el día 1 de cada mes."
  },
  tenantScore: {
    title: "Calificación del Inquilino",
    description: "Un número de 0 a 100 que mide qué tan confiable es tu inquilino basado en su historial de pagos, ingresos y referencias.",
    example: "85 puntos = Excelente inquilino que siempre paga a tiempo."
  },
  escrow: {
    title: "Cuenta Protegida",
    description: "Es como una cuenta bancaria segura donde se guarda el dinero hasta que todo esté correcto. Nadie puede tocar el dinero hasta que se cumplan las condiciones.",
    example: "Tu inquilino paga la renta → Se guarda en escrow → Se libera al inversionista automáticamente."
  }
};
