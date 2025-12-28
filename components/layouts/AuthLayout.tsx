'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  appName?: string;
}

/**
 * Auth Layout for login/register pages
 * Centered card design with app branding
 */
export function AuthLayout({ children, appName = 'App' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      {/* App Name / Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {appName}
        </h1>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-600 dark:text-gray-400 text-center">
        © {new Date().getFullYear()} {appName}. All rights reserved.
      </p>
    </div>
  );
}

