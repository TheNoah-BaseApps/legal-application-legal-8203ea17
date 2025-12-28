import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Legal Application - Case Management System',
  description: 'End-to-end legal operations management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}