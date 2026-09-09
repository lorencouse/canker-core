import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';

function slugify(children: unknown): string | undefined {
  if (typeof children !== 'string') return undefined;
  return children
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function Anchor({ href = '', children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  const className =
    'font-medium text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent';
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, ...rest }: ComponentPropsWithoutRef<'h1'>) => (
      <h1 className="text-foreground mb-4 mt-12 text-3xl font-bold sm:text-4xl" {...rest}>
        {children}
      </h1>
    ),
    h2: ({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) => (
      <h2
        id={slugify(children)}
        className="text-foreground mb-4 mt-12 scroll-mt-24 text-2xl font-semibold"
        {...rest}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }: ComponentPropsWithoutRef<'h3'>) => (
      <h3
        id={slugify(children)}
        className="text-foreground mb-3 mt-8 scroll-mt-24 text-xl font-semibold"
        {...rest}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...rest }: ComponentPropsWithoutRef<'p'>) => (
      <p
        className="text-secondary-foreground my-5 text-[1.0625rem] leading-[1.7]"
        {...rest}
      >
        {children}
      </p>
    ),
    a: Anchor,
    strong: ({ children, ...rest }: ComponentPropsWithoutRef<'strong'>) => (
      <strong className="text-foreground font-semibold" {...rest}>
        {children}
      </strong>
    ),
    ul: ({ children, ...rest }: ComponentPropsWithoutRef<'ul'>) => (
      <ul
        className="text-secondary-foreground marker:text-accent my-5 list-disc space-y-2 pl-6 text-[1.0625rem] leading-[1.7]"
        {...rest}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...rest }: ComponentPropsWithoutRef<'ol'>) => (
      <ol
        className="text-secondary-foreground marker:text-accent my-5 list-decimal space-y-2 pl-6 text-[1.0625rem] leading-[1.7] marker:font-medium"
        {...rest}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...rest }: ComponentPropsWithoutRef<'li'>) => (
      <li className="pl-1" {...rest}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...rest }: ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote
        className="border-heal bg-heal-soft/60 text-secondary-foreground my-6 rounded-lg border-l-4 px-5 py-4 [&>p+p]:mt-3 [&>p]:my-0"
        {...rest}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-border my-10" />,
    table: ({ children, ...rest }: ComponentPropsWithoutRef<'table'>) => (
      <div className="border-border my-6 overflow-x-auto rounded-lg border">
        <table
          className="w-full min-w-[32rem] border-collapse text-left text-[0.95rem]"
          {...rest}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...rest }: ComponentPropsWithoutRef<'thead'>) => (
      <thead className="bg-muted text-foreground" {...rest}>
        {children}
      </thead>
    ),
    th: ({ children, ...rest }: ComponentPropsWithoutRef<'th'>) => (
      <th className="px-4 py-3 font-semibold" {...rest}>
        {children}
      </th>
    ),
    td: ({ children, ...rest }: ComponentPropsWithoutRef<'td'>) => (
      <td
        className="border-border text-secondary-foreground border-t px-4 py-3 align-top leading-relaxed"
        {...rest}
      >
        {children}
      </td>
    ),
    code: ({ children, ...rest }: ComponentPropsWithoutRef<'code'>) => (
      <code
        className="bg-muted text-foreground rounded-sm px-1.5 py-0.5 font-mono text-[0.9em]"
        {...rest}
      >
        {children}
      </code>
    ),
    ...components
  };
}
