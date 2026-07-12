import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Usage } from '@/lib/types';

function formatUsd(value: number): string {
  if (value < 0.01 && value > 0) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatResetIn(resetAt: string): string {
  const ms = new Date(resetAt).getTime() - Date.now();
  if (ms <= 0) {
    return 'resets now';
  }
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) {
    return `resets in ${minutes}m`;
  }
  return `resets in ${Math.round(minutes / 60)}h`;
}

export function UsageBadge({ usage }: { usage: Usage | null }) {
  if (!usage) {
    return null;
  }

  const ratio = usage.limitUsd > 0 ? usage.spendUsd / usage.limitUsd : 0;
  const isOverBudget = ratio >= 1;
  const isNearBudget = ratio >= 0.8;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-normal',
        isOverBudget && 'border-destructive/50 text-destructive',
        !isOverBudget && isNearBudget && 'border-amber-500/50 text-amber-600 dark:text-amber-500',
      )}
      title={formatResetIn(usage.resetAt)}
    >
      {formatUsd(usage.spendUsd)} / {formatUsd(usage.limitUsd)}
    </Badge>
  );
}
