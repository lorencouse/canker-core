import { Check } from 'lucide-react';

import { BusyIcon } from '@/components/ui/busy-icon';
import { Button } from '@/components/ui/button';

/** A habit screen's way forward. */
export default function StepNextButton({
  busy,
  onClick,
  label = 'Next'
}: {
  busy: boolean;
  onClick: () => void;
  /** Says what Next will record when that is not obvious ("None, next"). */
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="touch"
      className="w-full"
      onClick={onClick}
      disabled={busy}
    >
      <BusyIcon busy={busy}>
        <Check aria-hidden="true" />
      </BusyIcon>
      {label}
    </Button>
  );
}
