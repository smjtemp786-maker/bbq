import React from "react";
import { Loader2 } from "lucide-react";

export function Loading({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground" data-testid="loading-state">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center" data-testid="empty-state">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/60" />}
      <h3 className="mt-4 font-heading text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 py-12 px-6 text-center" data-testid="error-state">
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
          Try again
        </button>
      )}
    </div>
  );
}
