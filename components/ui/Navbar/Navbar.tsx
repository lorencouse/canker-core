import { getUser } from '@/lib/queries';
import Navlinks from './Navlinks';

export default async function Navbar() {
  const user = await getUser();

  return (
    <header
      // safe-t keeps the bar clear of the notch when the marketing site is
      // opened from the installed app's sign-in screen.
      className="safe-t safe-x sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur"
    >
      <div className="container">
        <Navlinks signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
