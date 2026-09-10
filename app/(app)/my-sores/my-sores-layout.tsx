'use client';

import MouthMap from '@/components/mouth-map/MouthMap';
import SoreActionBar from '@/components/mouth-map/SoreActionBar';
import SoreSliders from '@/components/mouth-map/SoreSliders';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import {
  SoreEmptyState,
  SoreNavigator,
  SoreReadings
} from '@/components/SoreDetails';
import SeverityKey from '@/components/SeverityKey';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useIsCompact } from '@/utils/hooks/useMediaQuery';
import { User, Sore } from '@/types';

/**
 * The mouth map screen.
 *
 * The layout is the same content arranged two ways, chosen by pointer width:
 *
 *   desktop   map on the left, readings in a column beside it, both visible
 *             at once because there is room for both.
 *   phone     map fills the screen; readings arrive as a bottom sheet when a
 *             sore is selected, and leave when it is not.
 *
 * The sheet is the important half. The alternative — pushing readings below
 * the map — means every tap on a sore scrolls the map you were tapping off
 * the top of the screen.
 */
export const MySoresLayout = ({
  user,
  soresData,
  initialSelectedId = null
}: {
  user: User;
  soresData: Sore[];
  initialSelectedId?: string | null;
}) => (
  <SoreProvider initialSores={soresData} initialSelectedId={initialSelectedId}>
    <MySoresScreen user={user} />
  </SoreProvider>
);

function MySoresScreen({ user }: { user: User }) {
  const { selectedSore, setSelectedSore, mode } = useSoreContext();
  const { isCompact, mounted } = useIsCompact();

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 lg:px-6 lg:py-8">
      {/*
        The desktop screen gets a heading and an explanation. The phone one
        does not: the top bar already says Map, and a paragraph of
        instructions above the fold would push the map itself below it.
      */}
      <header className="mb-6 hidden lg:block">
        <h1 className="text-title">Your mouth map</h1>
        <p className="prose-measure mt-2 text-muted-foreground">
          Pick the part of your mouth, then tap a sore to see its readings. Use
          Add to mark a new one, or Edit to log today&rsquo;s size and pain.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-3">
          <MouthMap user={user} />
          <SeverityKey />
          <SoreActionBar />
        </div>

        {mounted && !isCompact && (
          <div className="space-y-4">
            {mode !== 'view' && selectedSore && <SoreSliders />}
            {selectedSore ? (
              <Card>
                <SoreNavigator className="border-b border-border px-2 py-1.5" />
                <CardContent className="pt-5">
                  <SoreReadings />
                </CardContent>
              </Card>
            ) : (
              <SoreEmptyState />
            )}
          </div>
        )}
      </div>

      {mounted && isCompact && (
        <Sheet
          open={Boolean(selectedSore)}
          onOpenChange={(open) => {
            // Dismissing the sheet deselects, but stays in add mode: the
            // point of add mode is placing several sores in a row.
            if (!open) setSelectedSore(null);
          }}
        >
          <SheetContent
            side="bottom"
            // The map is the reason the sheet is a sheet. Reclaiming focus
            // from it is fine, but stealing the pointer would not be.
            onOpenAutoFocus={(e) => e.preventDefault()}
            // The readings are the description; there is no separate line
            // of prose for Radix to point at.
            aria-describedby={undefined}
          >
            <SheetHeader className="pb-2 pt-1">
              <SheetTitle className="sr-only">Sore readings</SheetTitle>
              <SoreNavigator />
            </SheetHeader>
            <SheetBody className="space-y-4">
              {mode !== 'view' && <SoreSliders />}
              <SoreReadings />
              <SoreActionBar />
            </SheetBody>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default MySoresLayout;
