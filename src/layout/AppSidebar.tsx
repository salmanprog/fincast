'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/context/SidebarContext';
import useApi from '@/utils/useApi';
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Calendar,
  UserCircle,
  Boxes,
  Clock,
  Link as LinkIcon,
  type LucideIcon,
} from 'lucide-react';

interface SubItem {
  name: string;
  path: string;
  pro: boolean;
}

interface NavItem {
  icon: React.ElementType;
  name: string;
  path?: string;
  subItems?: SubItem[];
}

/** Matches `icon` strings stored on `cm_modules` (see prisma seed). */
const SIDEBAR_ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  UserCircle,
  Boxes,
  Calendar,
  Clock,
  Link: LinkIcon,
};

function iconFromKey(key: string | null | undefined): LucideIcon {
  if (!key) return LayoutDashboard;
  return SIDEBAR_ICON_MAP[key] ?? LayoutDashboard;
}

type SidebarModuleDto = {
  name: string;
  path?: string;
  icon: string | null;
  subItems?: { name: string; path: string }[];
};

function dtoToNavItem(dto: SidebarModuleDto): NavItem {
  return {
    icon: iconFromKey(dto.icon ?? undefined),
    name: dto.name,
    path: dto.path,
    subItems: dto.subItems?.map((s) => ({
      name: s.name,
      path: s.path,
      pro: false,
    })),
  };
}

const FALLBACK_NAV: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: 'Dashboard',
    path: '/admin',
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, loading, fetchApi } = useApi({
    url: '/api/admin/sidebar-modules',
    method: 'GET',
    type: 'manual',
    requiresAuth: true,
  });

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || sessionStorage.getItem('token')
        : null;
    if (token) {
      void fetchApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load sidebar once on mount when token exists
  }, []);

  const navItems = useMemo(() => {
    const payload = data as { items?: SidebarModuleDto[] } | null;
    const list = payload?.items;
    if (!list?.length) return FALLBACK_NAV;
    return list.map(dtoToNavItem);
  }, [data]);

  const othersItems: NavItem[] = [];

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="space-y-2">
      {items.map((nav) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <div>
              <button
                onClick={() => toggleMenu(nav.name)}
                className={`flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white rounded-lg ${!isExpanded ? 'justify-center' : ''}`}
              >
                <span className={`flex items-center space-x-2 ${!isExpanded ? 'space-x-0' : ''}`}>
                  <nav.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
                  {isExpanded && <span>{nav.name}</span>}
                </span>
                {isExpanded &&
                  (openMenu === nav.name ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  ))}
              </button>

              {openMenu === nav.name && isExpanded && (
                <ul className="pl-8 mt-2 space-y-1">
                  {nav.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.path}
                        className="block px-3 py-1 text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <Link
              href={nav.path ?? '#'}
              className={`flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white rounded-lg ${!isExpanded ? 'justify-center' : ''}`}
              title={!isExpanded ? nav.name : undefined}
            >
              <nav.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
              {isExpanded && <span>{nav.name}</span>}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        'lg:translate-x-0'
      } ${
        isExpanded ? 'lg:w-64' : 'lg:w-20'
      } fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 z-50`}
    >
      <div className="p-4">
        <div className={`flex items-center space-x-2 mb-6 justify-center ${!isExpanded ? 'justify-center' : ''}`}>
          <Image
            src="/images/logo1.png"
            className={`${!isExpanded ? 'max-w-[50px]' : 'max-w-[150px]'}`}
            alt="Logo"
            width={250}
            height={250}
          />
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
          {isExpanded && (
            <h3 className="text-gray-500 text-sm uppercase mb-2">
              Main
              {loading ? <span className="ml-2 text-xs font-normal normal-case">(loading…)</span> : null}
            </h3>
          )}
          {renderMenuItems(navItems)}
          {renderMenuItems(othersItems)}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
