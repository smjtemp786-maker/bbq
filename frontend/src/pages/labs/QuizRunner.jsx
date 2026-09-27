import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw, Loader2 } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/api";
import { Page, ProgressBar } from "@/components/common/Page";
import { Loading } from "@/components/common/States";
import { enqueue } from "@/lib/offline";
import { useAuth } from "@/context/AuthContext";

export default function QuizRunner() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: quiz, loading } = useFetch(`/quizzes/${quizId}`);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(Date.now());

  useEffect(() => { setCurrent(0); setAnswers({}); setResult(null); }, [quizId]);

  if (loading || !quiz) return <Loading />;

  const questions = quiz.questions || [];
  const q = questions[current];
  const answered = Object.keys(answers).length;

  const submit = async () => {
    setSubmitting(true);
    const payload = { quiz_id: quizId, answers, time_taken: Math.round((Date.now() - startedAt) / 1000) };
    try {
      const { data } = await api.post("/quizzes/attempt", payload);
      setResult(data);
    } catch (e) {
      // offline: queue attempt (score locally unknown, mark pending)
      enqueue("quiz_attempt", "upsert", { ...payload, student_id: user.id });
      setResult({ offline: true, score: 0, total: questions.length, review: [] });
    }
    setSubmitting(false);
  };

  if (result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <Page title="Quiz Result">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${pct >= 60 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
              <Trophy className="h-8 w-8" />
            </div>
            {result.offline ? (
              <p className="mt-4 text-sm text-amber-600">You're offline — your attempt was saved locally and will be scored when you reconnect.</p>
            ) : (
              <>
                <h2 className="mt-4 font-heading text-3xl font-extrabold">{pct}%</h2>
                <p className="mt-1 text-muted-foreground">You scored {result.score} of {result.total} correct</p>
              </>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => { setResult(null); setCurrent(0); setAnswers({}); }} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted" data-testid="quiz-retry-button">
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button onClick={() => navigate(-1)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Back to course</button>
            </div>
          </div>

          {result.review && result.review.length > 0 && (
            <div className="mt-6 space-y-3">
              {result.review.map((r, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start gap-2">
                    {r.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 text-destructive" />}
                    <div>
                      <p className="text-sm font-medium">{r.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Your answer: <span className={r.correct ? "text-emerald-600" : "text-destructive"}>{String(r.given ?? "—")}</span>{!r.correct && <> · Correct: <span className="text-emerald-600">{r.answer}</span></>}</p>
                      {r.explanation && <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Page>
    );
  }

  return (
    <Page title={quiz.title}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{answered} answered</span>
        </div>
        <ProgressBar value={(answered / questions.length) * 100} className="mb-6" />

        <div className="rounded-2xl border border-border bg-card p-6" data-testid="quiz-question-card">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">{q.type.replace("_", " ")}</span>
          <h3 className="mt-4 font-heading text-lg font-semibold">{q.text}</h3>
          <div className="mt-5 space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                data-testid="quiz-option-item"
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${answers[q.id] === opt ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted"}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${answers[q.id] === opt ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {answers[q.id] === opt && <CheckCircle2 className="h-3.5 w-3.5" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium disabled:opacity-40">Previous</button>
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent((c) => c + 1)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="quiz-next-button">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting || answered < questions.length} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50" data-testid="quiz-submit-button">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Submit Quiz
            </button>
          )}
        </div>
      </div>
    </Page>
  );
}
