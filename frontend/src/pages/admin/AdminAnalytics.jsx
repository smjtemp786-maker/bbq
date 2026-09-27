import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { StatCard } from "@/components/common/StatCard";
import { Loading } from "@/components/common/States";
import { Building2, GraduationCap, Users, FolderKanban } from "lucide-react";

const COLORS = ["#2563EB", "#0D9488", "#F59E0B", "#9333EA", "#10B981", "#F43F5E"];

export default function AdminAnalytics() {
  const { data, loading } = useFetch("/analytics/global");
  if (loading || !data) return <Loading />;
  const centerData = data.center_stats.map((c) => ({ name: c.name.replace("Brain Bonds ", ""), students: c.students, trainers: c.trainers }));

  return (
    <Page title="Global Analytics" subtitle="Deep-dive into network performance.">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Centers" value={data.total_centers} accent="primary" />
        <StatCard icon={GraduationCap} label="Students" value={data.total_students} accent="teal" />
        <StatCard icon={Users} label="Trainers" value={data.total_trainers} accent="violet" />
        <StatCard icon={FolderKanban} label="Projects" value={data.projects_created} accent="amber" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-heading font-semibold">Centers: Students vs Trainers</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={centerData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            <Bar dataKey="students" radius={[8, 8, 0, 0]} fill="#2563EB" />
            <Bar dataKey="trainers" radius={[8, 8, 0, 0]} fill="#0D9488" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Page>
  );
}
