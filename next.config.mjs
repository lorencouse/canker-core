import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Articles are .mdx files sitting in their own route folder, so prose lives
  // in prose syntax and the interactive pieces are imported components rather
  // than a shortcode dialect.
  pageExtensions: ['ts', 'tsx', 'mdx'],

  // Emits .next/standalone — a self-contained server bundle with only the
  // modules actually imported. The Dockerfile's runner stage copies it instead
  // of the whole node_modules tree, which keeps the image small.
  output: 'standalone',

  // `pg` and `nodemailer` are native/CJS server-only packages; bundling them
  // into the server build breaks their dynamic requires.
  serverExternalPackages: ['pg', 'nodemailer'],

  async redirects() {
    return [
      // /history became /insights when the screen stopped being a list of
      // readings. Installed apps carry the old manifest shortcut and people
      // have the old URL bookmarked, so it has to keep resolving.
      { source: '/history', destination: '/insights', permanent: true }
    ];
  }
};

const withMDX = createMDX({
  options: {
    // Tables, chiefly. An article about how long something takes is mostly a
    // table of durations, and plain MDX renders pipe syntax as literal pipes.
    remarkPlugins: [remarkGfm]
  }
});

export default withMDX(nextConfig);
