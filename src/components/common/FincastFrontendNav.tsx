"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, LogOut } from "lucide-react";
import { useCurrentUser, clearCurrentUserCache } from "@/utils/currentUser";
import { clearAuthToken } from "@/lib/authClient";

/** Single source for public-site nav; active state is derived from pathname. */
export const FRONTEND_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function isFrontendNavActive(href: string, pathname: string): boolean {
  if (href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  if (href === "/demo")
    return pathname === "/demo" || pathname.startsWith("/demo/");
  if (href === "/pricing")
    return pathname === "/pricing" || pathname.startsWith("/pricing/");
  if (href === "/admin/dashboard")
    return (
      pathname === "/admin/dashboard" ||
      pathname.startsWith("/admin/dashboard/")
    );
  if (href === "/admin")
    return (
      pathname.startsWith("/admin") &&
      pathname !== "/admin/dashboard" &&
      !pathname.startsWith("/admin/dashboard/")
    );
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function FincastFrontendNav() {
  const pathname = usePathname() ?? "";
  const { user, loadingUser } = useCurrentUser();

  const handleLogout = () => {
    clearAuthToken();
    clearCurrentUserCache();
    window.location.assign("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 justify-self-start"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-950 text-white">
            <TrendingUp className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="flex items-baseline gap-2 font-semibold tracking-tight text-slate-900">
            <span className="text-lg">FinCast</span>
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
              V1.0
            </span>
          </span>
        </Link>

        <nav className="hidden justify-self-center md:block" aria-label="Primary">
          <ul className="flex items-center gap-6 lg:gap-8">
            {FRONTEND_NAV_LINKS.map(({ href, label }) => {
              const active = isFrontendNavActive(href, pathname);
              const pricingPill = active && href === "/pricing";
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={
                      pricingPill
                        ? "rounded-md bg-slate-100 px-2.5 py-1.5 text-[15px] font-medium text-slate-900 transition-colors"
                        : `relative inline-block pb-1 text-[15px] font-medium transition-colors ${
                            active
                              ? "text-slate-900"
                              : "text-slate-500 hover:text-slate-800"
                          }`
                    }
                  >
                    {label}
                    {active && !pricingPill && (
                      <span
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-600"
                        aria-hidden
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-3 sm:gap-4">
          {loadingUser ? (
            <span className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          ) : user ? (
            <>
              <span className="hidden max-w-[140px] truncate text-sm text-slate-600 sm:inline" title={user.email}>
                {user.name || user.email}
              </span>
              <Link
                href="/admin/dashboard"
                className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="#book"
                className="hidden text-[15px] font-medium text-slate-600 hover:text-slate-900 sm:inline"
              >
                Book call
              </Link>
              <Link
                href="/register"
                className="hidden text-[15px] font-medium text-slate-600 hover:text-slate-900 sm:inline"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-900"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        className="border-t border-gray-100 px-4 py-3 md:hidden"
        aria-label="Primary mobile"
      >
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {FRONTEND_NAV_LINKS.map(({ href, label }) => {
            const active = isFrontendNavActive(href, pathname);
            const pricingPill = active && href === "/pricing";
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    pricingPill
                      ? "rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-900"
                      : active
                        ? "font-semibold text-brand-700 underline decoration-2 underline-offset-4"
                        : "font-medium text-slate-600"
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-3 sm:hidden">
          {loadingUser ? null : user ? (
            <>
              <span className="max-w-[120px] truncate text-xs text-slate-500">{user.name || user.email}</span>
              <Link href="/admin/dashboard" className="text-sm font-medium text-brand-600">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-slate-600"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/register" className="text-sm font-medium text-slate-600">
                Register
              </Link>
              <Link href="/login" className="text-sm font-semibold text-brand-600">
                Log in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
