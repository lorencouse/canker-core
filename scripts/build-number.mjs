// Prints N for the "v1.N" version, the same way next.config.mjs derives it,
// so a deploy can pass it into the image as BUILD_NUMBER. Prints nothing
// (and the image shows "dev") off origin/main or in a shallow clone.
import { execFileSync } from 'node:child_process';

import { gitBuildNumber } from '../utils/build-label.mjs';

const n = gitBuildNumber((args) =>
  execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
);
if (n) console.log(n);
