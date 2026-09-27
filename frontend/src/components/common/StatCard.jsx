import React from "react";
import { cn } from "@/lib/utils";

export function StatCard({ icon: Icon, label, value, sub, accent = "primary", testId }) {
  const accents = {
    primary: "text-primary bg-primary/10",
    teal: "text-teal-600 bg-teal-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    violet: "text-violet-600 bg-violet-500/10",
    rose: "text-rose-600 bg-rose-500/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
  };
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accents[accent])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-3 font-heading text-3xl font-bold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
