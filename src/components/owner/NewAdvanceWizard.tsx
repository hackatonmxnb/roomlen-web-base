"use client";

import React, { useState, useMemo } from "react";
import { formatMXN } from "@/lib/owner/utils";
import { calculateAdvance } from "@/lib/owner/utils";
import type { NewAdvanceForm } from "@/lib/owner/types";

interface NewAdvanceWizardProps {
  onClose: () => void;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        className="mt-1 w-full rounded-xl ring-1 ring-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function NumberField({ 
  label, 
  value, 
  onChange, 
  prefix, 
  suffix 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  prefix?: string; 
  suffix?: string; 
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="mt-1 flex items-center rounded-xl ring-1 ring-slate-300">
        {prefix && <span className="pl-3 text-slate-500">{prefix}</span>}
        <input
          type="number"
          className="w-full bg-transparent px-3 py-2 outline-none"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
        />
        {suffix && <span className="pr-3 text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}

function Summary({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-slate-200 ${highlight ? "bg-[var(--rf-mint)]" : "bg-white"}`}>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

export function NewAdvanceWizard({ onClose }: NewAdvanceWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<NewAdvanceForm>({
    property: "",
    location: "",
    tenant: "",
    rent: 9000,
    termMonths: 12,
    discountMonthlyPct: 1.5,
    haircutPct: 10,
    ocPct: 10,
  });

  const calc = useMemo(() => calculateAdvance(form), [form]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold">New advance · Step {step}/4</div>
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="p-6 grid gap-6">
          {step === 1 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-semibold mb-2">1) Property & tenant</div>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Property" value={form.property} onChange={(v) => setForm({ ...form, property: v })} />
                <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
                <Field label="Tenant name" value={form.tenant} onChange={(v) => setForm({ ...form, tenant: v })} />
                <NumberField
                  label="Monthly rent"
                  value={form.rent}
                  onChange={(v) => setForm({ ...form, rent: v })}
                  prefix="$"
                  suffix=" MXN"
                />
                <NumberField
                  label="Term (months)"
                  value={form.termMonths}
                  onChange={(v) => setForm({ ...form, termMonths: v })}
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-semibold mb-2">2) Lease & documents</div>
              <ul className="text-sm text-slate-700 list-disc list-inside">
                <li>Upload signed lease (PDF, all pages)</li>
                <li>Tenant ID + proof of income</li>
                <li>IBAN/CLABE for payouts</li>
              </ul>
              <div className="mt-3">
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200">
                  Upload files
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-semibold mb-2">3) Terms (estimate)</div>
              <div className="grid md:grid-cols-3 gap-3">
                <NumberField
                  label="Discount (monthly %)"
                  value={form.discountMonthlyPct}
                  onChange={(v) => setForm({ ...form, discountMonthlyPct: v })}
                  suffix="%"
                />
                <NumberField
                  label="Haircut %"
                  value={form.haircutPct}
                  onChange={(v) => setForm({ ...form, haircutPct: v })}
                  suffix="%"
                />
                <NumberField
                  label="OC %"
                  value={form.ocPct}
                  onChange={(v) => setForm({ ...form, ocPct: v })}
                  suffix="%"
                />
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <Summary title="PV of rents" value={formatMXN(calc.PV)} />
                <Summary title="Advance (est.)" value={formatMXN(calc.advance)} highlight />
                <Summary title="Fees (placeholder)" value="1.0%" />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Illustrative only; final terms depend on risk scoring and market conditions.
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-semibold mb-2">4) Escrow & payout</div>
              <ul className="text-sm text-slate-700 list-disc list-inside">
                <li>Escrow chain: <b>Base</b> • Currency: <b>USDC</b></li>
                <li>Payout account: <b>Bank ****1234</b></li>
                <li>Security deposit: <b>Will be locked as part of OC</b></li>
              </ul>
              <div className="mt-3 flex gap-2">
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200">
                  Simulate stream
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                >
                  Publish for offers
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">Save draft anytime; docs are hashed on upload.</div>
          <div className="flex gap-2">
            {step > 1 && (
              <button
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition ring-1 ring-slate-200"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                onClick={() => setStep(step + 1)}
              >
                Continue
              </button>
            )}
            {step === 4 && (
              <button
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-green-600 text-white"
                onClick={onClose}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
