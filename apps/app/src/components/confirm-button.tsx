import { useEffect, useState, type ComponentProps } from 'react';
import { Button } from '@canker/ui';

/**
 * Two-tap confirmation without a modal: the first tap arms the button and
 * swaps its label, the second within 4 seconds fires. Avoids blocking dialogs
 * for actions that are annoying to undo but not catastrophic.
 */
export function ConfirmButton({
  onConfirm,
  confirmLabel,
  children,
  ...rest
}: Omit<ComponentProps<typeof Button>, 'onClick'> & {
  onConfirm: () => void;
  confirmLabel: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      {...rest}
      aria-live="polite"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
