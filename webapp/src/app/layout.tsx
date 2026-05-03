// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Phone Scraper Pro — Real-time Number Extraction',
  description: 'Automatically identify and save phone numbers from any website. Ghana-first. Works on desktop, iPhone, and Android.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Scraper Pro',
  },
};

export const viewport: Viewport = {
  themeColor: '#080e1a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
