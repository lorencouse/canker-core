import { Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import type { Alert } from '@canker/core';

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((a, i) => (
        <li
          key={i}
          className="border-warn/40 bg-warn-soft text-foreground flex gap-3 rounded-lg border px-3 py-2.5 text-sm"
        >
          <AlertTriangle className="text-warn mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p>{a.message}</p>
            {a.sore_id ? (
              <Link
                to="/sores/$soreId"
                params={{ soreId: a.sore_id }}
                className="text-warn mt-0.5 inline-block text-xs font-medium underline-offset-2 hover:underline"
              >
                View sore
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
