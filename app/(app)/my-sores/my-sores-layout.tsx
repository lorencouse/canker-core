'use client';

import MouthMap from '@/components/mouth-map/MouthMap';
import LargeTitle from '@/components/shell/LargeTitle';
import PushScreen from '@/components/shell/PushScreen';
import InfoButton from '@/components/ui/info-button';
import {
  EditingBar,
  MarkSoreButton
} from '@/components/mouth-map/SoreActionBar';
import { OpenSoresList, SoreDetail } from '@/components/SoreDetails';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import { User, Sore } from '@/types';
import { cn } from '@/utils/cn';
import { useUnsavedGuard } from '@/utils/hooks/useUnsavedGuard';

/**
 * The mouth map screen. Its question is "where are my sores, and how is
 * this one doing?", so it is laid out as those two halves.
 *
 *   phone     the large title and the one primary action, then the map, then the
 *             selected sore's course inline under it, or the list of open
 *             sores when none is selected.
 *   desktop   the same, with the map on the left and the sore on the right,
 *             so the right half is never empty.
 *
 * The detail used to arrive on a phone as a bottom sheet over a blurred
 * map. Inline, it can carry the course chart and the place-against-time
 * list, scrolls like the rest of the page, and leaves the map visible.
 */
const MySoresLayout = ({
  user,
  soresData,
  initialSelectedId = null,
  startInAddMode = false,
  startLogging = false
}: {
  user: User;
  soresData: Sore[];
  initialSelectedId?: string | null;
  startInAddMode?: boolean;
  /** Open the selected sore's card on today's reading. */
  startLogging?: boolean;
}) => (
  <SoreProvider
    initialSores={soresData}
    initialSelectedId={initialSelectedId}
    initialMode={startInAddMode ? 'add' : 'view'}
    initialLog={startLogging}
  >
    <MySoresScreen user={user} />
  </SoreProvider>
);

function MySoresScreen({ user }: { user: User }) {
  const { sores, selectedSore, mode, snapshot, changedSores } = useSoreContext();
  // Anything placed, moved or logged since the session opened.
  const dirty =
    mode !== 'view' &&
    snapshot !== null &&
    (sores.length !== snapshot.length || changedSores.length > 0);
  useUnsavedGuard(dirty);
  const open = sores.filter((s) => !s.healed_at).length;
  const healed = sores.length - open;

  return (
    <div
      className={cn(
        // On a spanned Duo the map takes the first screen and the sore's
        // detail the second (THE FOLD in styles/main.css).
        'fold-shell fold-split mx-auto grid max-w-6xl grid-cols-1 gap-x-8 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-6 lg:py-8',
        // Room under the reading for the Done bar that floats over it.
        mode !== 'view' && selectedSore && 'pb-28 lg:pb-8'
      )}
    >
      <div className="fold-across flex flex-col gap-3.5 lg:col-span-2 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <LargeTitle
          below={
            sores.length === 0 ? 'Nothing marked' : `${open} open · ${healed} healed`
          }
          accessory={
            <InfoButton title="The mouth map" label="About the mouth map">
              <p>Tap a sore to read its course.</p>
              <p>As in a mirror: your left is on the left.</p>
            </InfoButton>
          }
        >
          Map
        </LargeTitle>
        <MarkSoreButton className="w-full lg:w-auto" />
      </div>

      <div className="mt-5 space-y-3 lg:mt-6">
        <MouthMap user={user} showMirrorNote={false} />
        <EditingBar place="map" />
      </div>

      <div className="mt-5 lg:mt-6">
        {/* The detail pushes over the list and pops back (PushScreen). */}
        {selectedSore ? (
          <PushScreen key="detail">
            <SoreDetail />
          </PushScreen>
        ) : (
          <PushScreen key="list">
            <OpenSoresList />
          </PushScreen>
        )}
      </div>
    </div>
  );
}

export default MySoresLayout;
