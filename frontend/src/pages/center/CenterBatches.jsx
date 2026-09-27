import React, { useState } from "react";
import { Plus, Boxes, Users, UserPlus } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { Modal, Field, inputCls } from "@/components/common/Modal";
import { toast } from "sonner";

export default function CenterBatches() {
  const { data: batches, loading, reload } = useFetch("/batches");
  const { data: trainers } = useFetch("/users?role=trainer");
  const { data: students } = useFetch("/users?role=student");
  const { data: courses } = useFetch("/courses");
  const [open, setOpen] = useState(false);
  const [enrollFor, setEnrollFor] = useState(null);
  const [form, setForm] = useState({ name: "", trainer_id: "", schedule: "", start_date: "", end_date: "", course_ids: [] });
  const [checked, setChecked] = useState([]);

  const create = async () => {
    if (!form.name) return toast.error("Batch name required");
    await api.post("/batches", form);
    toast.success("Batch created");
    setOpen(false); setForm({ name: "", trainer_id: "", schedule: "", start_date: "", end_date: "", course_ids: [] });
    reload();
  };

  const enroll = async () => {
    await api.post(`/batches/${enrollFor.id}/enroll`, { student_ids: checked });
    toast.success("Students enrolled");
    setEnrollFor(null); setChecked([]); reload();
  };

  if (loading) return <Loading />;

  return (
    <Page title="Batches" subtitle="Create and manage learning batches."
      actions={<button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="create-batch-button"><Plus className="h-4 w-4" /> New Batch</button>}>
      {!batches || batches.length === 0 ? (
        <EmptyState icon={Boxes} title="No batches yet" description="Create your first batch to group students and assign a trainer." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`batch-${b.id}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Boxes className="h-5 w-5" /></div>
              <h3 className="mt-3 font-heading font-semibold">{b.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Trainer: {b.trainer_name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="h-4 w-4" /> {b.student_count} students · {b.schedule}</p>
              <button onClick={() => { setEnrollFor(b); setChecked(b.student_ids || []); }} className="mt-4 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted" data-testid={`enroll-${b.id}`}>
                <UserPlus className="h-3.5 w-3.5" /> Enroll students
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Batch">
        <div className="space-y-4">
          <Field label="Batch name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="batch-name-input" placeholder="Brain Bonds Batch B" /></Field>
          <Field label="Trainer">
            <select className={inputCls} value={form.trainer_id} onChange={(e) => setForm({ ...form, trainer_id: e.target.value })} data-testid="batch-trainer-select">
              <option value="">Unassigned</option>
              {(trainers || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Courses">
            <div className="flex flex-wrap gap-2">
              {(courses || []).map((c) => {
                const on = form.course_ids.includes(c.id);
                return <button key={c.id} onClick={() => setForm({ ...form, course_ids: on ? form.course_ids.filter((x) => x !== c.id) : [...form.course_ids, c.id] })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-primary text-primary-foreground" : "border border-border"}`}>{c.title}</button>;
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="End date"><input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          <Field label="Schedule"><input className={inputCls} value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Mon/Wed/Fri 4-6 PM" /></Field>
          <button onClick={create} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="submit-batch">Create Batch</button>
        </div>
      </Modal>

      <Modal open={!!enrollFor} onClose={() => setEnrollFor(null)} title={`Enroll into ${enrollFor?.name || ""}`}>
        <div className="max-h-80 space-y-2 overflow-auto">
          {(students || []).map((s) => (
            <label key={s.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <input type="checkbox" checked={checked.includes(s.id)} onChange={(e) => setChecked(e.target.checked ? [...checked, s.id] : checked.filter((x) => x !== s.id))} />
              {s.name} <span className="text-xs text-muted-foreground">{s.email}</span>
            </label>
          ))}
        </div>
        <button onClick={enroll} className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="submit-enroll">Save Enrollment</button>
      </Modal>
    </Page>
  );
}
