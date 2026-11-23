import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * The way in for someone who has no account yet. It used to be the last grey
 * line under the form, which made the one new visitor the page exists for
 * hunt for their path; now it is a real button under Sign in, outlined so the
 * filled Sign in stays the screen's one primary action.
 */
export default function CreateAccount() {
  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground">New to Canker Core?</p>
      <Button asChild variant="outline" size="touch" className="mt-2 w-full">
        <Link href="/signin/signup">Create an account</Link>
      </Button>
    </div>
  );
}
