'use client';

import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Google } from '@/components/icons/Google';
import {
  signInWithOAuth,
  type OAuthProvider
} from '@/utils/auth-helpers/client';

type OAuthProviders = {
  name: OAuthProvider;
  displayName: string;
  icon: React.ReactNode;
};

const oAuthProviders: OAuthProviders[] = [
  { name: 'google', displayName: 'Google', icon: <Google /> },
  { name: 'github', displayName: 'GitHub', icon: <Github /> }
];

export default function OauthSignIn({ next }: { next: string }) {
  // Track which provider is in flight so only that button shows a spinner.
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    provider: OAuthProvider
  ) => {
    setPending(provider);
    await signInWithOAuth(e);
    setPending(null);
  };

  return (
    <div className="grid gap-2">
      {oAuthProviders.map((provider) => (
        <form
          key={provider.name}
          onSubmit={(e) => handleSubmit(e, provider.name)}
        >
          <input type="hidden" name="provider" value={provider.name} />
          <input type="hidden" name="next" value={next} />
          <Button
            variant="outline"
            type="submit"
            className="w-full"
            disabled={pending !== null}
          >
            {pending === provider.name ? (
              <Loader2 className="animate-spin" />
            ) : (
              provider.icon
            )}
            Continue with {provider.displayName}
          </Button>
        </form>
      ))}
    </div>
  );
}
