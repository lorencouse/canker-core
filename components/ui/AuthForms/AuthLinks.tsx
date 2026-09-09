import Link from 'next/link';

/** The small print under an auth form: one row per alternate route in. */
export default function AuthLinks({
  links
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <div className="mt-5 flex flex-col gap-2 text-sm">
      {links.map(({ href, label }) => (
        <Link
          key={href + label}
          href={href}
          className="rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
