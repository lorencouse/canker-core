import Kanko from '@/components/kanko/Kanko';
import type { KankoMood } from '@/components/kanko/moods';

/**
 * Kanko over the sign-in card: waving on the forms, holding the envelope
 * once a link has been sent. Lives with the page rather than the layout
 * because only the page knows which of the two it is showing.
 *
 * Only on screens tall enough to spare the room, so the form is never
 * pushed under a phone keyboard. The webview does not shrink for the
 * keyboard, so the open state is hidden too.
 */
export default function SignInKanko({ mood }: { mood: KankoMood }) {
  return (
    <div className="-mb-3 -mt-2 hidden justify-center [@media(min-height:640px)]:flex [[data-keyboard=open]_&]:!hidden">
      {/* 168px on a phone, 200px from sm up; the art carries its own margin, so the wrapper pulls in. */}
      <Kanko
        mood={mood}
        size={200}
        className="size-[168px] sm:size-[200px]"
      />
    </div>
  );
}
