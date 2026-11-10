// Plain .mjs so next.config.mjs can import it without a TypeScript step.

/**
 * The version shown in the footer and Settings: "v1.N", where N is the
 * number of commits on main at the deployed commit, so it rises with every
 * deploy and never needs a manual bump. Without a usable count (a local
 * build outside git, or an image built without BUILD_NUMBER) it is "dev"
 * rather than a failed build.
 *
 * @param {string | number | undefined} count
 * @returns {string}
 */
export function buildLabel(count) {
  const n = String(count ?? '').trim();
  if (!/^[1-9][0-9]*$/.test(n)) return 'dev';
  return `v1.${n}`;
}

/**
 * The short commit, kept in the label's tooltip for debugging; empty when
 * there is none.
 *
 * @param {string | undefined} commit
 * @returns {string}
 */
export function buildCommit(commit) {
  const sha = (commit ?? '').trim().slice(0, 7);
  return /^[0-9a-f]{7}$/i.test(sha) ? sha.toLowerCase() : '';
}
