/**
 * Which deploy is live: "v1.N" set at build time by next.config.mjs, with
 * the short commit in the tooltip. Muted and small; it is for the owner, not
 * the reader.
 */
export default function BuildLabel({ className }: { className?: string }) {
  const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT;
  return (
    <span
      className={`tabular ${className ?? ''}`}
      title={commit ? `Commit ${commit}` : undefined}
    >
      Version {process.env.NEXT_PUBLIC_BUILD_LABEL || 'dev'}
    </span>
  );
}
