import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';

import HowLongDoCankerSoresLast, {
  metadata as howLongMeta
} from '@/content/guides/how-long-do-canker-sores-last.mdx';
import CankerSoreVsColdSore, {
  metadata as vsColdSoreMeta
} from '@/content/guides/canker-sore-vs-cold-sore.mdx';
import CommonCankerSoreTriggers, {
  metadata as triggersMeta
} from '@/content/guides/common-canker-sore-triggers.mdx';
import CankerSoreTreatmentsThatHelp, {
  metadata as treatmentsMeta
} from '@/content/guides/canker-sore-treatments-that-help.mdx';
import WhenToSeeADoctor, {
  metadata as whenToSeeMeta
} from '@/content/guides/when-to-see-a-doctor-about-mouth-ulcers.mdx';

export interface GuideMetadata {
  title: string;
  description: string;
  /** ISO date, e.g. 2026-09-01 */
  publishedAt: string;
  readingMinutes: number;
  /** Optional one-sentence lead for the closing "Track it" callout. */
  trackIt?: string;
}

export interface Guide extends GuideMetadata {
  slug: string;
  Content: ComponentType<MDXProps>;
}

const registry: readonly Guide[] = [
  {
    slug: 'how-long-do-canker-sores-last',
    Content: HowLongDoCankerSoresLast,
    ...howLongMeta
  },
  {
    slug: 'canker-sore-vs-cold-sore',
    Content: CankerSoreVsColdSore,
    ...vsColdSoreMeta
  },
  {
    slug: 'common-canker-sore-triggers',
    Content: CommonCankerSoreTriggers,
    ...triggersMeta
  },
  {
    slug: 'canker-sore-treatments-that-help',
    Content: CankerSoreTreatmentsThatHelp,
    ...treatmentsMeta
  },
  {
    slug: 'when-to-see-a-doctor-about-mouth-ulcers',
    Content: WhenToSeeADoctor,
    ...whenToSeeMeta
  }
];

/** All guides, newest first. */
export function getAllGuides(): Guide[] {
  return [...registry].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getGuide(slug: string): Guide | undefined {
  return registry.find((guide) => guide.slug === slug);
}

export function getGuideSlugs(): string[] {
  return registry.map((guide) => guide.slug);
}

export function formatGuideDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
