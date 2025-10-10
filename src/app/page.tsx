"use client";

import React, { useMemo, useState } from "react";

// RoomLen – MVP landing page (single-file React component)
// Tailwind-first design. Paste into any React/Next project and render.
// Colors are based on the RoomFi/RoomLen palette you defined earlier.

export default function RoomLenLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <BrandTokens />
      <TopBar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <DualTracks />
      <CalculatorSection />
      <SafetySection />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

// -------------------- Design Tokens --------------------
function BrandTokens() {
  return (
    <style>{`
      :root{
        --rf-green:#16A957; --rf-blue:#1297C8; --rf-teal:#16A289;
        --rf-blueTeal:#149AB5; --rf-greenAcc:#15A667;
        --rf-greenP:#ADE0C4; --rf-blueP:#ACDAEB; --rf-tealP:#ADDED5;
        --rf-blueTealP:#ACDBE5; --rf-greenAccP:#ADDFC9;
        --rf-ink:#0F172A; --rf-slate:#334155; --rf-cloud:#CBD5E1; --rf-snow:#F8FAFC;
      }
      .btn{ @apply inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-sm hover:shadow-md transition;
            background: var(--rf-blue); color:white; }
      .btn-outline{ @apply inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold ring-1 transition; 
            color: var(--rf-blue); border-color: transparent; }
      .badge{ @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-slate-200 bg-white; }
      .kpi{ @apply rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200; }
    `}</style>
  );
}

import { useWallet } from "@/lib/WalletProvider";
import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";

// -------------------- Top Bar --------------------
function TopBar(){
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 ring-1 ring-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img 
              src="/roomlenlogo.png" 
              alt="RoomLen Logo" 
              className="h-14 w-auto"
            />
          </a>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#how" className="text-slate-600 hover:text-slate-900">How it works</a>
          <a href="#calc" className="text-slate-600 hover:text-slate-900">Calculator</a>
          <a href="#safety" className="text-slate-600 hover:text-slate-900">Safety</a>
          <a href="#faq" className="text-slate-600 hover:text-slate-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <Link className="btn-outline ring-slate-300 hover:ring-slate-400 hidden sm:inline-flex" href="/owner">Owner</Link>
              <Link className="btn hidden sm:inline-flex" style={{background:"var(--rf-blue)"}} href="/investor">Investor</Link>
            </>
          )}
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}

// -------------------- Hero --------------------
function Hero(){
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{background:"linear-gradient(90deg,var(--rf-greenP),var(--rf-blueP))", opacity:.45}}/>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
            Rent‑backed advances for property owners
          </h1>
          <p className="mt-5 text-lg text-slate-700">
            Convert a signed lease into upfront capital today. Investors receive monthly rent streams via on‑chain escrow. Over‑collateralized, transparent, fraud‑aware.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn" href="#calc">Estimate your advance</a>
            <a className="btn-outline ring-slate-300 hover:ring-slate-400" href="#how">See how it works</a>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="badge">🏆 1st Place – Bitso (DeFi)</span>
            <span className="badge">🥉 3rd – mobil3 by Monad</span>
            <span className="badge">🎯 QED mentorship (soon)</span>
          </div>
        </div>
        <div className="relative">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard(){
  return (
    <div className="kpi">
      <div className="text-sm text-slate-500">Example deal</div>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <KPI label="Monthly rent" value="$10,000 MXN" />
        <KPI label="Term" value="12 months" />
        <KPI label="Advance (est.)" value="$92,000 MXN" emphasized />
        <KPI label="OC / Haircut" value="10% / 10%" />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Upfront cash for the owner. Rent is streamed to the investor each month via escrow.
      </div>
    </div>
  );
}

function KPI({label, value, emphasized}:{label:string, value:string, emphasized?:boolean}){
  return (
    <div className={`rounded-xl border border-slate-100 p-4 ${emphasized?"bg-[var(--rf-greenP)]":"bg-white"}` }>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

// -------------------- Trust strip --------------------
function TrustStrip(){
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <TrustItem title="On‑chain escrow" desc="Transparent flows" icon="🔗"/>
        <TrustItem title="Over‑collateralized" desc="Risk‑aware pricing" icon="🛡️"/>
        <TrustItem title="KYC & docs" desc="Fraud‑aware onboarding" icon="🧾"/>
      </div>
    </div>
  );
}
function TrustItem({title, desc, icon}:{title:string, desc:string, icon:string}){
  return (
    <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-slate-600">{desc}</div>
      </div>
    </div>
  );
}

// -------------------- How it works --------------------
function HowItWorks(){
  const steps = [
    {title:"Tokenize the lease", desc:"Create a LeaseNFT with key terms + signed docs hash.", icon:"📝"},
    {title:"Fund the deal", desc:"An investor provides the advance. Claim rights are issued.", icon:"💸"},
    {title:"Stream the rent", desc:"Monthly rent flows to the investor via escrow.", icon:"🌊"},
    {title:"Settle & close", desc:"At term end, guarantees are released and NFTs are burned.", icon:"✅"},
  ];
  return (
    <section id="how" className="py-16 bg-[var(--rf-snow)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight">How RoomLen works</h2>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Start P2P (one deal ↔ one investor), then graduate to a diversified pool.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s,i)=> (
            <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <div className="mt-1 text-sm text-slate-600">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------- Owners vs Investors --------------------
function DualTracks(){
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <TrackCard
            title="For owners"
            highlights={["Upfront advance against rent","Keep tenants in place","Simple docs & onboarding","Transparent servicing fees"]}
            accent="var(--rf-green)"
          />
          <TrackCard
            title="For investors"
            highlights={["Monthly rent streams","Risk tiers (OC / haircut)","Deal transparency on‑chain","Pool coming soon"]}
            accent="var(--rf-blue)"
          />
        </div>
      </div>
    </section>
  );
}

function TrackCard({title, highlights, accent}:{title:string, highlights:string[], accent:string}){
  return (
    <div className="rounded-3xl ring-1 ring-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-2 w-10 rounded-full" style={{background:accent}} />
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-slate-700 list-disc list-inside">
        {highlights.map((h,i)=> <li key={i}>{h}</li>)}
      </ul>
      <div className="mt-6 flex gap-3">
        <a className="btn" style={{background:accent}} href={title === "For owners" ? "/owner" : "/investor"}>Open App</a>
        <a className="btn-outline ring-slate-300 hover:ring-slate-400" href="#calc">Try calculator</a>
      </div>
    </div>
  );
}

// -------------------- Calculator --------------------
function CalculatorSection(){
  return (
    <section id="calc" className="py-16 bg-[var(--rf-snow)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Advance estimator</h2>
            <p className="mt-2 text-slate-600">Quick estimate based on monthly rent, term, discount, haircut and over‑collateralization (OC). Not an offer.</p>
            <AdvanceCalculator />
          </div>
          <div className="kpi">
            <div className="text-sm text-slate-500">Pricing notes</div>
            <ul className="mt-3 space-y-2 text-slate-700 list-disc list-inside">
              <li>Discount rate is the market monthly rate (time value + risk).</li>
              <li>Haircut covers idiosyncratic risk (tenant/property score).</li>
              <li>OC protects the pool/investor at the deal or vault level.</li>
              <li>IRR shown is investor&apos;s gross estimate before fees/taxes.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdvanceCalculator(){
  const [rent, setRent] = useState(10000);
  const [months, setMonths] = useState(12);
  const [discountMonthlyPct, setDiscountMonthlyPct] = useState(1.5); // % per month
  const [haircutPct, setHaircutPct] = useState(10);
  const [ocPct, setOcPct] = useState(10);

  const results = useMemo(()=>{
    const r = Math.max(0, Number(discountMonthlyPct))/100; // monthly
    const R = Math.max(0, Number(rent));
    const n = Math.max(1, Math.floor(Number(months)));

    // PV of annuity with monthly discount r
    let PV = 0;
    for (let t=1; t<=n; t++) PV += R / Math.pow(1+r, t);

    const haircut = Math.min(99.9, Math.max(0, Number(haircutPct)))/100;
    const oc = Math.min(99.9, Math.max(0, Number(ocPct)))/100;

    const advance = (PV * (1 - haircut)) / (1 + oc);

    // Solve monthly IRR x such that sum(R/(1+x)^t) - advance = 0
    const irrMonthly = bisectionIRR(R, n, advance);
    const irrAPR = Math.pow(1+irrMonthly, 12) - 1; // simple compounding to APR

    return { PV, advance, irrMonthly, irrAPR };
  }, [rent, months, discountMonthlyPct, haircutPct, ocPct]);

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <div className="grid sm:grid-cols-2 gap-5">
        <NumberField label="Monthly rent" value={rent} onChange={setRent} prefix="$" suffix=" MXN" />
        <NumberField label="Term (months)" value={months} onChange={setMonths} />
        <NumberField label="Discount (monthly %)**" value={discountMonthlyPct} onChange={setDiscountMonthlyPct} suffix="%" />
        <NumberField label="Haircut %" value={haircutPct} onChange={setHaircutPct} suffix="%" />
        <NumberField label="OC %" value={ocPct} onChange={setOcPct} suffix="%" />
      </div>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <SummaryCard title="Present Value (PV)" value={fmtCurrency(results.PV)} note="Sum of discounted rents" />
        <SummaryCard title="Advance (est.)" value={fmtCurrency(results.advance)} highlight />
        <SummaryCard title="Investor APR (est.)" value={fmtPct(results.irrAPR)} note="Gross, before fees/taxes" />
      </div>
      <p className="mt-4 text-xs text-slate-500">** Monthly discount rate includes time value and market risk assumptions. This tool is for illustration only and not a financing offer.</p>
    </div>
  );
}

function NumberField({label, value, onChange, prefix, suffix}:{label:string, value:number, onChange:(v:number)=>void, prefix?:string, suffix?:string}){
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="mt-1 flex items-center rounded-xl ring-1 ring-slate-300 bg-white focus-within:ring-2 focus-within:ring-[var(--rf-blue)]">
        {prefix && <span className="pl-3 text-slate-500">{prefix}</span>}
        <input
          type="number"
          className="w-full appearance-none bg-transparent px-3 py-2 outline-none"
          value={Number.isFinite(value)? value: 0}
          onChange={(e)=> onChange(parseFloat(e.target.value || "0"))}
        />
        {suffix && <span className="pr-3 text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}

function SummaryCard({title, value, note, highlight}:{title:string, value:string, note?:string, highlight?:boolean}){
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-slate-200 ${highlight?"bg-[var(--rf-greenP)]":"bg-white"}` }>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
      {note && <div className="text-xs text-slate-500 mt-1">{note}</div>}
    </div>
  );
}

// Bisection solver for IRR (monthly)
function bisectionIRR(R:number, n:number, advance:number){
  let lo = 0, hi = 1; // 0%..100% monthly
  const f = (x:number)=> {
    let s=0; for(let t=1;t<=n;t++) s += R / Math.pow(1+x, t);
    return s - advance;
  };
  // Expand hi if needed
  while (f(hi) > 0 && hi < 5) hi *= 1.5; // up to 500% monthly guard
  for(let i=0;i<80;i++){
    const mid = (lo+hi)/2;
    const val = f(mid);
    if (Math.abs(val) < 1e-7) return mid;
    if (val>0) lo = mid; else hi = mid;
  }
  return (lo+hi)/2;
}

function fmtCurrency(x:number){
  if (!Number.isFinite(x)) return "—";
  return new Intl.NumberFormat("es-MX", {style:"currency", currency:"MXN", maximumFractionDigits:0}).format(x);
}
function fmtPct(x:number){
  if (!Number.isFinite(x)) return "—";
  return (x*100).toFixed(1) + "%";
}

// -------------------- Safety Section --------------------
function SafetySection(){
  const items = [
    {title:"Escrow on‑chain", desc:"Transparent flows with programmatic rules and events."},
    {title:"KYC/AML + e‑sign", desc:"Identity, liveness and document checks."},
    {title:"Fraud‑aware", desc:"OCR/NER on docs, anomaly detection in payment/device patterns."},
    {title:"Over‑collateralized", desc:"Haircuts + OC tiers sized by risk models."},
  ];
  return (
    <section id="safety" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Safety & transparency</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it,i)=> (
            <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="font-semibold">{it.title}</div>
              <div className="text-sm text-slate-600 mt-1">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------- FAQ --------------------
function FAQ(){
  const qa = [
    {q:"Is RoomLen a loan?", a:"It's an advance against lease cash‑flows with rights to collect monthly rent via escrow. Legal structure may vary by jurisdiction."},
    {q:"Who pays the rent?", a:"The tenant continues paying the same rent. The payment instruction points to the escrow that streams to the investor."},
    {q:"What if rent is late?", a:"Grace rules apply. Escrow can draw on guarantees (e.g., security deposit) and trigger default workflows."},
    {q:"P2P or pool?", a:"We start P2P (simple, transparent). A diversified pool (ERC‑4626) comes next."},
  ];
  return (
    <section id="faq" className="py-16 bg-[var(--rf-snow)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight">FAQ</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200 bg-white">
          {qa.map((item,i)=> (
            <details key={i} className="group p-6 open:bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
                <span>{item.q}</span>
                <span className="text-slate-400 group-open:rotate-45 transition">＋</span>
              </summary>
              <p className="mt-3 text-slate-700">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------- CTA & Footer --------------------
function CTA(){
  return (
    <section id="contact" className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Build with us</h2>
        <p className="mt-2 text-slate-700">Owners, investors, and partners—let&apos;s talk. No spam. No hype. Just real cash‑flow rails.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a className="btn" href="#">Contact sales</a>
          <a className="btn-outline ring-slate-300 hover:ring-slate-400" href="#">Get product updates</a>
        </div>
      </div>
    </section>
  );
}

function Footer(){
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg" style={{background:"linear-gradient(135deg,var(--rf-green),var(--rf-blue))"}} />
          <div className="font-bold">RoomLen</div>
        </div>
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} RoomLen. Built from 🇲🇽. &quot;Live. Rent. Earn.&quot;
        </div>
      </div>
    </footer>
  );
}
