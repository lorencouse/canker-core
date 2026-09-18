import Navlinks from './Navlinks';

/**
 * The public site's header.
 *
 * It deliberately does not resolve the session on the server. Doing so read
 * cookies, which opted the whole marketing route group out of static
 * rendering — the home page cannot be prerendered if its navbar cannot be.
 * Navlinks resolves the session in the browser instead, so a crawler is
 * served the signed-out header from a static file.
 */
export default function Navbar() {
  return (
    <header
      // safe-t keeps the bar clear of the notch when the marketing site is
      // opened from the installed app's sign-in screen.
      className="safe-t safe-x sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur"
    >
      <div className="container">
        <Navlinks />
      </div>
    </header>
  );
}
