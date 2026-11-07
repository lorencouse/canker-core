/*
 * Set once the check-in has been shown and closed, so it does not start
 * again on its own until the next open: a page load starts with it clear,
 * and so does the app coming back to the foreground. It lives outside React
 * so it outlives Today (leaving the tab and coming back is not an open) and
 * so the app-level resume listener can clear it while Today is unmounted.
 */
let held = false;

export const holdAutoStart = () => {
  held = true;
};
export const releaseAutoStart = () => {
  held = false;
};
export const isAutoStartHeld = () => held;
