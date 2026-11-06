import createMDX from '@next/mdx';

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

  async headers() {
    return [
      {
        // Apple fetches this (through its CDN) to trust the iOS app with the
        // site's saved passwords (iCloud Keychain autofill and strong-password
        // suggestions in the app's sign-in forms) and with the universal link
        // the iOS sign-in returns through. The file has no extension,
        // so without this it is served as application/octet-stream, which
        // Apple rejects.
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' }
        ]
      },
      {
        // Android fetches this to verify the App Link the Android sign-in
        // returns through (android:autoVerify in scripts/patch-native.mjs).
        // It must be a plain 200 application/json with no redirect; proxy.ts
        // skips .well-known, so it never gets a first-touch cookie either.
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' }
        ]
      },
      {
        // The native sign-in's https callback carries a handoff token in its
        // query (app/native-auth/callback). Opened in a browser, the page's
        // one link must not send that URL on as a referrer, and nothing may
        // keep a copy.
        source: '/native-auth/callback',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' }
        ]
      }
    ];
  },

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
    //
    // Named, not imported: Turbopack (the default bundler) serialises loader options to
    // pass them across threads and refuses a function, so an imported plugin
    // breaks the dev server while building fine. The string form resolves in
    // both.
    remarkPlugins: [['remark-gfm', {}]]
  }
});

export default withMDX(nextConfig);
