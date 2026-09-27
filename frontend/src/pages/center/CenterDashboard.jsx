import React from "react";
import { Users, GraduationCap, Boxes, TrendingUp, FolderKanban, CheckCircle2 } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { StatCard } from "@/components/common/StatCard";
import { Loading } from "@/components/common/States";
import { useAuth } from "@/context/AuthContext";

export default function CenterDashboard() {
  const { user } = useAuth();
  const { data, loading } = useFetch("/analytics/center");
  const { data: center } = useFetch(user.center_id ? `/centers/${user.center_id}` : null);
  if (loading || !data) return <Loading />;

  return (
    <Page title="Center Overview" subtitle={center?.name || "Your tuition center at a glance."}>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Students" value={data.total_students} accent="primary" />
        <StatCard icon={TrendingUp} label="Active" value={data.active_students} accent="teal" />
        <StatCard icon={Boxes} label="Batches" value={data.total_batches} accent="violet" />
        <StatCard icon={Users} label="Trainers" value={data.total_trainers} accent="amber" />
        <StatCard icon={CheckCircle2} label="Lessons Completed" value={data.lessons_completed} accent="emerald" />
        <StatCard icon={TrendingUp} label="Avg Quiz Score" value={`${data.avg_quiz_score}%`} accent="primary" />
        <StatCard icon={FolderKanban} label="Projects Created" value={data.projects_created} accent="rose" />
      </div>
      {center?.license && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">License</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Plan</p><p className="mt-1 font-semibold capitalize">{center.license.plan}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Max Students</p><p className="mt-1 font-semibold">{center.license.max_students}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p><p className="mt-1 font-semibold capitalize text-emerald-600">{center.license.status}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Expires</p><p className="mt-1 font-semibold">{new Date(center.license.expiry_date).toLocaleDateString()}</p></div>
          </div>
        </div>
      )}
    </Page>
  );
}
