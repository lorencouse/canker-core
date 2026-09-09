// Augments the wildcard module from `@types/mdx` (which only declares the default
// component export) so guide files can also export a typed `metadata` object.
declare module '*.mdx' {
  export const metadata: {
    title: string;
    description: string;
    publishedAt: string;
    readingMinutes: number;
    trackIt?: string;
  };
}
