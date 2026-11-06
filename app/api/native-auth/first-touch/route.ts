/**
 * GET /api/native-auth/first-touch -> { firstTouch: string | null }
 *
 * The first-touch cookie is httpOnly, so the webview asks for it here before
 * it opens the system sign-in (iOS sheet, Android tab), and passes it to /api/native-auth/start as
 * `ft` (see the comment there). The value is percent-encoded the way it
 * travels in a Cookie header, which is what decodeFirstTouch reads.
 */
import { NextResponse, type NextRequest } from 'next/server';
import {
  FIRST_TOUCH_COOKIE,
  decodeFirstTouch,
  encodeFirstTouch,
  readCookie
} from '@/utils/first-touch';
import { noStore } from '../shared';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const touch = decodeFirstTouch(
    readCookie(request.headers.get('cookie'), FIRST_TOUCH_COOKIE)
  );
  return noStore(
    NextResponse.json({
      firstTouch: touch ? encodeURIComponent(encodeFirstTouch(touch)) : null
    })
  );
}
