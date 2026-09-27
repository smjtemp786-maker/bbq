import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading } from "@/components/common/States";

const COLORS = ["#2563EB", "#0D9488", "#F59E0B", "#9333EA", "#10B981", "#F43F5E", "#06B6D4"];

export default function CenterAnalytics() {
  const { data, loading } = useFetch("/analytics/center");
  if (loading || !data) return <Loading />;
  const metrics = [
    { name: "Students", value: data.total_students },
    { name: "Active", value: data.active_students },
    { name: "Batches", value: data.total_batches },
    { name: "Trainers", value: data.total_trainers },
    { name: "Lessons", value: data.lessons_completed },
    { name: "Projects", value: data.projects_created },
  ];

  return (
    <Page title="Center Analytics" subtitle="Performance overview for your center.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-heading font-semibold">Key Metrics</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {metrics.map((m, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-heading font-semibold">Averages</h3>
          <div className="flex h-[280px] flex-col justify-center gap-6">
            <div>
              <div className="flex justify-between text-sm"><span>Average Quiz Score</span><span className="font-bold">{data.avg_quiz_score}%</span></div>
              <div className="mt-2 h-3 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${data.avg_quiz_score}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm"><span>Active Rate</span><span className="font-bold">{data.total_students ? Math.round((data.active_students / data.total_students) * 100) : 0}%</span></div>
              <div className="mt-2 h-3 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-teal-500" style={{ width: `${data.total_students ? (data.active_students / data.total_students) * 100 : 0}%` }} /></div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
