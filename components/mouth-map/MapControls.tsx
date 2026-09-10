'use client';

import { Minus, Plus, Maximize } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

/**
 * The camera controls that float over the map.
 *
 * Only zoom lives here. Everything about *editing* a sore moved out to
 * SoreActionBar, because on a phone those actions have to be a real row of
 * buttons under a thumb, not 8mm pills sitting on top of the drawing.
 *
 * These stay as overlays at every size: zoom belongs to the surface it
 * zooms, and the map is the surface.
 */
export default function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomed
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Home is the resting state, so Reset only appears once it is not. */
  zoomed: boolean;
}) {
  return (
    <div className="absolute right-2 top-2 flex flex-col gap-1.5">
      <ZoomButton onClick={onZoomIn} label="Zoom in">
        <Plus />
      </ZoomButton>
      <ZoomButton onClick={onZoomOut} label="Zoom out">
        <Minus />
      </ZoomButton>
      <ZoomButton
        onClick={onReset}
        label="Reset zoom"
        className={cn(
          'transition-opacity',
          zoomed ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <Maximize />
      </ZoomButton>
    </div>
  );
}

function ZoomButton({
  onClick,
  label,
  className,
  children
}: {
  onClick: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="overlay"
      size="icon"
      onClick={onClick}
      aria-label={label}
      // Square and thumb-sized on touch, tidier under a cursor.
      className={cn('size-11 rounded-full lg:size-9', className)}
    >
      {children}
    </Button>
  );
}
