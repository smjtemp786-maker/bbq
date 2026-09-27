import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Loader2, Eye, EyeOff, KeyRound, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const DEMO = [
  { role: "Super Admin", email: "smjaveedahamed786@gmail.com", password: "BrainBonds@2026", color: "bg-violet-500" },
  { role: "Center Admin", email: "center@brainbonds.com", password: "Center@123", color: "bg-blue-500" },
  { role: "Trainer", email: "trainer@brainbonds.com", password: "Trainer@123", color: "bg-teal-500" },
  { role: "Student", email: "aarav@brainbonds.com", password: "Student@123", color: "bg-amber-500" },
];

const HOME = { super_admin: "/admin", center_admin: "/center", trainer: "/trainer", student: "/student" };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showActivate, setShowActivate] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [activation, setActivation] = useState(null);

  const submit = async (e, creds) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    const c = creds || { email, password };
    const res = await login(c.email, c.password);
    setLoading(false);
    if (res.ok) {
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(HOME[res.user.role] || "/");
    } else {
      setError(res.error);
    }
  };

  const activate = async () => {
    try {
      const { data } = await api.post("/licenses/activate", { key: licenseKey });
      setActivation(data);
      if (data.valid) toast.success(`Center activated: ${data.license.center?.name}`);
      else toast.error("License is not active");
    } catch (e) {
      toast.error("Invalid license key");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="bb-grid-bg absolute inset-0 opacity-20" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <span className="font-heading text-2xl font-extrabold tracking-tight">Brain Bonds</span>
        </div>
        <div className="relative">
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            Learning that works,<br />even offline.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/80">
            An offline-first tuition platform where students learn coding, game development, robotics and AI through
            interactive labs — no internet required for class.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Coding Lab", "Game Lab", "Robotics Lab", "AI Lab"].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">{t}</span>
            ))}
          </div>
        </div>
        <div className="relative text-sm text-white/60">Offline-first · Local-first · Sync when connected</div>
      </div>

      {/* Right form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <span className="font-heading text-xl font-extrabold">Brain Bonds</span>
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Sign in to your center</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials or pick a demo role below.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@brainbonds.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <input
                  type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-medium text-destructive" data-testid="login-error">{error}</p>}
            <button
              type="submit" disabled={loading}
              data-testid="login-submit-button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick demo login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.role}
                  onClick={() => submit(null, d)}
                  data-testid={`demo-login-${d.role.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${d.color}`} />
                  <span className="font-medium">{d.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <button onClick={() => setShowActivate((v) => !v)} className="flex items-center gap-2 text-sm font-medium text-primary" data-testid="toggle-activation">
              <KeyRound className="h-4 w-4" /> Activate a center license
            </button>
            {showActivate && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)}
                    data-testid="license-key-input"
                    placeholder="BB-XXXXXX"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button onClick={activate} data-testid="activate-license-button" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                    Verify
                  </button>
                </div>
                {activation && (
                  <p className={`text-xs ${activation.valid ? "text-emerald-600" : "text-destructive"}`}>
                    {activation.valid
                      ? `Valid license for ${activation.license.center?.name} (plan: ${activation.license.plan}, max ${activation.license.max_students} students). Cached locally for offline use.`
                      : "License inactive or invalid."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
