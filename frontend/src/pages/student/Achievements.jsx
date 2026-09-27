import React from "react";
import { Trophy, Award, Star, Sparkles, Download, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";

const ICONS = { sparkles: Sparkles, award: Award, star: Star, "first-steps": Sparkles };

const ALL_BADGES = [
  { key: "first-steps", title: "First Steps", desc: "Complete your first lesson", icon: Sparkles },
  { key: "quiz-ace", title: "Quiz Ace", desc: "Pass a quiz with 60%+", icon: Star },
  { key: "builder", title: "Builder", desc: "Save your first project", icon: Award },
  { key: "course-master", title: "Course Master", desc: "Finish an entire course", icon: Trophy },
];

function downloadCertificate(cert, name) {
  const canvas = document.createElement("canvas");
  canvas.width = 1000; canvas.height = 700;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, 1000, 700);
  ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 8; ctx.strokeRect(30, 30, 940, 640);
  ctx.fillStyle = "#2563eb"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
  ctx.fillText("BRAIN BONDS", 500, 140);
  ctx.fillStyle = "#e2e8f0"; ctx.font = "26px Arial";
  ctx.fillText("Certificate of Completion", 500, 210);
  ctx.fillStyle = "#94a3b8"; ctx.font = "20px Arial";
  ctx.fillText("This certifies that", 500, 300);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 44px Arial";
  ctx.fillText(name, 500, 370);
  ctx.fillStyle = "#94a3b8"; ctx.font = "20px Arial";
  ctx.fillText("has successfully completed", 500, 430);
  ctx.fillStyle = "#38bdf8"; ctx.font = "bold 30px Arial";
  ctx.fillText(cert.title.replace(" Certificate", ""), 500, 480);
  ctx.fillStyle = "#64748b"; ctx.font = "18px Arial";
  ctx.fillText(new Date(cert.issued_at).toLocaleDateString(), 500, 600);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${cert.title.replace(/\s+/g, "_")}.png`;
  a.click();
}

export default function Achievements() {
  const { user } = useAuth();
  const { data, loading } = useFetch("/achievements");
  if (loading || !data) return <Loading />;

  const earned = new Set(data.achievements.map((a) => (a.key.startsWith("course-") ? "course-master" : a.key)));

  return (
    <Page title="Achievements" subtitle="Badges you've unlocked and certificates you've earned.">
      <h2 className="mb-3 font-heading text-lg font-semibold">Badges</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ALL_BADGES.map((b) => {
          const unlocked = earned.has(b.key);
          return (
            <div key={b.key} data-testid={`badge-${b.key}`}
              className={`relative flex flex-col items-center rounded-2xl border p-5 text-center transition-transform ${unlocked ? "border-primary/30 bg-primary/5 hover:-translate-y-1" : "border-dashed border-border bg-card opacity-60"}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {unlocked ? <b.icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
              </div>
              <p className="mt-3 font-heading text-sm font-semibold">{b.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{b.desc}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 font-heading text-lg font-semibold">Certificates</h2>
      {data.certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" description="Complete an entire course to earn your first certificate." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.certificates.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`certificate-${c.id}`}>
              <Award className="h-8 w-8 text-amber-500" />
              <h3 className="mt-3 font-heading font-semibold">{c.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Issued {new Date(c.issued_at).toLocaleDateString()}</p>
              <button onClick={() => downloadCertificate(c, user.name)} className="mt-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted" data-testid={`download-cert-${c.id}`}>
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
