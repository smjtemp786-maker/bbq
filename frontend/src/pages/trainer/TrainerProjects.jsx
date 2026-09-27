import React, { useState, useEffect } from "react";
import { FolderKanban, Code2, Gamepad2, Bot, Sparkles, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { toast } from "sonner";

const ICONS = { coding: Code2, game: Gamepad2, robotics: Bot, ai: Sparkles };

export default function TrainerProjects() {
  const { data: analytics, loading } = useFetch("/analytics/trainer");
  const [projects, setProjects] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!analytics) return;
    (async () => {
      setBusy(true);
      const all = [];
      for (const s of analytics.students) {
        try {
          const { data } = await api.get(`/projects?student_id=${s.student_id}`);
          data.forEach((p) => all.push({ ...p, student_name: s.name }));
        } catch (e) {}
      }
      setProjects(all);
      setBusy(false);
    })();
  }, [analytics]);

  const review = async (p, status) => {
    await api.put(`/projects/${p.id}`, { status });
    setProjects((ps) => ps.map((x) => (x.id === p.id ? { ...x, status } : x)));
    toast.success(`Project ${status}`);
  };

  if (loading || busy) return <Loading label="Loading student projects..." />;

  return (
    <Page title="Project Reviews" subtitle="Review and approve projects submitted by your students.">
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects submitted yet" description="When students save projects in the labs, they'll appear here for review." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const Icon = ICONS[p.type] || Code2;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`review-project-${p.id}`}>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${p.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{p.status || "saved"}</span>
                </div>
                <h3 className="mt-3 font-heading font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">by {p.student_name} · {p.type}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => review(p, "approved")} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white" data-testid={`approve-${p.id}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => review(p, "needs_work")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Needs work</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
