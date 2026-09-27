import React from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Gamepad2, Bot, Sparkles, FolderKanban, Trophy, BookOpen, PlayCircle, Flame, Target, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useFetch from "@/hooks/useFetch";
import { Page, ProgressRing, ProgressBar } from "@/components/common/Page";
import { StatCard } from "@/components/common/StatCard";
import { Loading } from "@/components/common/States";

const LABS = [
  { key: "blockly", title: "Coding Lab", desc: "Learn programming through visual blocks.", icon: Code2, to: "/student/coding-lab", accent: "from-blue-500 to-indigo-600" },
  { key: "game", title: "Game Lab", desc: "Build games using block-based programming.", icon: Gamepad2, to: "/student/game-lab", accent: "from-fuchsia-500 to-purple-600" },
  { key: "robotics", title: "Robotics Lab", desc: "Program virtual robots and test sensors.", icon: Bot, to: "/student/robotics-lab", accent: "from-cyan-500 to-teal-600" },
  { key: "ai", title: "AI Lab", desc: "Learn basic AI concepts interactively.", icon: Sparkles, to: "/student/ai-lab", accent: "from-amber-500 to-orange-600" },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: progress, loading } = useFetch(`/students/${user.id}/progress`);
  const { data: courses } = useFetch("/courses");

  if (loading || !progress) return <Loading label="Loading your dashboard..." />;

  const continueCourse =
    progress.courses?.find((c) => c.percentage < 100) || progress.courses?.[0] || (courses && courses[0]);
  const continueTarget = continueCourse
    ? { id: continueCourse.course_id || continueCourse.id, title: continueCourse.title, pct: continueCourse.percentage || 0 }
    : null;

  return (
    <Page>
      <div className="bb-fade-up mb-6 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8" data-testid="dashboard-welcome-heading">
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-white/70">Welcome back 👋</p>
            <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Hi, {user.name}! Ready to learn?</h1>
            <p className="mt-2 max-w-md text-white/80">Keep your streak going — you've completed {progress.lessons_completed} lessons so far.</p>
          </div>
          <ProgressRing value={progress.overall_percentage} label="Overall" />
        </div>
      </div>

      {/* Continue learning */}
      {continueTarget && (
        <div
          className="bb-fade-up mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"
          data-testid="student-continue-learning-card"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Continue Learning</p>
              <p className="font-heading text-lg font-semibold">{continueTarget.title}</p>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={continueTarget.pct} className="w-40" />
                <span className="text-xs text-muted-foreground">{continueTarget.pct}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/student/courses/${continueTarget.id}`)}
            data-testid="continue-learning-button"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
          >
            Jump Back In
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Target} label="Overall Progress" value={`${progress.overall_percentage}%`} accent="primary" testId="student-progress-overall" />
        <StatCard icon={CheckCircle2} label="Lessons Done" value={progress.lessons_completed} accent="teal" />
        <StatCard icon={FolderKanban} label="Projects" value={progress.projects_completed} accent="violet" />
        <StatCard icon={Flame} label="Avg Quiz Score" value={`${progress.avg_quiz_score}%`} accent="amber" />
      </div>

      {/* Lab cards */}
      <h2 className="mb-3 font-heading text-lg font-semibold md:text-xl">Interactive Labs</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LABS.map((lab) => (
          <button
            key={lab.key}
            onClick={() => navigate(lab.to)}
            data-testid={`lab-card-${lab.key}`}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${lab.accent} text-white`}>
              <lab.icon className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-base font-semibold">{lab.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{lab.desc}</p>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: "Projects", desc: "View and continue projects.", icon: FolderKanban, to: "/student/projects" },
          { title: "My Courses", desc: "Browse assigned courses.", icon: BookOpen, to: "/student/courses" },
          { title: "Achievements", desc: "Badges and certificates.", icon: Trophy, to: "/student/achievements" },
        ].map((q) => (
          <button key={q.title} onClick={() => navigate(q.to)} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5">
            <q.icon className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{q.title}</p>
              <p className="text-xs text-muted-foreground">{q.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </Page>
  );
}
