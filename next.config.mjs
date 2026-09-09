/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone — a self-contained server bundle with only the
  // modules actually imported. The Dockerfile's runner stage copies it instead
  // of the whole node_modules tree, which keeps the image small.
  output: 'standalone',

  // `pg` and `nodemailer` are native/CJS server-only packages; bundling them
  // into the server build breaks their dynamic requires.
  serverExternalPackages: ['pg', 'nodemailer']
};

export default nextConfig;
