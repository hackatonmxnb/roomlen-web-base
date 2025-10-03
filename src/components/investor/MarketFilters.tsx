import React from "react";
import type { Filters } from "@/lib/investor/types";

interface MarketFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export function MarketFilters({
  query,
  setQuery,
  filters,
  setFilters,
}: MarketFiltersProps) {
  return (
    <section className="mb-4 flex flex-wrap items-center gap-2">
      <input
        placeholder="Search by city, chain, currency…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:w-72 rounded-xl ring-1 ring-slate-300 px-3 py-2"
      />
      <select
        value={filters.tier}
        onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
        className="rounded-xl ring-1 ring-slate-300 px-3 py-2"
      >
        <option value="all">Risk tier: All</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>
      <select
        value={filters.term}
        onChange={(e) => setFilters({ ...filters, term: e.target.value })}
        className="rounded-xl ring-1 ring-slate-300 px-3 py-2"
      >
        <option value="all">Term: All</option>
        <option value="short">≤ 6m</option>
        <option value="med">7–12m</option>
        <option value="long">12m+</option>
      </select>
    </section>
  );
}
