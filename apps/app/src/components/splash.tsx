export function Splash() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-accent h-3 w-3 animate-pulse rounded-full" aria-hidden />
        <span className="font-display text-foreground text-lg font-semibold">
          Canker Core
        </span>
      </div>
    </div>
  );
}
