"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import { UserProvider } from "@/context/UserContext";

export default function AdminLayout({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin/@auth") || pathname === "/admin/login") {
    return <>{auth}</>;
  }
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-64"
    : "lg:ml-20";

  return (
    <UserProvider>
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto  md:p-6">{children}</div>
      </div>
    </div>
    </UserProvider>
  );
}
