'use client';

import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

import { useActionSheet } from '@/components/ui/action-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useMounted } from '@/utils/hooks/useMounted';
import { notify, tap } from '@/utils/native';
import { photoFor, photosSupported, takePhoto } from '@/utils/sore-photos';
import { BusyIcon } from '@/components/ui/busy-icon';

/**
 * Today's photo of a sore, taken in the app and kept on this phone. Renders
 * nothing on the web or in an app version without the camera plugins.
 *
 * Support is read only once mounted: the server renders this as the web, so
 * deciding earlier would mismatch the native hydration.
 */
export default function PhotoControl({
  readingId,
  onTaken,
  variant = 'button'
}: {
  /** The reading the photo belongs to, saved or about to be. */
  readingId: string;
  onTaken?: () => void;
  /** `chip` sits in the check-in's row of extras, with a thumbnail beside it. */
  variant?: 'button' | 'chip';
}) {
  const supported = useMounted() && photosSupported();
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const actions = useActionSheet();

  useEffect(() => {
    if (!photosSupported()) return;
    let live = true;
    photoFor(readingId).then((uri) => {
      if (live) setSrc(uri);
    });
    return () => {
      live = false;
    };
  }, [readingId]);

  if (!supported) return null;

  const take = async () => {
    tap();
    // The system action sheet, as the Photos and Camera apps ask it.
    const pick = await actions.ask(src ? 'Retake photo' : 'Add a photo', [
      { title: 'Take photo' },
      { title: 'Choose from library' }
    ]);
    if (pick === null) return;
    setBusy(true);
    try {
      const uri = await takePhoto(readingId, pick === 0 ? 'camera' : 'library');
      if (uri) {
        setSrc(uri);
        onTaken?.();
      }
    } catch {
      notify('error');
      toast({ variant: 'destructive', title: 'Could not save the photo.' });
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'chip') {
    return (
      <>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Today's photo of this sore"
            className="size-10 rounded-full object-cover coarse:size-11"
          />
        ) : null}
        <Chip on={Boolean(src)} icon={Camera} onClick={take} disabled={busy}>
          {src ? 'Retake' : 'Photo'}
        </Chip>
        {actions.sheet}
      </>
    );
  }

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      {actions.sheet}
      {src ? (
        // A file on this device, served by the native webview; the image
        // optimiser behind next/image cannot reach it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Today's photo of this sore"
          className="size-16 rounded-xl object-cover"
        />
      ) : null}
      <div className={src ? 'min-w-0' : 'col-span-2 min-w-0'}>
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="w-full"
          onClick={take}
          disabled={busy}
        >
          <BusyIcon busy={busy}><Camera aria-hidden="true" /></BusyIcon>
          {src ? 'Retake photo' : 'Add photo'}
        </Button>
        <p className="mt-1 text-sm text-muted-foreground">
          Stays on this phone. Never uploaded.
        </p>
      </div>
    </div>
  );
}
