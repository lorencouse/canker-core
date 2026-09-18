'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused outright (insecure context, denied
      // permission). The textarea below is still selectable, so there is
      // nothing to recover from — just do not claim it worked.
      setCopied(false);
    }
  };

  return (
    <div className="mt-4">
      <textarea
        readOnly
        rows={4}
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-none rounded-md border border-border bg-background p-3 font-mono text-xs text-muted-foreground"
        aria-label="Embed code"
      />
      <Button size="sm" variant="outline" className="mt-2" onClick={copy}>
        {copied ? (
          <Check className="mr-2 h-4 w-4" aria-hidden />
        ) : (
          <Copy className="mr-2 h-4 w-4" aria-hidden />
        )}
        {copied ? 'Copied' : 'Copy embed code'}
      </Button>
    </div>
  );
}
