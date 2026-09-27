import React, { useState } from "react";
import { Plus, UserPlus, Mail } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { Modal, Field, inputCls } from "@/components/common/Modal";
import { toast } from "sonner";

// Reusable create + list manager for students / trainers.
export default function UserManager({ role, title, subtitle, centerScoped }) {
  const { data: users, loading, reload } = useFetch(`/users?role=${role}`);
  const { data: centers } = useFetch(centerScoped ? null : "/centers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role, center_id: "" });

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("All fields required");
    try {
      await api.post("/users", form);
      toast.success(`${title.slice(0, -1)} added`);
      setOpen(false); setForm({ name: "", email: "", password: "", role, center_id: "" });
      reload();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create");
    }
  };

  if (loading) return <Loading />;

  return (
    <Page title={title} subtitle={subtitle}
      actions={<button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid={`add-${role}-button`}><Plus className="h-4 w-4" /> Add {title.slice(0, -1)}</button>}>
      {!users || users.length === 0 ? (
        <EmptyState icon={UserPlus} title={`No ${title.toLowerCase()} yet`} description={`Add your first ${title.slice(0, -1).toLowerCase()} to get started.`} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid={`${role}-table`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{u.name.charAt(0)}</span>{u.name}</div></td>
                  <td className="px-4 py-3 text-muted-foreground"><span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {u.email}</span></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold capitalize text-emerald-600">{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${title.slice(0, -1)}`}>
        <div className="space-y-4">
          <Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name-input" /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-email-input" /></Field>
          <Field label="Temporary password"><input className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" placeholder="Min 6 chars" /></Field>
          {!centerScoped && (
            <Field label="Center">
              <select className={inputCls} value={form.center_id} onChange={(e) => setForm({ ...form, center_id: e.target.value })} data-testid="user-center-select">
                <option value="">Select center</option>
                {(centers || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <button onClick={create} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="submit-user">Create</button>
        </div>
      </Modal>
    </Page>
  );
}
