/**
 * Where the native apps are listed. The /app page and anything else that
 * links to a store reads these, so a listing going live is one edit here.
 */

export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.cankercore.app';

/*
 * APP STORE SLOT. iOS is still in review, so while this is null no App Store
 * badge renders and the /app page shows a plain "on its way" note instead.
 * When the listing is live, swap the two lines below and drop Apple's
 * official, unmodified "Download on the App Store" badge (black, en-US, from
 * Apple's marketing tools) at public/images/app/app-store-badge.svg;
 * components/marketing/StoreBadges.tsx already draws it beside the Play badge.
 */
// export const APP_STORE_URL: string | null = 'https://apps.apple.com/app/id6834584957';
export const APP_STORE_URL: string | null = null;
