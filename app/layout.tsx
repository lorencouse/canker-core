import type { Metadata, Viewport } from 'next';
import { Archivo, Source_Sans_3 } from 'next/font/google';
import { PropsWithChildren, Suspense } from 'react';

import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';

const display = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap'
});

const sans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: {
    default: 'Canker Core — track mouth sores and see whether they are healing',
    template: '%s · Canker Core'
  },
  description:
    'Mark where a canker sore is on a mouth map, log its size and pain each day, and see whether it is actually healing.',
  icons: { icon: '/favicon.ico' }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#131a21' }
  ]
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
          </main>
          <Footer />
          <Suspense>
            <Toaster />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

function LoadingScreen() {
  return (
    <div className="container space-y-4 py-16" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
