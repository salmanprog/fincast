"use client";

import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";
import Backdrop from "@/layout/Backdrop";
import { useCurrentUser } from "@/utils/currentUser";
import UserPanelHeader from "./UserPanelHeader";
import UserPanelSidebar from "./UserPanelSidebar";

export default function UserPanelShell({ children }: { children: React.ReactNode }) {
  const { user, loadingUser } = useCurrentUser();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-64"
      : "lg:ml-20";

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Log in to access your account panel.
          </p>
          <Link
            href="/login?returnUrl=/dashboard"
            className="mt-4 inline-flex rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 xl:flex">
      <UserPanelSidebar />
      <Backdrop />
      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <UserPanelHeader />
        <div className="mx-auto max-w-full min-w-0 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
