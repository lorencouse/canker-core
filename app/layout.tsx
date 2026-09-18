import type { Metadata, Viewport } from 'next';
import { Saira_Semi_Condensed, Source_Sans_3 } from 'next/font/google';
import { PropsWithChildren, Suspense } from 'react';

import NativeBridge from '@/components/native/NativeBridge';
import {
  JsonLd,
  organizationSchema,
  webSiteSchema
} from '@/components/seo/JsonLd';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';

/*
 * Saira Semi Condensed carries every figure and every label. Almost all the
 * large glyphs in this product are numbers, so the display face is really a
 * numeral face: it has to set a three-digit figure large on a phone without
 * wrapping, and hold an uppercase label at 12px without turning to mush.
 * A normal-width grotesque does neither.
 */
const display = Saira_Semi_Condensed({
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
  applicationName: 'Canker Core',
  // Every page's canonical is resolved against metadataBase, so a page only
  // has to declare its own path. Without this the app is reachable at more
  // than one host — the sslip staging domain, www — and the ranking signals
  // split across them.
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Canker Core',
    locale: 'en_US',
    url: '/',
    title: 'Canker Core — track mouth sores and see whether they are healing',
    description:
      'Mark where a canker sore is on a mouth map, log its size and pain each day, and see whether it is actually healing.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canker Core — track mouth sores and see whether they are healing',
    description:
      'Mark where a canker sore is on a mouth map, log its size and pain each day, and see whether it is actually healing.'
  },
  appleWebApp: {
    capable: true,
    title: 'Canker Core',
    // Translucent, so the page paints under the status bar the same way it
    // does in the Capacitor shell. One layout serves both.
    statusBarStyle: 'black-translucent'
  },
  formatDetection: {
    // Otherwise iOS turns every "Day 7" and reading count into a phone link.
    telephone: false,
    date: false
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#131a21' }
  ],
  width: 'device-width',
  initialScale: 1,
  // The app draws its own safe-area padding, so the viewport should extend
  // into the notch rather than being letterboxed away from it.
  viewportFit: 'cover'
  // Page zoom is deliberately left enabled. Locking it would be the usual
  // way to stop a pinch on the mouth map from zooming the whole page, but
  // this is a health app and people need to be able to enlarge it — so the
  // map claims its own gestures with touch-action instead, and the native
  // webview disables page zoom at its own layer.
};

/**
 * The root layout carries only what every surface needs: fonts, theme, the
 * native bridge, toasts. Chrome belongs to the route groups — the marketing
 * site gets a navbar and footer, the app gets a tab bar, and sign-in gets
 * neither.
 */
export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable}`}
    >
      <body className="bg-background font-sans text-foreground">
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
          {children}
          <JsonLd schema={organizationSchema} />
          <JsonLd schema={webSiteSchema} />
          <NativeBridge />
          {/* Toaster reads search params, which needs a boundary. */}
          <Suspense>
            <Toaster />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
