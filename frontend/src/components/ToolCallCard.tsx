import { useState } from 'react';
import { ChevronDownIcon, DatabaseIcon, LoaderCircleIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ToolCall } from '@/lib/types';

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return String(value);
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">No rows found - data not available.</p>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="max-h-64 overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-3 py-1.5 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-3 py-1.5 font-mono">
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Renders one SQL tool call live as it happens: shown the moment the query
// is decided (pending), then filled in with results once they arrive.
// Defaults to expanded - the whole point is that the query stays visibly
// rendered, not that it collapses back into a one-line summary the moment
// it resolves. Still collapsible, for a long chat history.
export function ToolCallCard({ toolCall, pending }: { toolCall: ToolCall; pending?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full max-w-full overflow-hidden rounded-lg border bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50"
      >
        {pending ? (
          <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin" />
        ) : (
          <DatabaseIcon className="size-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate font-medium">
          {pending ? 'Querying financial_data…' : 'Queried financial_data'}
        </span>
        {!pending && (
          <ChevronDownIcon className={cn('size-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
        )}
      </button>
      {(isOpen || pending) && (
        <div className="border-t">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-xs text-muted-foreground">
            {toolCall.sql}
          </pre>
          {!pending && (
            <div className="border-t">
              {toolCall.error ? (
                <p className="px-3 py-2 text-sm text-destructive">{toolCall.error}</p>
              ) : (
                <ResultTable rows={toolCall.rows} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
