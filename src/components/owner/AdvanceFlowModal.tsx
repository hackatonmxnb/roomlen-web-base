"use client";

import React from "react";
import { formatMXN } from "@/lib/owner/utils";
import type { Lease } from "@/lib/owner/types";

interface AdvanceFlowModalProps {
  flow: {
    open: boolean;
    step: number;
    lease: Lease | null;
    ai: any;
    published: boolean;
    busy: boolean;
  };
  setFlow: (updater: (prev: any) => any) => void;
  onClose: () => void;
  onImport: () => void;
  onRunAI: () => void;
  onPublish: () => void;
}

function Summary({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-slate-200 ${highlight ? "bg-[var(--rf-mint)]" : "bg-white"}`}>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

export function AdvanceFlowModal({ flow, setFlow, onClose, onImport, onRunAI, onPublish }: AdvanceFlowModalProps) {
  const l = flow.lease;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold">Get advance — Step {flow.step}/2</div>
          <button 
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-auto">
          {flow.step === 1 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-semibold mb-2">1) Confirm lease (import)</div>
              <div className="text-sm text-slate-700">We found this lease from RoomFi:</div>
              <div className="mt-2 rounded-xl ring-1 ring-slate-200 p-4">
                <div className="font-semibold">{l?.property}</div>
                <div className="text-slate-600 text-sm">
                  {l?.location} • Rent {formatMXN(l?.rent || 0)} / mo • Term {l?.termMonths} m
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                  onClick={onImport}
                >
                  Import from RoomFi
                </button>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200">
                  Upload lease PDF
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500">Consent to redirect monthly rent to escrow when funded.</div>
            </div>
          )}
          
          {flow.step === 2 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-semibold mb-2">2) AI evaluation (fixed tier & terms)</div>
              {!flow.ai ? (
                <div>
                  <div className="text-sm text-slate-700">Click evaluate to get your Tier and fixed terms.</div>
                  <button 
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white mt-3"
                    onClick={onRunAI}
                  >
                    Evaluate with AI
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
                      Tier {flow.ai.tier}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
                      Haircut {flow.ai.haircutPct}%
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
                      OC {flow.ai.ocPct}%
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
                      Score {flow.ai.score}
                    </span>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-3 gap-4">
                    <Summary title="PV of rents" value={formatMXN(flow.ai.PV)} />
                    <Summary title="You receive" value={formatMXN(flow.ai.advance)} highlight />
                    <Summary title="Investor APR (est.)" value={flow.ai.irrAPR + "%"} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Automatic estimation; not a binding offer. Publish to receive offers.</p>
                  <div className="mt-3 flex gap-2">
                    <button 
                      className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                      onClick={onPublish} 
                      disabled={flow.busy}
                    >
                      {flow.busy ? "Publishing…" : "Publish to marketplace"}
                    </button>
                    {flow.published && (
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
                        Published ✓
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">Docs are hashed on upload · Escrow on PAS</div>
          <div className="flex gap-2">
            {flow.step > 1 && (
              <button 
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
                onClick={() => setFlow((f) => ({ ...f, step: f.step - 1 }))}
              >
                Back
              </button>
            )}
            {flow.step < 2 && (
              <button 
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                onClick={() => setFlow((f) => ({ ...f, step: f.step + 1 }))}
              >
                Continue
              </button>
            )}
            {flow.step === 2 && (
              <button 
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
                onClick={onClose}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
