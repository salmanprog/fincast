"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, Table } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Forecasts", path: "/dashboard/forecasts", icon: Table },
  { name: "Bookings", path: "/dashboard/bookings", icon: Calendar },
] as const;

export default function UserPanelSidebar() {
  const pathname = usePathname() ?? "";
  const { isExpanded, isMobileOpen } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-full transform border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 ${isExpanded ? "lg:w-64" : "lg:w-20"}`}
    >
      <div className="p-4">
        <div
          className={`mb-6 flex items-center justify-center space-x-2 ${!isExpanded ? "justify-center" : ""}`}
        >
          <Link href="/">
            <Image
              src="/images/logo1.png"
              className={!isExpanded ? "max-w-[50px]" : "max-w-[150px]"}
              alt="FinCast"
              width={250}
              height={250}
            />
          </Link>
        </div>

        <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
          {isExpanded ? (
            <h3 className="mb-2 text-sm uppercase text-gray-500">My account</h3>
          ) : null}
          <ul className="space-y-2">
            {NAV_ITEMS.map((nav) => {
              const active = isActive(nav.path);
              return (
                <li key={nav.name}>
                  <Link
                    href={nav.path}
                    className={`flex items-center space-x-2 rounded-lg px-4 py-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 ${
                      !isExpanded ? "justify-center" : ""
                    } ${active ? "bg-gray-100 font-medium dark:bg-gray-800" : ""}`}
                    title={!isExpanded ? nav.name : undefined}
                  >
                    <nav.icon className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-300" />
                    {isExpanded ? <span>{nav.name}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
