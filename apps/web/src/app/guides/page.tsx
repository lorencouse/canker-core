import type { Metadata } from 'next';

import { getAllGuides } from '@/lib/guides';
import { Section } from '@/components/section';
import { GuideCard } from '@/components/guide-card';

export const metadata: Metadata = {
  title: 'Guides',
  description:
    'Plain-English guides to canker sores: how long they last, how they differ from cold sores, common triggers, treatments that help, and when to see a dentist or doctor.',
  alternates: { canonical: '/guides' }
};

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <Section
      as="h1"
      eyebrow="Guides"
      heading="Plain-English answers about canker sores"
      description="General information, written carefully and kept short. None of it is a diagnosis. If something in your mouth worries you, the last guide in the list is the one to read first."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard key={guide.slug} {...guide} />
        ))}
      </div>
    </Section>
  );
}
