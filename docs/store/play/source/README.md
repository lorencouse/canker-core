# How the Play graphics were made

- `frame.html` frames one app screen under a short caption:
  `frame.html?w=1080&h=1920&img=<screen png>&cap=Watch it <em>shrink</em>`,
  opened in Chrome with the viewport at exactly w x h (device scale 1) and
  screenshotted. Tablets use w=1600, h=2560.
- The screens are the signed-in app rendered from a scratch backend (a local
  Postgres with the demo history in `scripts/seed-review-account.sql`), at
  412x760 CSS px x2.625 for phones and 800x1280 x2 for tablets.
- `feature-graphic.html` is the 1024x500 feature graphic; saved through JPEG
  so the PNG has no alpha.

Captions stay at two to four words (glanceable, low-word), sentence case,
with the one key word in sunflower. They describe what the app does, never
an outcome or a cause ("See your patterns", not "Find your triggers").
