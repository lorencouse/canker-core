# Canker Core on phones

Canker Core ships as one codebase in three forms: a responsive website, an
installable PWA, and native iOS/Android apps built with Capacitor. They are
the same pages — there is no separate mobile build, and no feature that
exists in one and not the others.

## How the native app is packaged

The native apps are a **shell around the hosted site**, not a bundled copy
of it.

This is a consequence of the stack, not a preference. The app uses server
components, server actions, Next middleware, and a Better Auth session
backed by Postgres. `output: 'export'` supports none of those, so a static
Capacitor bundle would mean rewriting the entire data layer as a client that
talks to a separately deployed API. Wrapping the deployed app costs nothing
and loses nothing that a phone user would notice.

```
capacitor.config.ts
  server.url    → https://cankercore.com   (CAPACITOR_SERVER_URL to override)
  webDir        → native/shell             (shown when the network is down)
```

What follows from that:

- **The app needs a connection.** `native/shell/index.html` is what the user
  sees when it does not have one. It is deliberately a real screen, not a
  webview error.
- **Deploys reach the app immediately**, with no store review. Only changes
  to the shell, the icons, or a plugin need a new binary.
- **Auth works unchanged.** The session is an ordinary cookie on the
  deployed origin, and the OAuth providers are listed in
  `server.allowNavigation` so the sign-in handoff stays inside the app.

## Building the native projects

The `ios/` and `android/` directories are generated and untracked. Create
them once per machine:

```bash
npm run cap:add:ios        # needs Xcode
npm run cap:add:android    # needs Android Studio
```

Then, whenever `capacitor.config.ts` or a plugin changes:

```bash
npm run cap:ios            # sync + open Xcode
npm run cap:android        # sync + open Android Studio
```

To point a build at a local dev server instead of production — the usual way
to work on the native chrome — set the URL to your machine's LAN address, not
localhost, which inside the simulator means the simulator:

```bash
CAPACITOR_SERVER_URL=http://192.168.0.50:3100 npm run cap:sync
```

Icons are generated from the mark in `components/icons/Logo.tsx`:

```bash
node scripts/generate-app-icons.mjs
```

## The layout

Three shells, one per route group, all under the root layout:

| Group | Chrome | Where |
| --- | --- | --- |
| `app/(marketing)` | navbar + footer | home, about, legal |
| `app/(app)` | top bar + bottom tabs | map, history, settings |
| `app/signin` | wordmark only | sign-in and password flows |

The signed-in app is the one with an app-shaped layout. Chrome is **fixed**
top and bottom with the content scrolling between them, because a sticky
header re-lays-out as the mobile address bar collapses, and it can be
scrolled away mid-gesture on the mouth map. `.app-scroll` supplies the
padding that keeps content clear of both bars.

Navigation is a bottom tab bar under `lg`, and the same three destinations
inline in the top bar from `lg` up. Sign out is in the top bar on desktop
and at the foot of Settings on a phone — it is an action, not a destination,
so it does not get a tab.

### The mouth map screen

The one screen that genuinely changes shape:

- **Desktop** — map on the left, readings in a column beside it.
- **Phone** — map fills the screen; readings arrive in a bottom sheet when a
  sore is selected. The sheet is the point: pushing readings below the map
  would scroll the map you just tapped off the top of the screen.

Which one renders is decided in JavaScript (`useIsCompact`), not by CSS
visibility, so only one is ever mounted — a hidden sheet is still a focus
trap, and a duplicated map would be two cameras and two view states.

The editing session's undo snapshot therefore lives in `SoreContext` rather
than in the action bar, which is rendered under the map on desktop and
inside the sheet on a phone.

## Conventions

Anything new should hold to these.

**Safe areas.** Read `--safe-top` / `--safe-bottom` / `--safe-left` /
`--safe-right`, or use `.safe-t` / `.safe-b` / `.safe-x`. Never call `env()`
directly — the variables are one place to adjust for a device the insets get
wrong.

**Viewport units.** `dvh`, never `vh`. `vh` is the tallest the viewport ever
gets, which on a phone is the state with the address bar hidden.

**Touch targets.** Primary controls take `size="touch"` (48px, stepping down
to 40px on a pointer device). A control that must stay visually small gets
the `.tap-target` utility, which expands its hit area to 44px without
changing what is drawn.

**Coarse pointers, not narrow screens.** Size controls off
`@media (pointer: coarse)` where the distinction matters. A small laptop
window is not a phone.

**Text selection.** Chrome is `user-select: none`; content elements opt back
in. Add `data-selectable` to anything new that a person might want to copy.

**Native APIs.** Go through `utils/native.ts`. Every helper there is a no-op
on the web, so nothing else has to branch on the platform. Links that leave
the app must use `openExternal` — the webview has no URL bar to get back
from github.com with.

**Keyboard.** Surfaces that a soft keyboard would cover pad themselves by
`--keyboard-h`, which `NativeBridge` maintains. The webview is not resized.
