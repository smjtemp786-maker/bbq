import React from "react";
import { Building2, GraduationCap, Users, FolderKanban, Award, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { StatCard } from "@/components/common/StatCard";
import { Loading } from "@/components/common/States";

const COLORS = ["#2563EB", "#0D9488", "#F59E0B", "#9333EA", "#10B981", "#F43F5E"];

export default function AdminDashboard() {
  const { data, loading } = useFetch("/analytics/global");
  if (loading || !data) return <Loading />;
  const centerData = data.center_stats.map((c) => ({ name: c.name.replace("Brain Bonds ", ""), students: c.students }));
  const catData = data.course_stats.map((c) => ({ name: c.title, value: c.enrolled + 1 }));

  return (
    <Page title="Global Overview" subtitle="Network-wide performance across all centers.">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Centers" value={data.total_centers} accent="primary" />
        <StatCard icon={GraduationCap} label="Students" value={data.total_students} accent="teal" />
        <StatCard icon={Activity} label="Active Students" value={data.active_students} accent="emerald" />
        <StatCard icon={Users} label="Trainers" value={data.total_trainers} accent="violet" />
        <StatCard icon={FolderKanban} label="Projects" value={data.projects_created} accent="amber" />
        <StatCard icon={TrendingUp} label="Avg Quiz Score" value={`${data.avg_quiz_score}%`} accent="primary" />
        <StatCard icon={Award} label="Certificates" value={data.certificates_issued} accent="rose" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-heading font-semibold">Students per Center</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={centerData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="students" radius={[8, 8, 0, 0]}>{centerData.map((c, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-heading font-semibold">Course Engagement</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(e) => e.name}>
                {catData.map((c, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Page>
  );
}
