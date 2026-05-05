import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-950 text-white">
                <TrendingUp className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="text-lg font-semibold text-slate-900">
                FinCast
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Institutional-grade retirement forecasting, delivered in a minute.
              Powered by a secure Excel calculation engine.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product
            </p>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-700">
              <li>
                <Link href="/demo" className="hover:text-brand-700">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand-700">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Company
            </p>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-700">
              <li>
                <a href="#book" className="hover:text-brand-700">
                  Book a call
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-brand-700">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {year} FinCast. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
