import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  poweredByHeader: false
};

const withMDX = createMDX({
  extension: /\.mdx?$/
});

export default withMDX(nextConfig);
