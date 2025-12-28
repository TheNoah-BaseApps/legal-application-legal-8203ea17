'use client';

import { AppBar } from './AppBar';

interface SimpleLayoutProps {
  children: React.ReactNode;
  appName?: string;
}

/**
 * Simple Layout with just AppBar (no sidebar)
 * Good for simple apps or content-focused pages
 */
export function SimpleLayout({ children, appName }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* App Bar */}
      <AppBar appName={appName} showMenuButton={false} />

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

