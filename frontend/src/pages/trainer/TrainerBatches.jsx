import React from "react";
import { Boxes, Users, Calendar } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";

export default function TrainerBatches() {
  const { data: batches, loading } = useFetch("/batches");
  if (loading) return <Loading />;
  return (
    <Page title="My Batches" subtitle="Batches you are assigned to teach.">
      {!batches || batches.length === 0 ? (
        <EmptyState icon={Boxes} title="No batches assigned" description="Your center admin will assign batches to you." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`batch-card-${b.id}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Boxes className="h-5 w-5" /></div>
              <h3 className="mt-3 font-heading font-semibold">{b.name}</h3>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {b.student_count} students</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {b.schedule || "No schedule"}</p>
              </div>
              <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${b.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
