import type { ReactNode } from 'react';

/** A figure and its small unit, as in "3 mm". `className` restyles the unit. */
export default function Measure({
  value,
  unit,
  className = 'font-sans text-sm font-normal text-muted-foreground'
}: {
  value: ReactNode;
  unit: string;
  className?: string;
}) {
  return (
    <>
      {value} <small className={className}>{unit}</small>
    </>
  );
}
