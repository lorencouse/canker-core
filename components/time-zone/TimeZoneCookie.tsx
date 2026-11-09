'use client';

import { useEffect } from 'react';

import { localTimeZone } from '@/utils/days';
import { readTimeZoneCookie, timeZoneCookie } from '@/utils/time-zone-cookie';

/** Keeps the `tz` cookie on the device's current zone. Renders nothing. */
export default function TimeZoneCookie() {
  useEffect(() => {
    const zone = localTimeZone();
    if (readTimeZoneCookie(document.cookie) !== zone) {
      document.cookie = timeZoneCookie(zone);
    }
  }, []);
  return null;
}
