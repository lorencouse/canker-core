import { Check } from 'lucide-react';

import { BusyIcon } from '@/components/ui/busy-icon';
import { Button } from '@/components/ui/button';

import { StepFooter } from './StepLayout';

/** A habit screen's way forward, in the action bar every step shares. */
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
    <StepFooter>
      <Button
        type="button"
        size="touch"
        className="min-w-0 flex-1"
        onClick={onClick}
        disabled={busy}
      >
        <BusyIcon busy={busy}>
          <Check aria-hidden="true" />
        </BusyIcon>
        {label}
      </Button>
    </StepFooter>
  );
}
