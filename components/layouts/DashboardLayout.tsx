'use client';

import { useState } from 'react';
import { AppBar } from './AppBar';
import { Sidebar, NavItem } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
  appName?: string;
  navItems: NavItem[];
}

/**
 * Dashboard Layout with Sidebar and AppBar
 * Responsive: Desktop shows fixed sidebar, mobile shows drawer
 */
export function DashboardLayout({ children, appName, navItems }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* App Bar */}
      <AppBar
        appName={appName}
        onMenuClick={() => setSidebarOpen(true)}
        showMenuButton={isMobile}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          items={navItems}
          open={isMobile ? sidebarOpen : true}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <main className={cn('flex-1 overflow-x-hidden', isMobile ? undefined : 'ml-64')}>
          <div className="container py-6 px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

