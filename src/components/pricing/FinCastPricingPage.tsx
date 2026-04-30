"use client";

import { useState } from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { Check, CreditCard, Mail, Tag } from "lucide-react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  display: "swap",
});

const starterFeatures = [
  "Full Monte Carlo report",
  "PDF export",
  "Risk score breakdown",
  "Email delivery",
];

const proFeatures = [
  "Everything in Starter",
  "Scenario comparison",
  "Withdrawal strategy optimizer",
  "Roth conversion modeling",
  "Priority processing",
];

const enterpriseFeatures = [
  "Unlimited forecasts",
  "White-label PDF reports",
  "API access",
  "Dedicated account manager",
  "Custom Excel engine integrations",
];

export default function FinCastPricingPage() {
  const [coupon, setCoupon] = useState("");

  return (
    <div className="px-4 pb-16 pt-8 md:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50/80 px-3 py-1.5 text-xs font-medium text-sky-800">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Credit-based pricing
        </p>
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          Pay only for what you{" "}
          <span className={`${playfair.className} text-brand-600`}>
            forecast
          </span>
          .
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 md:text-base">
          Each credit = one full 30-year report. No subscriptions, no surprises.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-md">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Your balance
            </p>
            <p className="text-lg font-bold text-slate-900">2 credits</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
            Active
          </span>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3 lg:items-stretch">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Starter
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">$1,000</p>
          <p className="text-sm text-slate-500">one-time</p>
          <p className="mt-4 text-sm text-slate-600">
            1 forecast · One detailed 30-year report.
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-800">
            {starterFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={2.5}
                />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="#checkout-starter"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-950 py-3 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            <CreditCard className="h-4 w-4" />
            Get Starter
          </Link>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-sky-500/30 bg-slate-900 p-6 text-white shadow-xl lg:-mt-1 lg:scale-[1.02]">
          <span className="absolute right-4 top-4 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Most popular
          </span>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Pro
          </p>
          <p className="mt-3 text-2xl font-bold text-white">$3,500</p>
          <p className="text-sm text-slate-400">one-time</p>
          <p className="mt-4 text-sm text-slate-300">
            5 forecasts · Compare scenarios side-by-side.
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-200">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check
                  className="h-4 w-4 shrink-0 text-sky-400"
                  strokeWidth={2.5}
                />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="#checkout-pro"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500"
          >
            <CreditCard className="h-4 w-4" />
            Get Pro
          </a>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Enterprise
          </p>
          <p
            className={`mt-3 text-2xl font-bold text-slate-900 ${playfair.className}`}
          >
            Custom
          </p>
          <p className="text-sm text-slate-500">&nbsp;</p>
          <p className="mt-4 text-sm text-slate-600">
            Unlimited · For RIAs and family offices.
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-800">
            {enterpriseFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={2.5}
                />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="mailto:sales@fincast.com?subject=FinCast%20Enterprise"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Contact sales
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-800">
          <Tag className="h-4 w-4 text-slate-500" />
          Have a coupon?
        </p>
        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            type="text"
            placeholder="ENTER CODE"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:tracking-wider placeholder:text-slate-400"
          />
          <button
            type="button"
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Apply
          </button>
        </div>
      </div>

      <p className="mx-auto mt-6 text-center text-sm text-slate-600">
        Need to talk to a human?{" "}
        <a
          href="#book"
          className="font-semibold text-brand-600 hover:underline"
        >
          Book a strategist
        </a>
        .
      </p>
    </div>
  );
}
