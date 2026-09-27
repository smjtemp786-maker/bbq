import React, { useState } from "react";
import { GraduationCap, Users, CheckCircle2, FolderKanban, AlertTriangle, TrendingUp } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { StatCard } from "@/components/common/StatCard";
import { Loading, EmptyState } from "@/components/common/States";
import StudentDetailModal from "@/components/common/StudentDetailModal";

export function StudentTable({ students, onSelect }) {
  if (!students || students.length === 0)
    return <EmptyState icon={GraduationCap} title="No students yet" description="Students in your batches will appear here." />;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="trainer-student-table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Lessons</th><th className="px-4 py-3">Quiz Score</th>
              <th className="px-4 py-3">Projects</th><th className="px-4 py-3">Last Active</th><th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((s) => (
              <tr key={s.student_id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{s.name.charAt(0)}</span>
                    {s.name} {s.needs_attention && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" title="Needs attention" />}
                  </div>
                </td>
                <td className="px-4 py-3">{s.lessons_completed}</td>
                <td className="px-4 py-3"><span className={`font-semibold ${s.avg_quiz_score >= 60 ? "text-emerald-600" : s.avg_quiz_score > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{s.avg_quiz_score}%</span></td>
                <td className="px-4 py-3">{s.projects}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.last_active ? new Date(s.last_active).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onSelect(s)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" data-testid={`view-student-${s.student_id}`}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TrainerDashboard() {
  const { data, loading } = useFetch("/analytics/trainer");
  const [selected, setSelected] = useState(null);
  if (loading || !data) return <Loading />;

  return (
    <Page title="Trainer Overview" subtitle="Monitor your batches and student progress.">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon={Users} label="Total Students" value={data.total_students} accent="primary" />
        <StatCard icon={TrendingUp} label="Active" value={data.active_students} accent="teal" />
        <StatCard icon={CheckCircle2} label="Lessons Done" value={data.lessons_completed} accent="emerald" />
        <StatCard icon={TrendingUp} label="Avg Quiz" value={`${data.avg_quiz_score}%`} accent="violet" />
        <StatCard icon={FolderKanban} label="Projects" value={data.projects_completed} accent="amber" />
        <StatCard icon={AlertTriangle} label="Need Attention" value={data.needs_attention} accent="rose" />
      </div>
      <h2 className="mb-3 font-heading text-lg font-semibold">Students</h2>
      <StudentTable students={data.students} onSelect={setSelected} />
      {selected && <StudentDetailModal studentId={selected.student_id} name={selected.name} onClose={() => setSelected(null)} />}
    </Page>
  );
}
