'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/context/SidebarContext';
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Calendar,
  UserCircle,
  List,
  Table,
  FileText,
  PieChart,
  Boxes,
  Plug,
  Settings,
  FolderOpen,
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

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: 'Dashboard',
    path: '/admin',
  },
  // {
    //   icon: Calendar,
    //   name: 'Calendar',
    //   path: '/calendar',
    // },
  {
    icon: UserCircle,
    name: 'Users',
    subItems: [
      { name: 'All Users', path: '/admin/users/', pro: false },
    ],
  },
  // {
  //   name: 'Forms',
  //   icon: List,
  //   subItems: [{ name: 'Form Elements', path: '/form-elements', pro: false }],
  // },
  // {
  // {
  //   name: 'Pages',
  //   icon: FileText,
  //   subItems: [
  //     { name: 'Blank Page', path: '/blank', pro: false },
  //     { name: '404 Error', path: '/error-404', pro: false },
  //   ],
  // },
];

const othersItems: NavItem[] = [
  // {
  //   icon: PieChart,
  //   name: 'Charts',
  //   subItems: [
  //     { name: 'Line Chart', path: '/line-chart', pro: false },
  //     { name: 'Bar Chart', path: '/bar-chart', pro: false },
  //   ],
  // },
  // {
  //   icon: Boxes,
  //   name: 'UI Elements',
  //   subItems: [
  //     { name: 'Alerts', path: '/alerts', pro: false },
  //     { name: 'Avatar', path: '/avatars', pro: false },
  //     { name: 'Badge', path: '/badge', pro: false },
  //     { name: 'Buttons', path: '/buttons', pro: false },
  //     { name: 'Images', path: '/images', pro: false },
  //     { name: 'Videos', path: '/videos', pro: false },
  //   ],
  // },
  // {
  //   icon: Plug,
  //   name: 'Authentication',
  //   subItems: [
  //     { name: 'Sign In', path: '/signin', pro: false },
  //     { name: 'Sign Up', path: '/signup', pro: false },
  //   ],
  // },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Close sidebar when clicking outside on mobile
  const handleCloseMobile = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
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
                {isExpanded && (
                  openMenu === nav.name ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )
                )}
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
        // Mobile: show/hide based on isMobileOpen
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        // Desktop: always visible
        'lg:translate-x-0'
      } ${
        // Desktop: width based on isExpanded
        isExpanded ? 'lg:w-64' : 'lg:w-20'
      } fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 z-50`}
    >
      <div className="p-4">
        {/* Logo */}
        <div className={`flex items-center space-x-2 mb-6 justify-center ${!isExpanded ? 'justify-center' : ''}`}>
        <Image src="/images/logo1.png" className={`${!isExpanded ? 'max-w-[50px]' : 'max-w-[150px]'}`} alt="Logo" width={250} height={250} />
        </div>

        {/* Navigation */}
        <div className='overflow-y-auto max-h-[calc(100vh-140px)]'>
          {isExpanded && (
            <h3 className="text-gray-500 text-sm uppercase mb-2">Main</h3>
          )}
          {renderMenuItems(navItems)}

          {/* {isExpanded && (
            <h3 className="text-gray-500 text-sm uppercase mt-6 mb-2">Others</h3>
          )} */}
          {renderMenuItems(othersItems)}
        </div>
      </div>

      {/* Bottom user/settings area */}
      {/* <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/settings"
          className={`flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ${!isExpanded ? 'justify-center' : ''}`}
          title={!isExpanded ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
          {isExpanded && <span>Settings</span>}
        </Link>
      </div> */}
    </aside>
  );
};

export default AppSidebar;
