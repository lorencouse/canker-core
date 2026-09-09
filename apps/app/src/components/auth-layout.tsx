import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <p className="font-display text-accent text-sm font-semibold">Canker Core</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-secondary-foreground mt-1 text-sm">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="bg-accent-soft text-accent rounded-md px-3 py-2 text-sm">
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="bg-heal-soft text-heal rounded-md px-3 py-2 text-sm">
      {message}
    </p>
  );
}
