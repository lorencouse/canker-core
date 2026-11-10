// Plain .mjs so next.config.mjs can import it without a TypeScript step.

/**
 * The build label shown in the footer and Settings: deploy date (UTC) and
 * short commit, e.g. "2026.11.09 · 0913ad8". Set at build so every deploy
 * changes it with no manual bump. Without a commit (a local build outside
 * git, or an image built without BUILD_COMMIT) it is "dev" rather than a
 * failed build.
 *
 * @param {string | undefined} commit
 * @param {Date} [now]
 * @returns {string}
 */
export function buildLabel(commit, now = new Date()) {
  const sha = (commit ?? '').trim().slice(0, 7);
  if (!/^[0-9a-f]{7}$/i.test(sha)) return 'dev';
  const date = now.toISOString().slice(0, 10).replaceAll('-', '.');
  return `${date} · ${sha.toLowerCase()}`;
}
