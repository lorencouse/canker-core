import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { Skeleton } from '@/components/ui/skeleton';
import 'styles/main.css';
import { ThemeProvider } from '@/components/theme-provider';

function LoadingScreen() {
  return (
    <div className="w-full h-screen p-8 space-y-4">
      <Skeleton className="h-[20px] w-[250px]" />
      <Skeleton className="h-[150px] w-full" />
      <Skeleton className="h-[150px] w-full" />
    </div>
  );
}

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main id="skip" className="min-h-4xl">
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
