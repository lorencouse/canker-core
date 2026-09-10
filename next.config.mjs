/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig;
