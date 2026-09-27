import React, { useState } from "react";
import { ClipboardList } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import StudentDetailModal from "@/components/common/StudentDetailModal";

export default function TrainerQuizzes() {
  const { data, loading } = useFetch("/analytics/trainer");
  const [selected, setSelected] = useState(null);
  if (loading || !data) return <Loading />;
  const ranked = [...data.students].sort((a, b) => b.avg_quiz_score - a.avg_quiz_score);

  return (
    <Page title="Quiz Results" subtitle="Average quiz performance across your students.">
      {ranked.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No quiz data yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="quiz-results-table">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Avg Score</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranked.map((s, i) => (
                <tr key={s.student_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono">#{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3"><span className={`font-semibold ${s.avg_quiz_score >= 60 ? "text-emerald-600" : "text-amber-600"}`}>{s.avg_quiz_score}%</span></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setSelected(s)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <StudentDetailModal studentId={selected.student_id} name={selected.name} onClose={() => setSelected(null)} />}
    </Page>
  );
}
