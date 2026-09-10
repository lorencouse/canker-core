import type { MetadataRoute } from 'next';

/**
 * The web app manifest.
 *
 * This is what makes the site installable from a browser, and it is the
 * same shell the Capacitor build wraps — so an Android user who taps
 * "Install" and one who downloads the app land on the identical layout.
 *
 * `start_url` is the daily check-in rather than the marketing home page:
 * someone who has installed the app has already been sold on it, and an
 * install that opens on a landing page feels like a bookmark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Canker Core',
    short_name: 'Canker Core',
    description:
      'Mark where a mouth sore is, log its size and pain each day, and see whether it is healing.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Matches the dark ground the splash and native shell use, so a cold
    // start does not flash white before the theme resolves.
    background_color: '#131a21',
    theme_color: '#131a21',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        // Cropped by the launcher to its own shape; the mark is inset so
        // nothing important is inside the crop.
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Today’s check-in',
        short_name: 'Today',
        url: '/today'
      },
      {
        name: 'Your mouth map',
        short_name: 'Map',
        url: '/my-sores'
      },
      {
        name: 'Patterns and history',
        short_name: 'Insights',
        url: '/insights'
      }
    ]
  };
}
