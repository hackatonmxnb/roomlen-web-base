import React, { useMemo, useState } from "react";

// RoomLen — Investor Dashboard (MVP)
// Single-file React component (Next.js friendly). Tailwind-first, no external deps.
// Sections: Topbar, Portfolio KPIs, Positions, Cashflow, Marketplace, Deal Drawer.

export default function RoomLenInvestorDashboard() {
  const [tab, setTab] = useState("portfolio");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ tier: "all", term: "all" });
  const [selected, setSelected] = useState(null);

  const positions = useMemo(() => SAMPLE_POSITIONS, []);
  const offers = useMemo(() => SAMPLE_OFFERS, []);

  const portfolio = useMemo(() => summarize(positions), [positions]);

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const q = query.toLowerCase();
      const matchQ = [o.property, o.location, o.chain, o.currency].some((x) =>
        x.toLowerCase().includes(q)
      );
      const matchTier = filters.tier === "all" || o.riskTier === filters.tier;
      const matchTerm =
        filters.term === "all" ||
        (filters.term === "short" && o.termMonths <= 6) ||
        (filters.term === "med" && o.termMonths > 6 && o.termMonths <= 12) ||
        (filters.term === "long" && o.termMonths > 12);
      return matchQ && matchTier && matchTerm;
    });
  }, [offers, query, filters]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <BrandTokens />
      <Topbar tab={tab} onTab={setTab} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {tab === "portfolio" && (
          <>
            <KPIBar portfolio={portfolio} />
            <CashflowStrip portfolio={portfolio} />
            <PositionsTable positions={positions} onOpen={setSelected} />
          </>
        )}

        {tab === "market" && (
          <>
            <MarketFilters
              query={query}
              setQuery={setQuery}
              filters={filters}
              setFilters={setFilters}
            />
            <OfferGrid offers={filteredOffers} onOpen={setSelected} />
          </>
        )}
      </main>

      {selected && (
        <DealDrawer deal={selected} onClose={() => setSelected(null)} />
      )}

      <Footer />
    </div>
  );
}

// -------------------- Tokens / styles --------------------
function BrandTokens() {
  return (
    <style>{`
      :root{
        --rf-green:#16A957; --rf-blue:#1297C8; --rf-teal:#16A289; --rf-blueTeal:#149AB5;
        --rf-mint:#ADE0C4; --rf-sky:#ACDBE5; --rf-ink:#0F172A; --rf-slate:#334155;
        --rf-cloud:#CBD5E1; --rf-snow:#F8FAFC;
      }
      .card{ @apply rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200; }
      .pill{ @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white; }
      .btn{ @apply inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition; }
      .btn-primary{ background: var(--rf-blue); color:white; }
      .btn-ghost{ @apply ring-1 ring-slate-200; }
      .hicon{ background: linear-gradient(135deg,var(--rf-mint),var(--rf-sky)); }
    `}</style>
  );
}

// -------------------- Topbar --------------------
function Topbar({ tab, onTab }){
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/75 ring-1 ring-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl hicon" />
          <div className="font-extrabold tracking-tight text-xl">
            <span style={{ color: "var(--rf-ink)" }}>Room</span>
            <span style={{ color: "var(--rf-blue)" }}>Len</span>
          </div>
          <span className="pill ml-3">Investor</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <button
            onClick={() => onTab("portfolio")}
            className={`hover:text-slate-900 ${
              tab === "portfolio" ? "text-slate-900" : "text-slate-600"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => onTab("market")}
            className={`hover:text-slate-900 ${
              tab === "market" ? "text-slate-900" : "text-slate-600"
            }`}
          >
            Marketplace
          </button>
          <span className="text-slate-400">Payments</span>
          <span className="text-slate-400">Settings</span>
        </nav>
        <div className="flex items-center gap-2">
          <span className="pill">KYC ✓</span>
          <span className="pill">Wallet: 0x…b9A</span>
          <button className="btn btn-ghost">Add funds</button>
        </div>
      </div>
    </header>
  );
}

// -------------------- KPIs --------------------
function KPIBar({ portfolio }) {
  const items = [
    { label: "Invested", value: mxn(portfolio.invested) },
    { label: "Monthly income", value: mxn(portfolio.monthlyIncome) },
    { label: "Net IRR (est.)", value: pct(portfolio.netIRR) },
    { label: "Active deals", value: String(portfolio.active) },
  ];
  return (
    <section className="grid md:grid-cols-4 gap-4">
      {items.map((k, i) => (
        <div key={i} className="card">
          <div className="text-sm text-slate-600">{k.label}</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">
            {k.value}
          </div>
        </div>
      ))}
    </section>
  );
}

// -------------------- Cashflow sparkline --------------------
function CashflowStrip({ portfolio }) {
  const months = portfolio.cashflow; // array of {month, income}
  const max = Math.max(...months.map((m) => m.income), 1);
  return (
    <section className="mt-6 card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Projected monthly income</div>
          <div className="text-sm text-slate-600">Next 12 months</div>
        </div>
        <div className="pill">Assumes on-time streams</div>
      </div>
      <div className="mt-3 h-24 w-full relative">
        <svg viewBox={`0 0 ${months.length * 40} 100`} className="w-full h-full">
          {months.map((m, i) => {
            const h = (m.income / max) * 90 + 2;
            return (
              <rect
                key={i}
                x={i * 40 + 6}
                y={100 - h}
                width={24}
                height={h}
                rx={6}
                fill={"#1297C8"}
                opacity={0.85}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}

// -------------------- Positions table --------------------
function PositionsTable({ positions, onOpen }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Your positions</h2>
        <div className="flex items-center gap-2">
          <span className="pill">Base (L2)</span>
          <span className="pill">USDC</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {[
                "Deal",
                "Status",
                "Advance",
                "Rent/mo",
                "IRR est.",
                "Next payment",
                "Stream",
                "",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.property}</div>
                  <div className="text-slate-500">{p.location}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`pill ${
                    p.status === "Active" ? "" : p.status === "Completed" ? "" : "bg-red-50"
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">{mxn(p.advance)}</td>
                <td className="px-4 py-3">{mxn(p.rent)}</td>
                <td className="px-4 py-3">{pct(p.irrAPR)}</td>
                <td className="px-4 py-3">{p.nextPayment}</td>
                <td className="px-4 py-3">
                  <StreamBadge status={p.stream} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="btn btn-ghost" onClick={() => onOpen(p)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StreamBadge({ status }) {
  const map = {
    Healthy: { label: "Healthy", cls: "bg-green-50 text-green-700 ring-green-200" },
    Delayed: { label: "Delayed", cls: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
    Default: { label: "Default", cls: "bg-red-50 text-red-700 ring-red-200" },
  };
  const s = map[status] || map.Healthy;
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

// -------------------- Marketplace --------------------
function MarketFilters({ query, setQuery, filters, setFilters }) {
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

function OfferGrid({ offers, onOpen }) {
  return (
    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {offers.map((o) => (
        <div key={o.id} className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{o.property}</div>
              <div className="text-slate-600 text-sm">{o.location}</div>
            </div>
            <span className="pill">Tier {o.riskTier}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <KV k="Advance" v={mxn(o.advance)} />
            <KV k="Rent/mo" v={mxn(o.rent)} />
            <KV k="IRR est." v={pct(o.irrAPR)} />
            <KV k="Term" v={`${o.termMonths}m`} />
            <KV k="OC/Haircut" v={`${o.ocPct}% / ${o.haircutPct}%`} />
            <KV k="Chain" v={`${o.chain} • ${o.currency}`} />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" onClick={() => onOpen(o)}>Preview & Fund</button>
            <button className="btn btn-ghost" onClick={() => onOpen(o)}>Details</button>
          </div>
        </div>
      ))}
    </section>
  );
}

function KV({ k, v }) {
  return (
    <div>
      <div className="text-slate-500">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

// -------------------- Deal Drawer --------------------
function DealDrawer({ deal, onClose }) {
  const isOffer = Boolean(deal.riskTier); // offers have riskTier; positions may not
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">{deal.property}</div>
            <div className="text-slate-600">{deal.location}</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="font-semibold mb-2">Terms</div>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>Advance: <b>{mxn(deal.advance)}</b></li>
              <li>Rent per month: <b>{mxn(deal.rent)}</b></li>
              <li>Term: <b>{deal.termMonths} months</b></li>
              <li>IRR (est.): <b>{pct(deal.irrAPR)}</b></li>
              <li>OC/Haircut: <b>{deal.ocPct}% / {deal.haircutPct}%</b></li>
              <li>Chain/Currency: <b>{deal.chain}</b> • <b>{deal.currency}</b></li>
            </ul>
          </div>
          <div className="card">
            <div className="font-semibold mb-2">Risk & docs</div>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>Tenant score: <b>{deal.tenantScore || "—"}</b></li>
              <li>Property score: <b>{deal.propertyScore || "—"}</b></li>
              <li>E-sign hash: <b>{deal.esignHash || "0x…"}</b></li>
              <li>Attestations (EAS): <b>{deal.attestations || 3}</b></li>
              <li>Stream status: <b>{deal.stream || deal.streamStatus || "—"}</b></li>
            </ul>
          </div>
          <div className="md:col-span-2 card">
            <div className="font-semibold">Cashflow preview</div>
            <div className="mt-2 text-sm text-slate-600">Projected rent stream (gross, before fees/taxes).</div>
            <DealFlowPreview rent={deal.rent} months={deal.termMonths} />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">Not an offer; informational preview only.</div>
          {isOffer ? (
            <div className="flex gap-2">
              <button className="btn">Simulate</button>
              <button className="btn btn-primary">Fund now</button>
            </div>
          ) : (
            <div className="pill">Position detail</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DealFlowPreview({ rent, months }) {
  const data = Array.from({ length: months }, (_, i) => ({ m: i + 1, v: rent }));
  const max = rent;
  return (
    <div className="mt-3 h-28 w-full">
      <svg viewBox={`0 0 ${months * 36} 100`} className="w-full h-full">
        {data.map((d, i) => {
          const h = (d.v / max) * 90 + 2;
          return (
            <rect key={i} x={i * 36 + 6} y={100 - h} width={24} height={h} rx={6} fill="#16A289" />
          );
        })}
      </svg>
    </div>
  );
}

// -------------------- Footer --------------------
function Footer() {
  return (
    <footer className="py-10 text-center text-sm text-slate-500">© {new Date().getFullYear()} RoomLen — Investor dashboard MVP</footer>
  );
}

// -------------------- Utils & Sample data --------------------
function mxn(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}
function pct(x) {
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(1) + "%";
}

function summarize(positions) {
  const active = positions.filter((p) => p.status === "Active");
  const invested = active.reduce((s, p) => s + p.advance, 0);
  const monthlyIncome = active.reduce((s, p) => s + p.rent, 0);
  const netIRR = avg(active.map((p) => p.irrAPR));
  const cashflow = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: monthlyIncome }));
  return { invested, monthlyIncome, netIRR, active: active.length, cashflow };
}
function avg(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }

const SAMPLE_POSITIONS = [
  {
    id: "p1",
    property: "Loft Reforma 210",
    location: "CDMX • Juárez",
    advance: 89243,
    rent: 10000,
    termMonths: 12,
    irrAPR: 0.77,
    nextPayment: "28 Oct",
    stream: "Healthy",
    status: "Active",
  },
  {
    id: "p2",
    property: "Casa Lomas 34",
    location: "CDMX • Lomas",
    advance: 118000,
    rent: 12000,
    termMonths: 10,
    irrAPR: 0.52,
    nextPayment: "03 Nov",
    stream: "Delayed",
    status: "Active",
  },
  {
    id: "p3",
    property: "Depto Roma Nte 88",
    location: "CDMX • Roma",
    advance: 76000,
    rent: 8000,
    termMonths: 12,
    irrAPR: 0.45,
    nextPayment: "19 Oct",
    stream: "Healthy",
    status: "Completed",
  },
];

const SAMPLE_OFFERS = [
  {
    id: "o1",
    property: "PH Coyoacán 12",
    location: "CDMX • Coyoacán",
    advance: 81200,
    rent: 9000,
    irrAPR: 0.61,
    termMonths: 12,
    ocPct: 10,
    haircutPct: 10,
    chain: "Base",
    currency: "USDC/MXN",
    riskTier: "A",
    tenantScore: "A-",
    propertyScore: "A",
    esignHash: "0x7a…e2",
    attestations: 4,
  },
  {
    id: "o2",
    property: "Loft Condesa 5",
    location: "CDMX • Condesa",
    advance: 65600,
    rent: 7000,
    irrAPR: 0.72,
    termMonths: 9,
    ocPct: 12,
    haircutPct: 8,
    chain: "Base",
    currency: "USDC/MXN",
    riskTier: "B",
    tenantScore: "B+",
    propertyScore: "A-",
    esignHash: "0x3f…91",
    attestations: 3,
  },
  {
    id: "o3",
    property: "Casa Del Valle 27",
    location: "CDMX • Del Valle",
    advance: 124000,
    rent: 13500,
    irrAPR: 0.49,
    termMonths: 15,
    ocPct: 15,
    haircutPct: 12,
    chain: "Base",
    currency: "USDC/MXN",
    riskTier: "A",
    tenantScore: "A",
    propertyScore: "A",
    esignHash: "0xa1…c4",
    attestations: 5,
  },
];
