import type { Metadata } from 'next';

import Prose from '@/components/marketing/Prose';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms you agree to by using Canker Core.',
  alternates: { canonical: '/terms' }
};

export default function TermsPage() {
  return (
    <Prose
      title="Terms of use"
      intro="The short version: this is a personal record-keeping tool, provided as is, and it is not medical advice."
      updated="9 September 2026"
    >
      <section>
        <h2>Not medical advice</h2>
        <p>
          Canker Core records what you enter and draws it back to you. It does
          not diagnose, treat, or recommend anything, and nothing in it should
          replace advice from a doctor, dentist, or pharmacist. If a sore lasts
          more than three weeks or you are worried about it, seek care.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>
          You are responsible for keeping your sign-in details to yourself and
          for what is entered under your account. Let us know if you think
          someone else has access to it.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          The service is offered as is, without warranty. It may be unavailable
          during maintenance, and while backups are taken, you should not treat
          Canker Core as the only copy of anything you need to keep.
        </p>
      </section>

      <section>
        <h2>Ending things</h2>
        <p>
          You can stop using Canker Core and have your account deleted at any
          time. Accounts used to abuse the service or other people may be
          removed.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          If these terms change in a way that affects you, the date at the top
          of this page changes with them.
        </p>
      </section>
    </Prose>
  );
}
