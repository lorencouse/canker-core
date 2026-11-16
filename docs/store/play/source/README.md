# How the Play graphics were made

- `frame.html` frames one app screen under a short caption:
  `frame.html?fit=1&w=1080&h=1920&img=<screen png>&cap=Watch it <em>shrink</em>`,
  opened in Chrome with the viewport at exactly w x h (device scale 1) and
  screenshotted. Tablets use w=1600, h=2560. `fit=1` sizes the screen to the
  height, so a whole phone screen, navigation bar included, shows.
- The screens are `adb exec-out screencap` from the Android emulator
  (Medium*Phone_API_37.0, system demo mode for a clean status bar) running a
  debug build whose `CAPACITOR_SERVER_URL` is a scratch backend: a local
  Postgres seeded with `scripts/seed-review-account.sql`. Tablet screens are
  the same emulator with `adb shell wm size 1600x2560` and `wm density 320`.
  Sign-in and page changes were driven through the debug WebView's DevTools
  socket (`adb forward tcp:9333 localabstract:webview_devtools_remote*<pid>`).
- `feature-graphic.html` is the 1024x500 feature graphic; saved through JPEG
  so the PNG has no alpha.

Captions stay at two to four words (glanceable, low-word), sentence case,
with the one key word in sunflower. They describe what the app does, never
an outcome or a cause ("See your patterns", not "Find your triggers").
