import type { Metadata } from 'next';

import LostScreen from '@/components/shell/LostScreen';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false }
};

export default function NotFound() {
  return (
    <LostScreen
      title="This page has wandered off"
      body="The link may be old, or the address has a typo. Nothing of yours is lost."
    />
  );
}
