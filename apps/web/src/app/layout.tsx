import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

import './globals.css';

import { siteDescription, siteName, siteUrl } from '@/lib/site';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-bricolage',
  display: 'swap'
});

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap'
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} · Find out what's behind your canker sores`,
    template: `%s · ${siteName}`
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: 'website',
    siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    locale: 'en'
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: siteDescription
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="flex min-h-svh flex-col font-sans antialiased">
        <ThemeProvider>
          <a
            href="#main"
            className="focus:bg-card focus:text-foreground sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
