import { describe, expect, it } from 'vitest';

import { csvCell } from './csv';

describe('csvCell', () => {
  it('passes plain text through', () => {
    expect(csvCell('front')).toBe('front');
    expect(csvCell('')).toBe('');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "ow"')).toBe('"say ""ow"""');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('neutralises cells a spreadsheet would run as a formula', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1 worse today')).toBe("'+1 worse today");
    expect(csvCell('-ish')).toBe("'-ish");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('\tcmd')).toBe("'\tcmd");
  });

  it('leaves plain numbers as numbers', () => {
    expect(csvCell('-2.50')).toBe('-2.50');
    expect(csvCell('3')).toBe('3');
  });
});
