"use client";

import React from "react";

export function TipsCard() {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="font-semibold">Tips</div>
      <ul className="mt-2 text-sm text-slate-700 list-disc list-inside">
        <li>Upload the full lease PDF with signatures to speed up the AI score.</li>
        <li>Security deposit helps lower OC; renewals improve on-time score.</li>
        <li>Keep tenant contact updated for smooth rent streaming.</li>
      </ul>
    </section>
  );
}
