import React, { useState, useEffect } from "react";
import { CalendarCheck, Check, X, Save } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { inputCls } from "@/components/common/Modal";
import { toast } from "sonner";

export default function CenterAttendance() {
  const { data: batches, loading } = useFetch("/batches");
  const { data: students } = useFetch("/users?role=student");
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});

  const batch = (batches || []).find((b) => b.id === batchId);
  const roster = (students || []).filter((s) => batch?.student_ids?.includes(s.id));

  useEffect(() => { setMarks({}); }, [batchId, date]);

  const save = async () => {
    if (!batchId) return toast.error("Select a batch");
    const records = roster.map((s) => ({ student_id: s.id, status: marks[s.id] || "present" }));
    await api.post("/attendance", { batch_id: batchId, date, records });
    toast.success("Attendance saved");
  };

  if (loading) return <Loading />;

  return (
    <Page title="Attendance" subtitle="Mark daily attendance for a batch.">
      <div className="mb-5 flex flex-wrap gap-3">
        <select className={`${inputCls} max-w-xs`} value={batchId} onChange={(e) => setBatchId(e.target.value)} data-testid="attendance-batch-select">
          <option value="">Select batch</option>
          {(batches || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" className={`${inputCls} max-w-xs`} value={date} onChange={(e) => setDate(e.target.value)} data-testid="attendance-date" />
      </div>

      {!batchId ? (
        <EmptyState icon={CalendarCheck} title="Select a batch" description="Choose a batch and date to mark attendance." />
      ) : roster.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No students in this batch" description="Enroll students in the Batches page first." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="attendance-table">
            {roster.map((s) => {
              const st = marks[s.id] || "present";
              return (
                <div key={s.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
                  <span className="flex items-center gap-2 font-medium"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{s.name.charAt(0)}</span>{s.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setMarks({ ...marks, [s.id]: "present" })} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${st === "present" ? "bg-emerald-500 text-white" : "border border-border"}`} data-testid={`present-${s.id}`}><Check className="h-3.5 w-3.5" /> Present</button>
                    <button onClick={() => setMarks({ ...marks, [s.id]: "absent" })} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${st === "absent" ? "bg-rose-500 text-white" : "border border-border"}`} data-testid={`absent-${s.id}`}><X className="h-3.5 w-3.5" /> Absent</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={save} className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="save-attendance"><Save className="h-4 w-4" /> Save Attendance</button>
        </>
      )}
    </Page>
  );
}
