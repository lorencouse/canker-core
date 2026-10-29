'use client';

import MouthMap from '@/components/mouth-map/MouthMap';
import {
  EditingBar,
  MarkSoreButton
} from '@/components/mouth-map/SoreActionBar';
import { OpenSoresList, SoreDetail } from '@/components/SoreDetails';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import { User, Sore } from '@/types';

/**
 * The mouth map screen. Its question is "where are my sores, and how is
 * this one doing?", so it is laid out as those two halves.
 *
 *   phone     the title and the one primary action, then the map, then the
 *             selected sore's course inline under it, or the list of open
 *             sores when none is selected.
 *   desktop   the same, with the map on the left and the sore on the right,
 *             so the right half is never empty.
 *
 * The detail used to arrive on a phone as a bottom sheet over a blurred
 * map. Inline, it can carry the course chart and the place-against-time
 * list, scrolls like the rest of the page, and leaves the map visible.
 */
export const MySoresLayout = ({
  user,
  soresData,
  initialSelectedId = null,
  startInAddMode = false
}: {
  user: User;
  soresData: Sore[];
  initialSelectedId?: string | null;
  startInAddMode?: boolean;
}) => (
  <SoreProvider
    initialSores={soresData}
    initialSelectedId={initialSelectedId}
    initialMode={startInAddMode ? 'add' : 'view'}
  >
    <MySoresScreen user={user} />
  </SoreProvider>
);

function MySoresScreen({ user }: { user: User }) {
  const { sores, selectedSore } = useSoreContext();
  const open = sores.filter((s) => !s.healed_at).length;
  const healed = sores.length - open;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-6 lg:py-8">
      <header className="flex flex-col gap-3.5 lg:col-span-2 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div>
          <h1 className="text-2xl leading-tight lg:text-3xl">Your mouth map</h1>
          <p className="mt-1.5">
            {sores.length === 0
              ? 'Nothing marked yet. Mark a sore and tap where it is.'
              : `${open} open, ${healed} healed. Tap a sore to read its course.`}
          </p>
        </div>
        <MarkSoreButton className="w-full lg:w-auto" />
      </header>

      <div className="mt-5 space-y-3 lg:mt-6">
        <MouthMap user={user} />
        <EditingBar place="map" />
      </div>

      <div className="mt-5 lg:mt-6">
        {selectedSore ? <SoreDetail /> : <OpenSoresList />}
      </div>
    </div>
  );
}

export default MySoresLayout;
