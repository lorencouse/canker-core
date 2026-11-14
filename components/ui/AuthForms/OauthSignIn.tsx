'use client';

import { useState } from 'react';
import { Github } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Apple } from '@/components/icons/Apple';
import { Google } from '@/components/icons/Google';
import { toast } from '@/components/ui/Toasts/use-toast';
import {
  signInWithOAuth,
  type OAuthProvider
} from '@/utils/auth-helpers/client';
import { BusyIcon } from '@/components/ui/busy-icon';

type OAuthProviders = {
  name: OAuthProvider;
  displayName: string;
  icon: React.ReactNode;
};

// Apple first, per App Review guideline 4.8 and Apple's guidelines: never
// the less prominent choice.
const oAuthProviders: OAuthProviders[] = [
  { name: 'apple', displayName: 'Apple', icon: <Apple /> },
  { name: 'google', displayName: 'Google', icon: <Google /> },
  { name: 'github', displayName: 'GitHub', icon: <Github /> }
];

/**
 * Sign in with Apple drawn to Apple's Human Interface Guidelines for a custom
 * button: Apple's black on the light theme, white on the dark one, the logo
 * in the title's colour, an approved title in the system font, the same size
 * as the other providers. Brand colours Apple mandates, so no tokens here.
 */
const APPLE_STYLE =
  'border-black bg-black text-white font-[family-name:system-ui] font-semibold hover:bg-black/85 ' +
  'dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/85';

export default function OauthSignIn({
  next,
  providers
}: {
  next: string;
  /** The providers this deployment has credentials for (lib/auth.ts). */
  providers: OAuthProvider[];
}) {
  // Track which provider is in flight so only that button shows a spinner.
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    provider: OAuthProvider
  ) => {
    setPending(provider);
    const problem = await signInWithOAuth(e);
    setPending(null);
    if (problem) {
      toast({
        title: 'Sign in failed.',
        description: problem,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="grid gap-2">
      {oAuthProviders
        .filter((provider) => providers.includes(provider.name))
        .map((provider) => (
          <form
            key={provider.name}
            onSubmit={(e) => handleSubmit(e, provider.name)}
          >
            <input type="hidden" name="provider" value={provider.name} />
            <input type="hidden" name="next" value={next} />
            <Button
              variant="outline"
              type="submit"
              className={
                provider.name === 'apple' ? `w-full ${APPLE_STYLE}` : 'w-full'
              }
              disabled={pending !== null}
            >
              <BusyIcon busy={pending === provider.name}>
                {provider.icon}
              </BusyIcon>
              Continue with {provider.displayName}
            </Button>
          </form>
        ))}
    </div>
  );
}
