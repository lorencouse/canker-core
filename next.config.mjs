/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone — a self-contained server bundle with only the
  // modules actually imported. The Dockerfile's runner stage copies it instead
  // of the whole node_modules tree, which keeps the image small.
  output: 'standalone',

  // `pg` and `nodemailer` are native/CJS server-only packages; bundling them
  // into the server build breaks their dynamic requires.
  serverExternalPackages: ['pg', 'nodemailer'],

  webpack: (config) => {
    // konva/lib/index-node.js pulls in the `canvas` native module for
    // server-side rendering. Every konva component here is client-only
    // ('use client'), so that path is never taken — aliasing it away keeps a
    // heavy native dependency (cairo, pango, libjpeg) out of the Docker image.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  }
};

export default nextConfig;
