/**
 * Which deploy is live: build date and short commit, set at build time by
 * next.config.mjs. Muted and small; it is for the owner, not the reader.
 */
export default function BuildLabel({ className }: { className?: string }) {
  return (
    <span className={`tabular ${className ?? ''}`}>
      Version {process.env.NEXT_PUBLIC_BUILD_LABEL || 'dev'}
    </span>
  );
}
