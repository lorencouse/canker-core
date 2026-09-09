import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-secondary-foreground mt-0.5 text-sm">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
