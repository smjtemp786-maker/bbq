import React, { useState } from "react";
import { Plus, Building2, MapPin, Users } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { Modal, Field, inputCls } from "@/components/common/Modal";
import { toast } from "sonner";

export default function AdminCenters() {
  const { data: centers, loading, reload } = useFetch("/centers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", address: "", contact_email: "", phone: "" });

  const create = async () => {
    if (!form.name) return toast.error("Name required");
    await api.post("/centers", form);
    toast.success("Center created");
    setOpen(false); setForm({ name: "", city: "", address: "", contact_email: "", phone: "" });
    reload();
  };

  if (loading) return <Loading />;

  return (
    <Page title="Centers" subtitle="All tuition centers in the network."
      actions={<button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="add-center-button"><Plus className="h-4 w-4" /> New Center</button>}>
      {!centers || centers.length === 0 ? (
        <EmptyState icon={Building2} title="No centers yet" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="centers-grid">
          {centers.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
              <h3 className="mt-3 font-heading font-semibold">{c.name}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {c.city || "—"}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /> {c.student_count} students</span>
                <span className="text-muted-foreground">{c.trainer_count} trainers</span>
              </div>
              <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${c.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Center">
        <div className="space-y-4">
          <Field label="Center name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="center-name-input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <Field label="Contact email"><input className={inputCls} value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>
          <Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <button onClick={create} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="submit-center">Create Center</button>
        </div>
      </Modal>
    </Page>
  );
}
