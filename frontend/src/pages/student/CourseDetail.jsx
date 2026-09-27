import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Clock, ChevronDown, FileText, ClipboardList, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/api";
import { Page, ProgressBar } from "@/components/common/Page";
import { Loading } from "@/components/common/States";
import { enqueue, flushQueue } from "@/lib/offline";
import { useOffline } from "@/context/OfflineContext";
import { toast } from "sonner";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { data: course, loading } = useFetch(`/courses/${courseId}`);
  const { data: progress, reload: reloadProgress } = useFetch(`/students/${user.id}/progress`);
  const [openModule, setOpenModule] = useState(0);
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  if (loading || !course) return <Loading />;

  const completedLessons = new Set(
    (progress?.courses || []).flatMap(() => []) // placeholder
  );
  const courseProg = progress?.courses?.find((c) => c.course_id === courseId);
  const pct = courseProg?.percentage || 0;

  const completeLesson = async (lesson) => {
    setSaving(true);
    const payload = { course_id: courseId, lesson_id: lesson.id, status: "completed", completion_percentage: 100 };
    // offline-first: queue locally, then flush if online
    enqueue("progress", "upsert", { ...payload, student_id: user.id });
    if (isOnline) {
      try {
        await api.post("/progress", payload);
        await flushQueue();
      } catch (e) {}
    }
    await reloadProgress();
    setSaving(false);
    toast.success(`Lesson completed: ${lesson.title}`);
  };

  return (
    <Page title={course.title} subtitle={course.description}
      actions={
        course.quiz && (
          <button
            onClick={() => navigate(`/student/quizzes/${course.quiz.id}`)}
            data-testid="take-quiz-button"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            <ClipboardList className="h-4 w-4" /> Take Quiz
          </button>
        )
      }
    >
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Course Progress</span>
          <span className="text-muted-foreground">{pct}% complete</span>
        </div>
        <ProgressBar value={pct} className="mt-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {course.modules.map((m, i) => (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                onClick={() => setOpenModule(openModule === i ? -1 : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                data-testid={`module-toggle-${i}`}
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Module {i + 1}</p>
                  <p className="font-heading font-semibold">{m.title}</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openModule === i ? "rotate-180" : ""}`} />
              </button>
              {openModule === i && (
                <div className="border-t border-border">
                  {m.lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setActive(l)}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted ${active?.id === l.id ? "bg-primary/5" : ""}`}
                      data-testid={`lesson-item-${l.id}`}
                    >
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{l.title}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {l.estimated_time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5">
            {active ? (
              <>
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Lesson</span>
                </div>
                <h3 className="font-heading text-lg font-semibold">{active.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.content}</p>
                <button
                  onClick={() => completeLesson(active)}
                  disabled={saving}
                  data-testid="complete-lesson-button"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark as Complete
                </button>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Select a lesson to view its content.
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
