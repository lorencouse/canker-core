import { describe, expect, it } from 'vitest';

import { buildCommit, buildLabel, gitBuildNumber } from './build-label.mjs';

describe('buildLabel', () => {
  it('numbers the version by commit count', () => {
    expect(buildLabel('234')).toBe('v1.234');
    expect(buildLabel(' 31\n')).toBe('v1.31');
    expect(buildLabel(1)).toBe('v1.1');
  });

  it('falls back to dev without a usable count', () => {
    expect(buildLabel(undefined)).toBe('dev');
    expect(buildLabel('')).toBe('dev');
    expect(buildLabel('0')).toBe('dev');
    expect(buildLabel('abc')).toBe('dev');
  });
});

describe('buildCommit', () => {
  it('keeps the short commit', () => {
    expect(buildCommit('0913AD8f00d1\n')).toBe('0913ad8');
  });

  it('is empty without a usable commit', () => {
    expect(buildCommit(undefined)).toBe('');
    expect(buildCommit('not-a-sha')).toBe('');
  });
});

describe('gitBuildNumber', () => {
  // A fake git: each command's stdout, or a throw for a non-zero exit.
  function fakeGit(replies: Record<string, string | Error>) {
    return (args: string[]) => {
      const reply = replies[args.join(' ')];
      if (reply === undefined) throw new Error(`unexpected git ${args}`);
      if (reply instanceof Error) throw reply;
      return reply;
    };
  }

  const onMain = {
    'rev-parse --is-shallow-repository': 'false\n',
    'merge-base --is-ancestor HEAD origin/main': '',
    'rev-list --count HEAD': '31\n'
  };

  it('counts HEAD when it is on origin/main in a full clone', () => {
    expect(gitBuildNumber(fakeGit(onMain))).toBe('31');
  });

  it('has no number off origin/main', () => {
    const git = fakeGit({
      ...onMain,
      'merge-base --is-ancestor HEAD origin/main': new Error('exit 1')
    });
    expect(gitBuildNumber(git)).toBeUndefined();
  });

  it('has no number in a shallow clone', () => {
    const git = fakeGit({
      ...onMain,
      'rev-parse --is-shallow-repository': 'true\n'
    });
    expect(gitBuildNumber(git)).toBeUndefined();
  });

  it('has no number outside git', () => {
    expect(gitBuildNumber(fakeGit({}))).toBeUndefined();
  });

  it('labels a missing number dev', () => {
    expect(buildLabel(gitBuildNumber(fakeGit({})))).toBe('dev');
  });
});
