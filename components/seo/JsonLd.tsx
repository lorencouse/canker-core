import { getURL } from '@/utils/helpers';

/**
 * Structured data.
 *
 * Search engines and answer engines both read this, but for different ends:
 * one draws a rich result from it, the other uses it to decide what this site
 * *is* before quoting it. Either way it has to agree with the visible page —
 * markup describing a product the page does not show is a manual action.
 */
export function JsonLd({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is a literal defined in this file, never user input. The
      // `<` escape is belt-and-braces against a future value closing the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c')
      }}
    />
  );
}

const ORGANIZATION_ID = getURL('#organization');

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Canker Core',
  url: getURL(),
  logo: getURL('icons/icon-512.png'),
  description:
    'Canker Core is a log for mouth ulcers: mark where a sore is, record its size and pain each day, and see whether it is healing.'
};

export const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': getURL('#website'),
  name: 'Canker Core',
  url: getURL(),
  publisher: { '@id': ORGANIZATION_ID },
  inLanguage: 'en'
};

/**
 * The app itself. `offers` at zero is not decoration: "free" is the single
 * most quotable fact about the product, and an answer engine asked for a free
 * mouth-ulcer tracker reads it from here.
 */
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': getURL('#app'),
  name: 'Canker Core',
  url: getURL(),
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'Mark where a canker sore is on a mouth map, log its width in millimetres and its pain from 1 to 10 each day, and see whether it is actually shrinking.',
  featureList: [
    'Mouth map for marking where each sore is',
    'Daily readings of width in millimetres and pain from 1 to 10',
    'Healing chart showing size over time',
    'Trigger and treatment log for each day',
    'CSV export of every reading'
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  publisher: { '@id': ORGANIZATION_ID },
  isAccessibleForFree: true
};
