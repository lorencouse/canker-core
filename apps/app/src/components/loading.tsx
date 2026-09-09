import { Skeleton } from '@canker/ui';

export function PageLoading() {
  return (
    <div className="flex flex-col gap-4 pt-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <div className="border-border bg-card rounded-lg border p-4 text-sm">
      <p className="font-medium">Couldn't load your data.</p>
      <p className="text-secondary-foreground mt-1">{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="text-accent mt-3 underline underline-offset-2"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
