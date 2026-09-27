import React from "react";
import useFetch from "@/hooks/useFetch";
import { Modal } from "@/components/common/Modal";
import { ProgressBar } from "@/components/common/Page";
import { Loading } from "@/components/common/States";

export default function StudentDetailModal({ studentId, name, onClose }) {
  const { data: progress, loading } = useFetch(studentId ? `/students/${studentId}/progress` : null);
  const { data: attempts } = useFetch(studentId ? `/quiz-attempts?student_id=${studentId}` : null);

  return (
    <Modal open={!!studentId} onClose={onClose} title={`${name} — Progress`} size="lg">
      {loading || !progress ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Overall", v: `${progress.overall_percentage}%` },
              { l: "Lessons", v: progress.lessons_completed },
              { l: "Avg Quiz", v: `${progress.avg_quiz_score}%` },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
                <p className="mt-1 font-heading text-xl font-bold">{s.v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Course progress</p>
            {progress.courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No course activity yet.</p>
            ) : (
              <div className="space-y-3">
                {progress.courses.map((c) => (
                  <div key={c.course_id}>
                    <div className="flex justify-between text-xs"><span>{c.title}</span><span className="text-muted-foreground">{c.completed_lessons}/{c.total_lessons}</span></div>
                    <ProgressBar value={c.percentage} className="mt-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Recent quiz attempts</p>
            {(!attempts || attempts.length === 0) ? (
              <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
            ) : (
              <div className="space-y-1.5">
                {attempts.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold">{a.percentage}% ({a.score}/{a.total})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
