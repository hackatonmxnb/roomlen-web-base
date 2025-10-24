"use client";

import React, { useMemo, useState, useEffect } from "react";
import { WelcomeModal } from "@/components/ui/WelcomeModal";

export default function RoomLenLanding() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWalletGuide, setShowWalletGuide] = useState(false);

  // Show welcome modal only the first time
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('roomlen_has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('roomlen_has_seen_welcome', 'true');
    }
  }, []);

  const handleStartTour = () => {
    setShowWelcome(false);
    setShowWalletGuide(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <BrandTokens />
      <TopBar onShowWelcome={() => setShowWelcome(true)} />
      <Hero onShowWelcome={() => setShowWelcome(true)} />
      <TrustStrip />
      <HowItWorks />
      <DualTracks />
      <CalculatorSection />
      <SafetySection />
      <FAQ />
      <CTA />
      <Footer />

      {showWelcome && (
        <WelcomeModal
          onClose={() => setShowWelcome(false)}
          onStartTour={handleStartTour}
        />
      )}
    </div>
  );
}

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
      .btn{ @apply inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105;
            background: var(--rf-blue); color:white; }
      .btn-outline{ @apply inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold ring-1 transition-all duration-200 hover:scale-105;
            color: var(--rf-blue); border-color: transparent; }
      .badge{ @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-slate-200 bg-white; }
      .kpi{ @apply rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow duration-200 hover:shadow-lg; }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse-soft {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.8;
        }
      }

      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }

      .animate-pulse-soft {
        animation: pulse-soft 3s ease-in-out infinite;
      }
    `}</style>
  );
}

import { useWallet } from "@/lib/WalletProvider";
import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";

function TopBar({ onShowWelcome }: { onShowWelcome: () => void }){
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
          <button onClick={onShowWelcome} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            <span>ℹ️</span> First time?
          </button>
        </nav>
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <Link className="btn-outline ring-slate-300 hover:ring-slate-400 hidden sm:inline-flex" href="/owner">I&apos;m an Owner</Link>
              <Link className="btn hidden sm:inline-flex" style={{background:"var(--rf-blue)"}} href="/investor">I want to Invest</Link>
            </>
          )}
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}

function Hero({ onShowWelcome }: { onShowWelcome: () => void }){
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{background:"linear-gradient(90deg,var(--rf-greenP),var(--rf-blueP))", opacity:.45}}/>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          {/* Logo Badge with RoomLen branding */}
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur rounded-2xl shadow-lg mb-6 border-2 border-white/50">
            <img
              src="/roomlenlogo.png"
              alt="RoomLen"
              className="h-8 w-auto"
            />
            <div className="h-6 w-px bg-gradient-to-b from-[#16A957] to-[#1297C8]"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-[#16A957] to-[#1297C8] bg-clip-text text-transparent">
              Live. Rent. Earn.
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
            Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">up to 90%</span> of your future rent TODAY
          </h1>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            Have a signed rental contract? Turn those monthly payments into <strong>immediate cash</strong>.
            No banks. No waiting. No complicated paperwork.
          </p>

          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <div className="font-bold text-green-900 text-lg">Real example:</div>
                <div className="text-green-800 mt-1">
                  Rent of <strong>$10,000/month × 12 months</strong> = Get up to <strong className="text-xl">$92,000 MXN today</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn" href="#calc">Calculate my advance →</a>
            <button onClick={onShowWelcome} className="btn-outline flex items-center gap-2">
              <span>ℹ️</span> How does it work?
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>No bank procedures</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>100% secure & transparent</span>
            </div>
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

function TrustStrip(){
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid sm:grid-cols-3 gap-4">
        <TrustItem title="On‑chain escrow" desc="Transparent flows" icon="🔗" gradient="from-green-500 to-emerald-600"/>
        <TrustItem title="Over‑collateralized" desc="Risk‑aware pricing" icon="🛡️" gradient="from-blue-500 to-cyan-600"/>
        <TrustItem title="KYC & docs" desc="Fraud‑aware onboarding" icon="🧾" gradient="from-teal-500 to-green-600"/>
      </div>
    </div>
  );
}
function TrustItem({title, desc, icon, gradient}:{title:string, desc:string, icon:string, gradient:string}){
  return (
    <div className="group rounded-2xl ring-2 ring-slate-200 hover:ring-[#16A957] bg-white p-6 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-md`}>
        {icon}
      </div>
      <div>
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-sm text-slate-600 mt-1">{desc}</div>
      </div>
    </div>
  );
}

function HowItWorks(){
  const steps = [
    {title:"Tokenize the lease", desc:"Create a LeaseNFT with key terms + signed docs hash.", icon:"📝", color: "from-green-400 to-emerald-500"},
    {title:"Fund the deal", desc:"An investor provides the advance. Claim rights are issued.", icon:"💸", color: "from-blue-400 to-cyan-500"},
    {title:"Stream the rent", desc:"Monthly rent flows to the investor via escrow.", icon:"🌊", color: "from-teal-400 to-green-500"},
    {title:"Settle & close", desc:"At term end, guarantees are released and NFTs are burned.", icon:"✅", color: "from-emerald-500 to-green-600"},
  ];
  return (
    <section id="how" className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#16A957] to-[#1297C8]"></div>
            <img src="/roomlenlogo.png" alt="RoomLen" className="h-8 w-auto" />
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#1297C8] to-[#16A957]"></div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#16A957] to-[#1297C8] bg-clip-text text-transparent">
            How RoomLen works
          </h2>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Start P2P (one deal ↔ one investor), then graduate to a diversified pool.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s,i)=> (
            <div key={i} className="group rounded-3xl bg-white p-6 ring-2 ring-slate-200 hover:ring-[#16A957] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} text-3xl shadow-lg mb-4`}>
                {s.icon}
              </div>
              <div className="mt-3 font-bold text-lg text-slate-900">{s.title}</div>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</div>

              {/* Step number */}
              <div className="mt-4 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#16A957] to-[#1297C8] text-white font-bold text-sm">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DualTracks(){
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#16A957] to-[#1297C8] bg-clip-text text-transparent">
            Choose your path
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Whether you own property or want to invest, RoomLen has you covered
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <TrackCard
            title="For owners"
            highlights={["Upfront advance against rent","Keep tenants in place","Simple docs & onboarding","Transparent servicing fees"]}
            accent="#16A957"
            icon="🏠"
          />
          <TrackCard
            title="For investors"
            highlights={["Monthly rent streams","Risk tiers (OC / haircut)","Deal transparency on‑chain","Pool coming soon"]}
            accent="#1297C8"
            icon="📈"
          />
        </div>
      </div>
    </section>
  );
}

function TrackCard({title, highlights, accent, icon}:{title:string, highlights:string[], accent:string, icon:string}){
  return (
    <div className="group rounded-3xl ring-2 ring-slate-200 hover:ring-[#16A957] bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
          style={{background: `linear-gradient(135deg, ${accent}, ${accent}dd)`}}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <div className="h-1 w-16 rounded-full mt-2" style={{background:accent}} />
        </div>
      </div>

      {/* Features list */}
      <ul className="space-y-3 mb-8">
        {highlights.map((h,i)=> (
          <li key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md" style={{background:accent}}>
              ✓
            </div>
            <span className="text-slate-700 flex-1">{h}</span>
          </li>
        ))}
      </ul>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <a
          className="btn text-center text-lg font-bold py-4 shadow-lg hover:shadow-xl transition-all"
          style={{background: `linear-gradient(135deg, ${accent}, ${accent}dd)`}}
          href={title === "For owners" ? "/owner" : "/investor"}
        >
          Open App →
        </a>
        <a className="btn-outline ring-2 text-center font-semibold py-3" style={{borderColor: accent, color: accent}} href="#calc">
          Try calculator
        </a>
      </div>
    </div>
  );
}

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
    <footer className="border-t-2 border-slate-200 bg-gradient-to-b from-white to-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          {/* Logo and branding */}
          <div className="flex items-center gap-4">
            <img src="/roomlenlogo.png" alt="RoomLen" className="h-12 w-auto" />
            <div>
              <div className="font-bold text-lg text-slate-900">RoomLen</div>
              <div className="text-sm text-slate-600 italic">&quot;Live. Rent. Earn.&quot;</div>
            </div>
          </div>

          {/* Built with */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <span>Built from</span>
              <span className="text-lg">🇲🇽</span>
              <span>&</span>
              <span className="text-lg">🇧🇴</span>
            </div>

            {/* Built on Base */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl ring-1 ring-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-600">Built on</span>
              <img
                src="/base_logo_blue.png"
                alt="Base"
                className="h-6 w-auto"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-[#16A957] via-slate-300 to-[#1297C8] mb-6"></div>

        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>
            © {new Date().getFullYear()} RoomLen. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#16A957] transition">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-[#1297C8] transition">Terms</a>
            <span>•</span>
            <a href="https://github.com/hackatonmxnb/roomlen-web" target="_blank" rel="noopener noreferrer" className="hover:text-[#16A957] transition">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
