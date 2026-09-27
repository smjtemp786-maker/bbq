import React, { useState } from "react";
import { Plus, BookOpen, Layers, Clock } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { Modal, Field, inputCls } from "@/components/common/Modal";
import { toast } from "sonner";

export default function AdminCourses() {
  const { data: courses, loading, reload } = useFetch("/courses");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "coding", difficulty: "beginner", age_group: "8-14", duration: "6 weeks", thumbnail: "" });

  const create = async () => {
    if (!form.title) return toast.error("Title required");
    const thumb = form.thumbnail || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80";
    await api.post("/courses", { ...form, thumbnail: thumb });
    toast.success("Course created");
    setOpen(false); reload();
  };

  if (loading) return <Loading />;

  return (
    <Page title="Courses & Curriculum" subtitle="Manage the global course catalogue."
      actions={<button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="add-course-button"><Plus className="h-4 w-4" /> New Course</button>}>
      {!courses || courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="admin-courses-grid">
          {courses.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={c.thumbnail} alt={c.title} className="h-32 w-full object-cover" />
              <div className="p-5">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">{c.category}</span>
                <h3 className="mt-2 font-heading font-semibold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c.module_count} modules</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.lesson_count} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Course">
        <div className="space-y-4">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="course-title-input" /></Field>
          <Field label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="coding">Coding</option><option value="game">Game</option><option value="robotics">Robotics</option><option value="ai">AI</option>
              </select>
            </Field>
            <Field label="Difficulty">
              <select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age group"><input className={inputCls} value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} /></Field>
            <Field label="Duration"><input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
          </div>
          <Field label="Thumbnail URL (optional)"><input className={inputCls} value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} /></Field>
          <button onClick={create} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="submit-course">Create Course</button>
        </div>
      </Modal>
    </Page>
  );
}
