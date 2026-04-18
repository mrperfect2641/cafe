'use client';

import { Lightbulb, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { SmartInsight } from '@/types/analytics';
import { cn } from '@/lib/utils';

const toneStyles = {
  positive: {
    border: 'border-emerald-500/30 bg-emerald-500/5',
    icon: TrendingUp,
    iconClass: 'text-emerald-500',
  },
  warning: {
    border: 'border-amber-500/30 bg-amber-500/5',
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
  },
  neutral: {
    border: 'border-sky-500/30 bg-sky-500/5',
    icon: Info,
    iconClass: 'text-sky-500',
  },
} as const;

export function SmartInsightsPanel({ insights }: Readonly<{ insights: SmartInsight[] }>) {
  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Insights will appear once you have enough order history in the selected range.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        Smart insights
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {insights.map((ins) => {
          const t = toneStyles[ins.tone];
          const Icon = t.icon;
          return (
            <li
              key={ins.id}
              className={cn('rounded-xl border p-4 shadow-sm', t.border)}
            >
              <div className="flex gap-3">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', t.iconClass)} />
                <div>
                  <p className="font-medium leading-tight">{ins.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ins.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
