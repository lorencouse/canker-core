'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';

/**
 * Settings as the system Settings app draws it: inset groups of rows, each
 * with a coloured icon tile, its name, its current value and a chevron
 * where it opens something. The rule between rows starts after the tile,
 * as on iOS. Rows press in on touch (scale and tint), never hover only.
 */

export function Group({
  children,
  label
}: {
  children: ReactNode;
  /** Names the group for a screen reader. */
  label?: string;
}) {
  return (
    <ul
      aria-label={label}
      className="overflow-hidden rounded-worksheet bg-card [&>li+li_.row-body]:border-t [&>li+li_.row-body]:border-border"
    >
      {children}
    </ul>
  );
}

export type TileColor = 'indigo' | 'amber' | 'green' | 'slate';

const TILE: Record<TileColor, string> = {
  indigo: 'bg-tile-indigo',
  amber: 'bg-tile-amber',
  green: 'bg-tile-green',
  slate: 'bg-tile-slate'
};

export function Tile({
  icon: Icon,
  color
}: {
  icon: ComponentType<{ className?: string }>;
  color: TileColor;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-[0.5rem] text-white',
        TILE[color]
      )}
    >
      <Icon className="size-[1.125rem]" />
    </span>
  );
}

type RowProps = {
  /** The tile, or anything as wide (the profile's Kanko). */
  lead?: ReactNode;
  label: ReactNode;
  /** A second line under the label (the profile's email). */
  sub?: ReactNode;
  /** The current setting, at the row's end in grey. */
  value?: ReactNode;
  /** A row that opens something gets a chevron; an action row does not. */
  chevron?: boolean;
  tone?: 'default' | 'destructive';
  className?: string;
};

function RowInner({ lead, label, sub, value, chevron, tone }: RowProps) {
  return (
    <>
      {lead}
      <span className="row-body flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2.5 pr-4">
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-base font-semibold',
              tone === 'destructive' ? 'text-destructive' : 'text-foreground'
            )}
          >
            {label}
          </span>
          {sub && (
            <span className="block truncate text-sm text-muted-foreground">
              {sub}
            </span>
          )}
        </span>
        {value !== undefined && (
          <span className="tabular shrink-0 whitespace-nowrap text-[15px] text-muted-foreground">
            {value}
          </span>
        )}
        {chevron && (
          <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
        )}
      </span>
    </>
  );
}

const rowClass = (className?: string) =>
  cn(
    'focus-ring flex w-full items-center gap-3 pl-4 text-left transition-[transform,background-color] duration-150 hover:bg-muted/60 active:scale-[0.99] active:bg-muted',
    className
  );

export function LinkRow({ href, ...props }: RowProps & { href: string }) {
  return (
    <li>
      <Link
        href={href}
        onClick={() => tap()}
        className={rowClass(props.className)}
      >
        <RowInner chevron {...props} />
      </Link>
    </li>
  );
}

export function ButtonRow({
  onClick,
  disabled,
  ...props
}: RowProps & { onClick: () => void; disabled?: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          tap();
          onClick();
        }}
        disabled={disabled}
        className={rowClass(cn('disabled:opacity-50', props.className))}
      >
        <RowInner {...props} />
      </button>
    </li>
  );
}

/** A sub-screen's way back to the list, where an app's nav bar puts it. */
export function BackToSettings() {
  return (
    <Link
      href="/profile"
      onClick={() => tap()}
      className="focus-ring -ml-2 inline-flex h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-base font-semibold text-primary transition-transform active:scale-[0.97]"
    >
      <ChevronLeft aria-hidden="true" className="size-6" />
      Settings
    </Link>
  );
}
