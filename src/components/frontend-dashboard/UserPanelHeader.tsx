"use client";

import Link from "next/link";
import { Coins, LogOut } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useCurrentUser, clearCurrentUserCache } from "@/utils/currentUser";
import { clearAuthToken } from "@/lib/authClient";

export default function UserPanelHeader() {
  const { user, loadingUser } = useCurrentUser();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const credits = user?.credits ?? 0;
  const creditsLabel =
    loadingUser && !user ? "…" : `${credits} ${credits === 1 ? "credit" : "credits"}`;

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  const handleLogout = () => {
    clearAuthToken();
    clearCurrentUserCache();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-[99999] flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex w-full flex-col items-center justify-between gap-2 px-3 py-3 sm:gap-4 lg:flex-row lg:px-6 lg:py-4">
        <div className="flex w-full items-center justify-between gap-2 lg:w-auto lg:justify-normal">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:h-11 lg:w-11"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6.22 7.28a.75.75 0 011.06 0L12 10.94l4.72-4.72a.75.75 0 111.06 1.06L13.06 12l4.72 4.72a.75.75 0 11-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 11-1.06-1.06L10.94 12 6.22 7.28z" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
                <path d="M0 1h16v2H0V1zm0 4h16v2H0V5zm0 4h16v2H0V9z" />
              </svg>
            )}
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 lg:hidden">
            My panel
          </span>
        </div>

        <div className="flex w-full items-center justify-end gap-3 lg:w-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Coins className="h-3.5 w-3.5" aria-hidden />
            {creditsLabel}
          </span>
          {user ? (
            <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:inline">
              {user.name || user.email}
            </span>
          ) : null}
          <Link
            href="/"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
