// Plain .mjs so next.config.mjs and scripts/build-number.mjs can import it
// without a TypeScript step.

/**
 * The version shown in the footer and Settings: "v1.N", where N is the
 * number of commits on main at the deployed commit (see `gitBuildNumber`),
 * so it rises with every deploy and never needs a manual bump. Without a
 * usable count (a build outside git, off main, from a shallow clone, or an
 * image built without BUILD_NUMBER) it is "dev" rather than a failed build.
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

/**
 * N for "v1.N", from git, or undefined when there is no trustworthy one.
 *
 * Counting HEAD alone would let a deploy from an unmerged branch claim a
 * number a later main commit also gets, and a shallow clone counts only its
 * depth. So HEAD must be on origin/main (the commit itself or one of its
 * ancestors) in a full clone; then HEAD's count is the count main had at that
 * commit. Anything else is undefined, which the label shows as "dev".
 *
 * @param {(args: string[]) => string} git runs git with these arguments and
 *   returns stdout, throwing on a non-zero exit
 * @returns {string | undefined}
 */
export function gitBuildNumber(git) {
  try {
    if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
      return undefined;
    }
    // Throws (exit 1) when HEAD is not on origin/main, or origin/main is unknown.
    git(['merge-base', '--is-ancestor', 'HEAD', 'origin/main']);
    return git(['rev-list', '--count', 'HEAD']).trim();
  } catch {
    return undefined;
  }
}
