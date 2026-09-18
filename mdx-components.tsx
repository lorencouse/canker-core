import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

/**
 * How MDX elements render across every article.
 *
 * Defined here rather than as a `prose` class on the wrapper because the
 * articles carry components (the timeline estimator, the stage diagrams)
 * alongside their text, and a blanket typography reset fights those. Each
 * element is given its type from the same scale the rest of the product uses.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => (
      <h2 className="text-section mt-12 scroll-mt-24" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-subhead mt-8" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p className="mt-4 text-muted-foreground" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground"
        {...props}
      >
        {children}
      </ol>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    a: ({ href = '', children, ...props }) => {
      const internal = href.startsWith('/');
      return internal ? (
        <Link href={href} className="text-primary underline underline-offset-4">
          {children}
        </Link>
      ) : (
        <a
          href={href}
          className="text-primary underline underline-offset-4"
          rel="noopener noreferrer"
          target="_blank"
          {...props}
        >
          {children}
        </a>
      );
    },
    table: ({ children, ...props }) => (
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border-b border-border px-3 py-2 text-left font-semibold"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border-b border-border px-3 py-2 text-muted-foreground"
        {...props}
      >
        {children}
      </td>
    ),
    ...components
  };
}
