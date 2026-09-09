interface ComparisonRow {
  label: string;
  cells: string[];
}

interface ComparisonTableProps {
  caption: string;
  /** Column headings, excluding the leading row-label column. */
  columns: string[];
  rows: ComparisonRow[];
}

/** A small, token-styled table for MDX guides (used instead of GFM tables). */
export function ComparisonTable({ caption, columns, rows }: ComparisonTableProps) {
  return (
    <div className="border-border my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[32rem] border-collapse text-left text-[0.95rem]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted text-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              <span className="sr-only">Aspect</span>
            </th>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-border bg-card border-t">
              <th scope="row" className="text-foreground px-4 py-3 align-top font-medium">
                {row.label}
              </th>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.label}-${columns[index] ?? index}`}
                  className="text-secondary-foreground px-4 py-3 align-top leading-relaxed"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
