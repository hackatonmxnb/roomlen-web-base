"use client";

import React from "react";
import { SAMPLE_OWNER_TASKS } from "@/lib/owner/sampleData";

export function OwnerTasks() {
  return (
    <section className="mt-6 grid md:grid-cols-3 gap-4">
      {SAMPLE_OWNER_TASKS.map((t, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.title}</div>
              <div className="text-slate-600 text-sm">{t.desc}</div>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition text-white"
              style={{ background: t.color }}
            >
              {t.cta}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
