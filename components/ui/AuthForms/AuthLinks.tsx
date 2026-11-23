import Link from 'next/link';

/** The small print under an auth form: one row per alternate route in. */
export default function AuthLinks({
  links
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <div className="mt-3 flex flex-col items-start text-sm">
      {links.map(({ href, label }) => (
        <Link
          key={href + label}
          href={href}
          className="press inline-flex min-h-11 items-center rounded-md text-muted-foreground hover:text-foreground"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
