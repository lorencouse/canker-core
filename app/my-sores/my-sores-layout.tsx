'use client';

import MouthMap from '@/components/mouth-map/MouthMap';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import { SoreDetails } from '@/components/SoreDetails';
import SeverityKey from '@/components/SeverityKey';
import { User, Sore } from '@/types';

export const MySoresLayout = ({
  user,
  soresData
}: {
  user: User;
  soresData: Sore[];
}) => (
  <SoreProvider initialSores={soresData}>
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="text-title">Your mouth map</h1>
        <p className="prose-measure mt-2 text-muted-foreground">
          Pick the part of your mouth, then tap a sore to see its readings. Use
          Add to mark a new one, or Edit to log today&rsquo;s size and pain.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <MouthMap user={user} />
          <div className="mt-4">
            <SeverityKey />
          </div>
        </div>
        <SoreDetails />
      </div>
    </div>
  </SoreProvider>
);

export default MySoresLayout;
