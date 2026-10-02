/**
 * One CSV cell, safe to open in a spreadsheet.
 *
 * A cell that starts with `=`, `+`, `-`, `@`, tab or carriage return is read
 * as a formula by Excel, Sheets and Numbers, so free text such as a note is
 * prefixed with an apostrophe to keep it text. Plain numbers are left alone so
 * a negative value still sorts and charts as a number.
 *
 * Then RFC 4180 quoting: wrap anything with a comma, quote or newline.
 */
export function csvCell(value: string): string {
  const safe =
    /^[=+\-@\t\r]/.test(value) && !/^[+-]?\d+(\.\d+)?$/.test(value)
      ? `'${value}`
      : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
