import { getUser } from '@/lib/queries';
import Navlinks from './Navlinks';

export default async function Navbar() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container">
        <Navlinks signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
