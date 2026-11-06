import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

/**
 * The https callback of the iOS system sign-in (utils/native-auth.ts). The
 * sign-in sheet catches this URL before it loads, so the page only renders
 * when it is opened anywhere else: a browser, a pasted link, a crawler. Its
 * query carries a handoff token, and the page deliberately never reads it:
 * no searchParams, so it is static and the token cannot reach the markup,
 * a log line, or a request this page makes. next.config.mjs sends it with
 * no referrer, and proxy.ts skips it so the URL is never a first touch.
 */
export const metadata: Metadata = {
  title: 'Open the app to finish signing in',
  robots: { index: false, follow: false }
};

export default function NativeAuthCallback() {
  return (
    <main
      id="main"
      className="flex min-h-[100dvh] items-center justify-center px-4 py-10 safe-x"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Open the app to finish signing in</CardTitle>
          <CardDescription className="prose-measure">
            This link finishes a sign-in in the Canker Core iPhone app and does
            nothing in a browser. Nothing has been signed in here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="touch" className="w-full">
            <Link href="/signin">Sign in on the web</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
