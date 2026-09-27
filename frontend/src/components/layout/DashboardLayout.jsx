import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BrainCircuit, LayoutDashboard, BookOpen, Code2, Gamepad2, Bot, Sparkles,
  FolderKanban, Trophy, User, Building2, KeyRound, Users, GraduationCap,
  CalendarCheck, BarChart3, Boxes, ClipboardList, LogOut, Menu, X, Moon, Sun,
  Wifi, WifiOff, RefreshCw, CircleHelp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const NAV = {
  student: [
    { to: "/student", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/student/courses", label: "My Courses", icon: BookOpen },
    { to: "/student/coding-lab", label: "Coding Lab", icon: Code2 },
    { to: "/student/game-lab", label: "Game Lab", icon: Gamepad2 },
    { to: "/student/robotics-lab", label: "Robotics Lab", icon: Bot },
    { to: "/student/ai-lab", label: "AI Lab", icon: Sparkles },
    { to: "/student/projects", label: "Projects", icon: FolderKanban },
    { to: "/student/achievements", label: "Achievements", icon: Trophy },
    { to: "/student/profile", label: "Profile", icon: User },
  ],
  trainer: [
    { to: "/trainer", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/trainer/students", label: "Students", icon: GraduationCap },
    { to: "/trainer/batches", label: "My Batches", icon: Boxes },
    { to: "/trainer/projects", label: "Project Reviews", icon: FolderKanban },
    { to: "/trainer/quizzes", label: "Quiz Results", icon: ClipboardList },
  ],
  center_admin: [
    { to: "/center", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/center/batches", label: "Batches", icon: Boxes },
    { to: "/center/students", label: "Students", icon: GraduationCap },
    { to: "/center/trainers", label: "Trainers", icon: Users },
    { to: "/center/courses", label: "Courses", icon: BookOpen },
    { to: "/center/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/center/analytics", label: "Analytics", icon: BarChart3 },
  ],
  super_admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/centers", label: "Centers", icon: Building2 },
    { to: "/admin/licenses", label: "Licenses", icon: KeyRound },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/trainers", label: "Trainers", icon: Users },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  center_admin: "Center Admin",
  trainer: "Trainer",
  student: "Student",
};

export function Logo({ compact }) {
  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <BrainCircuit className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-heading text-lg font-extrabold tracking-tight">Brain Bonds</div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Learn · Build · Play</div>
        </div>
      )}
    </div>
  );
}

function OfflinePill() {
  const { isOnline, pending, sync, syncing, simulatedOffline, setSimulatedOffline } = useOffline();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setSimulatedOffline((v) => !v)}
        data-testid="offline-status-pill"
        title="Toggle offline mode (demo)"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
          isOnline
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            : "border-amber-500/30 bg-amber-500/10 text-amber-600"
        )}
      >
        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        {isOnline ? "Online · Synced" : "Offline Mode"}
        {pending > 0 && (
          <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pending}</span>
        )}
      </button>
      {isOnline && pending > 0 && (
        <button onClick={sync} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="Sync now" data-testid="sync-now-button">
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        </button>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV[user?.role] || [];

  const SideContent = (
    <>
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setMobileOpen(false)}
            data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <it.icon className="h-4.5 w-4.5" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <button
          onClick={() => { logout(); navigate("/login"); }}
          data-testid="logout-button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4.5 w-4.5" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex sticky top-0 h-screen">
        {SideContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card">{SideContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-button">
              <Menu className="h-5 w-5" />
            </button>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary" data-testid="role-badge">
              {ROLE_LABELS[user?.role]}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <OfflinePill />
            <button onClick={toggle} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="theme-toggle-button" title="Toggle theme">
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3" data-testid="user-menu">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
