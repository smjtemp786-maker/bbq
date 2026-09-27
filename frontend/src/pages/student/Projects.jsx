import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Code2, Gamepad2, Bot, Sparkles, Copy, Trash2, Pencil, FolderOpen, Plus } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/api";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { toast } from "sonner";

const TYPE_META = {
  coding: { icon: Code2, color: "text-blue-600 bg-blue-500/10", to: "/student/coding-lab" },
  game: { icon: Gamepad2, color: "text-fuchsia-600 bg-fuchsia-500/10", to: "/student/game-lab" },
  robotics: { icon: Bot, color: "text-teal-600 bg-teal-500/10", to: "/student/robotics-lab" },
  ai: { icon: Sparkles, color: "text-amber-600 bg-amber-500/10", to: "/student/ai-lab" },
};

export default function Projects() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const { data: projects, loading, reload } = useFetch("/projects");

  const filtered = (projects || []).filter((p) => filter === "all" || p.type === filter);

  const openProject = (p) => {
    localStorage.setItem("bb_open_project", p.id);
    navigate(TYPE_META[p.type]?.to || "/student/coding-lab");
  };

  const rename = async (p) => {
    const name = window.prompt("Rename project", p.name);
    if (!name) return;
    await api.put(`/projects/${p.id}`, { name });
    toast.success("Renamed");
    reload();
  };

  const duplicate = async (p) => {
    await api.post(`/projects/${p.id}/duplicate`);
    toast.success("Duplicated");
    reload();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    await api.delete(`/projects/${p.id}`);
    toast.success("Deleted");
    reload();
  };

  const exportProject = (p) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <Page title="Projects" subtitle="Your saved coding, game, robotics and AI projects."
      actions={
        <button onClick={() => navigate("/student/coding-lab")} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="new-project-button">
          <Plus className="h-4 w-4" /> New Project
        </button>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {["all", "coding", "game", "robotics", "ai"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`project-filter-${f}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Head to a lab and save your first creation — it's stored locally first, then synced."
          action={<button onClick={() => navigate("/student/coding-lab")} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open Coding Lab</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {filtered.map((p) => {
            const meta = TYPE_META[p.type] || TYPE_META.coding;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`project-card-${p.id}`}>
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.color}`}>
                    <meta.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{p.type}</span>
                </div>
                <h3 className="mt-3 font-heading font-semibold">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Updated {new Date(p.updated_at).toLocaleDateString()}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openProject(p)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" data-testid={`open-project-${p.id}`}>
                    <FolderOpen className="h-3.5 w-3.5" /> Open
                  </button>
                  <button onClick={() => rename(p)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => duplicate(p)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => exportProject(p)} className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted">Export</button>
                  <button onClick={() => remove(p)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
