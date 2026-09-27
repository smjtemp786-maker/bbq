import React, { useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import api from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";
import { Modal, Field, inputCls } from "@/components/common/Modal";
import { toast } from "sonner";

export default function AdminLicenses() {
  const { data: licenses, loading, reload } = useFetch("/licenses");
  const { data: centers } = useFetch("/centers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ center_id: "", plan: "standard", max_students: 50, valid_months: 12 });

  const create = async () => {
    if (!form.center_id) return toast.error("Select a center");
    await api.post("/licenses", form);
    toast.success("License issued");
    setOpen(false); reload();
  };

  if (loading) return <Loading />;

  return (
    <Page title="Licenses" subtitle="Manage center licenses and quotas."
      actions={<button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="add-license-button"><Plus className="h-4 w-4" /> Issue License</button>}>
      {!licenses || licenses.length === 0 ? (
        <EmptyState icon={KeyRound} title="No licenses issued" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="super-admin-licenses-table">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Key</th><th className="px-4 py-3">Center</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Max Students</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {licenses.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{l.key}</td>
                  <td className="px-4 py-3 font-medium">{l.center_name}</td>
                  <td className="px-4 py-3 capitalize">{l.plan}</td>
                  <td className="px-4 py-3">{l.max_students}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(l.expiry_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold capitalize text-emerald-600">{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Issue License">
        <div className="space-y-4">
          <Field label="Center">
            <select className={inputCls} value={form.center_id} onChange={(e) => setForm({ ...form, center_id: e.target.value })} data-testid="license-center-select">
              <option value="">Select center</option>
              {(centers || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Plan">
            <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max students"><input type="number" className={inputCls} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })} /></Field>
            <Field label="Valid months"><input type="number" className={inputCls} value={form.valid_months} onChange={(e) => setForm({ ...form, valid_months: Number(e.target.value) })} /></Field>
          </div>
          <button onClick={create} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="submit-license">Issue License</button>
        </div>
      </Modal>
    </Page>
  );
}
