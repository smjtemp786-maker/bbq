import React, { useRef, useState, useEffect } from "react";
import { Play, Square, RotateCcw, Save, Gamepad2, Loader2, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import useFetch from "@/hooks/useFetch";
import { saveProjectOfflineFirst } from "@/lib/labRuntime";
import { toast } from "sonner";

const W = 480, H = 360;

// Each template is a self-contained game loop factory (modular).
const GAMES = {
  "catch-object": makeCatch,
  "space-shooter": makeShooter,
  maze: makeMaze,
  "car-racing": makeRacing,
  platform: makePlatform,
};

export default function GameLab() {
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { data: templates } = useFetch("/labs/game-templates");
  const [template, setTemplate] = useState("catch-object");
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [projectName, setProjectName] = useState("My Game");
  const [projectId, setProjectId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const down = (e) => { keysRef.current[e.key] = true; if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault(); };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); cancelAnimationFrame(loopRef.current); };
  }, []);

  useEffect(() => { drawIdle(); stop(); /* eslint-disable-next-line */ }, [template]);
  useEffect(() => { drawIdle(); /* eslint-disable-next-line */ }, []);

  const drawIdle = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#334155"; ctx.font = "16px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
    ctx.fillText("Press Run to play", W / 2, H / 2);
  };

  const start = () => {
    cancelAnimationFrame(loopRef.current);
    setScore(0); setLives(3); setOver(false); setRunning(true);
    const ctx = canvasRef.current.getContext("2d");
    const api = {
      W, H, keys: keysRef.current, speed,
      setScore: (fn) => setScore(fn), setLives: (fn) => setLives(fn),
      gameOver: () => { setOver(true); setRunning(false); cancelAnimationFrame(loopRef.current); },
    };
    gameRef.current = GAMES[template](ctx, api);
    const tick = () => {
      const alive = gameRef.current.update();
      gameRef.current.draw();
      if (alive !== false) loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);
  };

  const stop = () => { cancelAnimationFrame(loopRef.current); setRunning(false); };
  const reset = () => { stop(); setScore(0); setLives(3); setOver(false); drawIdle(); };

  const save = async () => {
    setSaving(true);
    const id = await saveProjectOfflineFirst({
      id: projectId, name: projectName, type: "game",
      data: { template, config: { speed } }, ownerId: user.id, isOnline,
    });
    setProjectId(id); setSaving(false);
    toast.success(isOnline ? "Game saved & synced" : "Saved locally (will sync later)");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-fuchsia-500" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Game Lab</h1>
        </div>
        <input value={projectName} onChange={(e) => setProjectName(e.target.value)} data-testid="game-project-name"
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-sm text-slate-300">
              <span className="font-mono" data-testid="game-score">SCORE: {score}</span>
              <span className="flex items-center gap-1" data-testid="game-lives">
                {Array.from({ length: lives }).map((_, i) => <Heart key={i} className="h-4 w-4 fill-rose-500 text-rose-500" />)}
              </span>
            </div>
            <div className="relative">
              <canvas ref={canvasRef} width={W} height={H} className="w-full" data-testid="game-canvas" />
              {over && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                  <p className="font-heading text-3xl font-extrabold text-white">Game Over</p>
                  <p className="mt-1 text-slate-300">Final score: {score}</p>
                  <button onClick={start} className="mt-4 rounded-xl bg-fuchsia-500 px-5 py-2 text-sm font-semibold text-white">Play Again</button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={start} disabled={running} data-testid="game-run-button" className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Play className="h-4 w-4" /> Run</button>
            <button onClick={stop} data-testid="game-stop-button" className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"><Square className="h-4 w-4" /> Stop</button>
            <button onClick={reset} data-testid="game-reset-button" className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" /> Reset</button>
            <button onClick={save} disabled={saving} data-testid="game-save-button" className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Controls: Arrow keys to move · Spacebar to shoot/jump. Click the game first to focus.</p>
        </div>

        <div>
          <h3 className="mb-2 font-heading font-semibold">Starter Templates</h3>
          <div className="space-y-2">
            {(templates || []).map((t) => (
              <button key={t.key} onClick={() => setTemplate(t.key)} data-testid={`game-template-${t.key}`}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${template === t.key ? "border-fuchsia-500 bg-fuchsia-500/5" : "border-border bg-card hover:bg-muted"}`}>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Game Logic</p>
            <label className="mt-2 block text-sm">Speed: {speed}</label>
            <input type="range" min="1" max="7" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" data-testid="game-speed-slider" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Game factories ---------- */
function makeCatch(ctx, api) {
  let px = api.W / 2, items = [], t = 0, missed = 0;
  return {
    update() {
      if (api.keys["ArrowLeft"]) px -= 6; if (api.keys["ArrowRight"]) px += 6;
      px = Math.max(20, Math.min(api.W - 20, px));
      t++; if (t % Math.max(20, 60 - api.speed * 5) === 0) items.push({ x: Math.random() * (api.W - 20) + 10, y: 0 });
      items.forEach((it) => (it.y += api.speed + 1));
      items = items.filter((it) => {
        if (it.y > api.H - 30 && Math.abs(it.x - px) < 30) { api.setScore((s) => s + 1); return false; }
        if (it.y > api.H) { missed++; api.setLives((l) => { const n = l - 1; if (n <= 0) api.gameOver(); return Math.max(0, n); }); return false; }
        return true;
      });
    },
    draw() {
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, api.W, api.H);
      ctx.fillStyle = "#fbbf24"; items.forEach((it) => { ctx.beginPath(); ctx.arc(it.x, it.y, 10, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#38bdf8"; ctx.fillRect(px - 25, api.H - 20, 50, 12);
    },
  };
}

function makeShooter(ctx, api) {
  let px = api.W / 2, bullets = [], rocks = [], t = 0, cool = 0;
  return {
    update() {
      if (api.keys["ArrowLeft"]) px -= 6; if (api.keys["ArrowRight"]) px += 6;
      px = Math.max(20, Math.min(api.W - 20, px));
      cool--; if (api.keys[" "] && cool <= 0) { bullets.push({ x: px, y: api.H - 30 }); cool = 12; }
      bullets.forEach((b) => (b.y -= 8)); bullets = bullets.filter((b) => b.y > 0);
      t++; if (t % Math.max(18, 50 - api.speed * 4) === 0) rocks.push({ x: Math.random() * (api.W - 30) + 15, y: 0 });
      rocks.forEach((r) => (r.y += api.speed));
      rocks = rocks.filter((r) => {
        for (const b of bullets) if (Math.abs(b.x - r.x) < 18 && Math.abs(b.y - r.y) < 18) { api.setScore((s) => s + 5); b.y = -99; return false; }
        if (r.y > api.H) { api.setLives((l) => { const n = l - 1; if (n <= 0) api.gameOver(); return Math.max(0, n); }); return false; }
        return true;
      });
    },
    draw() {
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, api.W, api.H);
      ctx.fillStyle = "#94a3b8"; rocks.forEach((r) => { ctx.beginPath(); ctx.arc(r.x, r.y, 14, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#f472b6"; bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));
      ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.moveTo(px, api.H - 30); ctx.lineTo(px - 14, api.H - 8); ctx.lineTo(px + 14, api.H - 8); ctx.closePath(); ctx.fill();
    },
  };
}

function makeMaze(ctx, api) {
  const cell = 40, cols = api.W / cell, rows = api.H / cell;
  let rx = 0, ry = 0, moveCd = 0;
  const walls = [[1, 0], [1, 1], [1, 2], [3, 1], [3, 2], [3, 3], [5, 2], [5, 3], [5, 4], [2, 4], [3, 4], [7, 0], [7, 1], [8, 3], [9, 3]].filter(([x, y]) => x < cols && y < rows);
  const goal = [cols - 1, rows - 1];
  return {
    update() {
      moveCd--; if (moveCd > 0) return;
      let nx = rx, ny = ry;
      if (api.keys["ArrowLeft"]) nx--; else if (api.keys["ArrowRight"]) nx++; else if (api.keys["ArrowUp"]) ny--; else if (api.keys["ArrowDown"]) ny++; else return;
      moveCd = 8;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || walls.some(([x, y]) => x === nx && y === ny)) return;
      rx = nx; ry = ny;
      if (rx === goal[0] && ry === goal[1]) { api.setScore((s) => s + 100); api.gameOver(); }
    },
    draw() {
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, api.W, api.H);
      ctx.fillStyle = "#7c3aed"; walls.forEach(([x, y]) => ctx.fillRect(x * cell, y * cell, cell, cell));
      ctx.fillStyle = "#10b981"; ctx.fillRect(goal[0] * cell + 6, goal[1] * cell + 6, cell - 12, cell - 12);
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(rx * cell + 6, ry * cell + 6, cell - 12, cell - 12);
    },
  };
}

function makeRacing(ctx, api) {
  let px = api.W / 2, cars = [], t = 0;
  return {
    update() {
      if (api.keys["ArrowLeft"]) px -= 6; if (api.keys["ArrowRight"]) px += 6;
      px = Math.max(80, Math.min(api.W - 80, px));
      t++; if (t % Math.max(22, 60 - api.speed * 5) === 0) cars.push({ x: 80 + Math.random() * (api.W - 160), y: -40 });
      cars.forEach((c) => (c.y += api.speed + 2));
      cars = cars.filter((c) => {
        if (Math.abs(c.x - px) < 34 && Math.abs(c.y - (api.H - 50)) < 44) { api.setLives((l) => { const n = l - 1; if (n <= 0) api.gameOver(); return Math.max(0, n); }); return false; }
        if (c.y > api.H) { api.setScore((s) => s + 1); return false; }
        return true;
      });
    },
    draw() {
      ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, api.W, api.H);
      ctx.fillStyle = "#1e293b"; ctx.fillRect(70, 0, api.W - 140, api.H);
      ctx.strokeStyle = "#fbbf24"; ctx.setLineDash([20, 20]); ctx.beginPath(); ctx.moveTo(api.W / 2, 0); ctx.lineTo(api.W / 2, api.H); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444"; cars.forEach((c) => ctx.fillRect(c.x - 16, c.y, 32, 44));
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(px - 16, api.H - 50, 32, 44);
    },
  };
}

function makePlatform(ctx, api) {
  let x = 40, y = 200, vy = 0, onGround = false, coins = [{ x: 200, y: 220 }, { x: 320, y: 160 }, { x: 420, y: 220 }];
  const plats = [[0, 300, api.W, 20], [150, 250, 120, 12], [300, 190, 120, 12], [380, 250, 100, 12]];
  return {
    update() {
      if (api.keys["ArrowLeft"]) x -= 4; if (api.keys["ArrowRight"]) x += 4;
      if ((api.keys["ArrowUp"] || api.keys[" "]) && onGround) { vy = -11; onGround = false; }
      vy += 0.6; y += vy; onGround = false;
      plats.forEach(([bx, by, bw, bh]) => { if (x + 12 > bx && x - 12 < bx + bw && y + 16 > by && y + 16 < by + bh + 14 && vy >= 0) { y = by - 16; vy = 0; onGround = true; } });
      x = Math.max(12, Math.min(api.W - 12, x));
      if (y > api.H) { api.setLives((l) => { const n = l - 1; if (n <= 0) api.gameOver(); return Math.max(0, n); }); x = 40; y = 200; vy = 0; }
      coins = coins.filter((c) => { if (Math.abs(c.x - x) < 18 && Math.abs(c.y - y) < 20) { api.setScore((s) => s + 10); return false; } return true; });
    },
    draw() {
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, api.W, api.H);
      ctx.fillStyle = "#334155"; plats.forEach(([bx, by, bw, bh]) => ctx.fillRect(bx, by, bw, bh));
      ctx.fillStyle = "#fbbf24"; coins.forEach((c) => { ctx.beginPath(); ctx.arc(c.x, c.y, 7, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(x - 12, y, 24, 16);
    },
  };
}
