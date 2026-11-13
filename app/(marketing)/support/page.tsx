import type { Metadata } from 'next';
import Link from 'next/link';

import Prose from '@/components/marketing/Prose';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'How to get help with Canker Core, the website and the iPhone and Android apps.',
  alternates: { canonical: '/support' }
};

const linkClass = 'text-primary hover:underline';

export default function SupportPage() {
  return (
    <Prose
      title="Support"
      intro="Questions, problems or ideas about Canker Core, on the website or in the apps."
    >
      <section>
        <h2>Get in touch</h2>
        <p>
          Email{' '}
          <a href="mailto:hello@cankercore.com" className={linkClass}>
            hello@cankercore.com
          </a>
          . Say which device you use and what happened.
        </p>
      </section>

      <section>
        <h2>Your account and data</h2>
        <p>
          To download everything you have logged, or to delete your account and
          every reading attached to it, open Settings, then Account. See{' '}
          <Link href="/privacy" className={linkClass}>
            the privacy page
          </Link>{' '}
          for what is stored.
        </p>
      </section>

      <section>
        <h2>Medical questions</h2>
        <p>
          Canker Core is a log, not medical advice. A mouth ulcer that has not
          started shrinking after two weeks, keeps coming back, or comes with
          fever or weight loss is worth taking to a doctor or dentist.
        </p>
      </section>
    </Prose>
  );
}
