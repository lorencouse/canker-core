import { useState } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { Button } from '@canker/ui';
import { authRedirectUrl, supabase } from '@/lib/supabase';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'github', label: 'Continue with GitHub' }
];

export function OAuthButtons({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState<Provider | null>(null);

  async function start(provider: Provider) {
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authRedirectUrl() }
    });
    if (error) {
      onError(error.message);
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void start(p.id)}
        >
          {busy === p.id ? 'Redirecting…' : p.label}
        </Button>
      ))}
    </div>
  );
}
