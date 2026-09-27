import React, { useRef, useState, useEffect, useMemo } from "react";
import { Play, Square, RotateCcw, Save, Bot, Loader2, Radar, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import useFetch from "@/hooks/useFetch";
import BlocklyEditor from "@/components/labs/BlocklyEditor";
import { runGeneratedCode, saveProjectOfflineFirst, sleep } from "@/lib/labRuntime";
import { toast } from "sonner";

// Modular 2D grid engine — a future 3D engine can implement the same interface.
const GRID = 10;
const CELL = 40;

const CHALLENGE_MAPS = {
  "reach-destination": { start: [0, 9], dir: 0, goal: [9, 0], obstacles: [] },
  "avoid-obstacles": { start: [0, 9], dir: 0, goal: [9, 0], obstacles: [[3, 6], [3, 5], [3, 4], [6, 3], [6, 2]] },
  "maze-navigation": { start: [0, 0], dir: 1, goal: [9, 9], obstacles: [[1, 0], [1, 1], [1, 2], [3, 2], [3, 3], [3, 4], [5, 0], [5, 1], [5, 2], [7, 2], [7, 3], [7, 4], [2, 6], [3, 6], [4, 6], [6, 7], [7, 7], [8, 7]] },
  "automatic-parking": { start: [0, 5], dir: 0, goal: [8, 5], obstacles: [[9, 4], [9, 6], [7, 4], [7, 6]] },
  "line-following": { start: [0, 0], dir: 1, goal: [0, 9], obstacles: [] },
  "object-detection": { start: [0, 5], dir: 0, goal: [9, 5], obstacles: [[5, 5], [5, 4], [5, 6]] },
  "traffic-signal": { start: [0, 5], dir: 0, goal: [9, 5], obstacles: [] },
};

const TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    { kind: "category", name: "Events", colour: "#F59E0B", contents: [{ kind: "block", type: "bb_when_start" }] },
    { kind: "category", name: "Motion", colour: "#2563EB", contents: [
      { kind: "block", type: "bb_move_forward" }, { kind: "block", type: "bb_turn_left" }, { kind: "block", type: "bb_turn_right" },
    ] },
    { kind: "category", name: "Control", colour: "#0D9488", contents: [
      { kind: "block", type: "bb_forever" },
      { kind: "block", type: "bb_repeat", inputs: { COUNT: { shadow: { type: "math_number", fields: { NUM: 5 } } } } },
      { kind: "block", type: "controls_if" }, { kind: "block", type: "bb_wait", inputs: { SECS: { shadow: { type: "math_number", fields: { NUM: 1 } } } } },
    ] },
    { kind: "category", name: "Sensors", colour: "#06B6D4", contents: [
      { kind: "block", type: "bb_sense_distance" }, { kind: "block", type: "bb_at_goal" },
    ] },
    { kind: "category", name: "Logic", colour: "#F59E0B", contents: [
      { kind: "block", type: "logic_compare" }, { kind: "block", type: "math_number", fields: { NUM: 20 } }, { kind: "block", type: "logic_operation" },
    ] },
    { kind: "category", name: "Actuators", colour: "#10B981", contents: [
      { kind: "block", type: "bb_led" }, { kind: "block", type: "bb_buzzer" },
    ] },
  ],
};

const STARTER = `<xml xmlns="https://developers.google.com/blockly/xml">
<block type="bb_when_start" x="20" y="20"><next>
<block type="bb_forever"><statement name="DO">
<block type="controls_if"><value name="IF0">
<block type="logic_compare"><field name="OP">LT</field>
<value name="A"><block type="bb_sense_distance"></block></value>
<value name="B"><block type="math_number"><field name="NUM">20</field></block></value></block></value>
<statement name="DO0"><block type="bb_turn_right"></block></statement>
<statement name="ELSE"><block type="bb_move_forward"></block></statement>
</block></statement></block></next></block></xml>`;

// dir: 0=up,1=right,2=down,3=left
const DELTAS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export default function RoboticsLab() {
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const stoppedRef = useRef(false);
  const robot = useRef({ x: 0, y: 9, dir: 0 });
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { data: challenges } = useFetch("/labs/robotics-challenges");
  const [challenge, setChallenge] = useState("avoid-obstacles");
  const [running, setRunning] = useState(false);
  const [distance, setDistance] = useState(0);
  const [status, setStatus] = useState("idle");
  const [led, setLed] = useState("off");
  const [projectName, setProjectName] = useState("My Robot Program");
  const [projectId, setProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toolbox = useMemo(() => TOOLBOX, []);
  const map = CHALLENGE_MAPS[challenge];

  const reset = () => {
    stoppedRef.current = true;
    robot.current = { x: map.start[0], y: map.start[1], dir: map.dir };
    setStatus("idle"); setDistance(0); setLed("off");
    draw();
  };

  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [challenge]);
  useEffect(() => { setTimeout(reset, 80); /* eslint-disable-next-line */ }, []);

  const draw = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#1e293b"; ctx.fillRect(0, 0, cv.width, cv.height);
    // grid
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, GRID * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(GRID * CELL, i * CELL); ctx.stroke();
    }
    // obstacles
    ctx.fillStyle = "#ef4444";
    map.obstacles.forEach(([ox, oy]) => { ctx.fillRect(ox * CELL + 4, oy * CELL + 4, CELL - 8, CELL - 8); });
    // goal
    const [gx, gy] = map.goal;
    ctx.fillStyle = "#10b981"; ctx.fillRect(gx * CELL + 6, gy * CELL + 6, CELL - 12, CELL - 12);
    ctx.fillStyle = "#052e16"; ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.fillText("★", gx * CELL + CELL / 2, gy * CELL + CELL / 2 + 7);
    // sensor ray
    const { x, y, dir } = robot.current;
    const [dx, dy] = DELTAS[dir];
    ctx.strokeStyle = "rgba(6,182,212,0.5)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x * CELL + CELL / 2, y * CELL + CELL / 2);
    ctx.lineTo((x + dx * 3) * CELL + CELL / 2, (y + dy * 3) * CELL + CELL / 2); ctx.stroke();
    // robot
    ctx.save();
    ctx.translate(x * CELL + CELL / 2, y * CELL + CELL / 2);
    ctx.rotate((dir * 90 - 90) * Math.PI / 180);
    ctx.fillStyle = led === "on" ? "#22d3ee" : "#06b6d4";
    ctx.fillRect(-CELL / 2 + 6, -CELL / 2 + 6, CELL - 12, CELL - 12);
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.moveTo(CELL / 2 - 8, 0); ctx.lineTo(2, -6); ctx.lineTo(2, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  useEffect(() => { draw(); /* eslint-disable-next-line */ }, [led]);

  const senseDistance = () => {
    const { x, y, dir } = robot.current;
    const [dx, dy] = DELTAS[dir];
    for (let step = 1; step <= GRID; step++) {
      const nx = x + dx * step, ny = y + dy * step;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return step * 10 - 5;
      if (map.obstacles.some(([ox, oy]) => ox === nx && oy === ny)) return step * 10 - 5;
    }
    return 100;
  };

  const helpers = {
    move: async () => {
      const { x, y, dir } = robot.current;
      const [dx, dy] = DELTAS[dir];
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || map.obstacles.some(([ox, oy]) => ox === nx && oy === ny)) {
        setStatus("crashed"); stoppedRef.current = true; toast.error("💥 Robot hit a wall!"); return;
      }
      robot.current = { x: nx, y: ny, dir }; draw();
      if (nx === map.goal[0] && ny === map.goal[1]) { setStatus("success"); stoppedRef.current = true; toast.success("🎉 Goal reached!"); }
      await sleep(220);
    },
    turnLeft: async () => { robot.current.dir = (robot.current.dir + 3) % 4; draw(); await sleep(160); },
    turnRight: async () => { robot.current.dir = (robot.current.dir + 1) % 4; draw(); await sleep(160); },
    wait: async (s) => { await sleep(s * 1000); },
    sense: () => { const d = senseDistance(); setDistance(d); return d; },
    atGoal: () => robot.current.x === map.goal[0] && robot.current.y === map.goal[1],
    led: (state) => setLed(state),
    buzzer: async () => { await sleep(120); },
    tick: async () => { await sleep(20); },
    isStopped: () => stoppedRef.current,
  };

  const run = async () => {
    if (running) return;
    robot.current = { x: map.start[0], y: map.start[1], dir: map.dir };
    setStatus("running"); draw();
    const code = editorRef.current.getCode();
    if (!code.trim()) { toast.error("Add some blocks first!"); return; }
    stoppedRef.current = false; setRunning(true);
    try { await runGeneratedCode(code, helpers); } catch (e) { toast.error(e.message); }
    setRunning(false);
    setStatus((s) => (s === "running" ? "stopped" : s));
  };

  const stop = () => { stoppedRef.current = true; setRunning(false); setStatus("stopped"); };

  const save = async () => {
    setSaving(true);
    const id = await saveProjectOfflineFirst({
      id: projectId, name: projectName, type: "robotics",
      data: { xml: editorRef.current.getXml(), challenge }, ownerId: user.id, isOnline,
    });
    setProjectId(id); setSaving(false);
    toast.success(isOnline ? "Robot program saved & synced" : "Saved locally (will sync later)");
  };

  const statusColor = { idle: "text-slate-400", running: "text-cyan-500", success: "text-emerald-500", crashed: "text-rose-500", stopped: "text-amber-500" };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-teal-500" />
          <select value={challenge} onChange={(e) => setChallenge(e.target.value)} data-testid="robotics-challenge-select"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring">
            {(challenges || []).map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={run} disabled={running} data-testid="robotics-run-button" className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
          </button>
          <button onClick={stop} data-testid="robotics-step-button" className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"><Square className="h-4 w-4" /> Stop</button>
          <button onClick={reset} data-testid="robotics-reset-button" className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" /> Reset</button>
          <button onClick={save} disabled={saving} data-testid="robotics-save-button" className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
        <div className="relative col-span-1 border-r border-border lg:col-span-3">
          <BlocklyEditor ref={editorRef} toolbox={toolbox} initialXml={STARTER} />
        </div>
        <div className="col-span-1 flex min-h-0 flex-col overflow-auto bg-slate-900 p-4 lg:col-span-2">
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} data-testid="robotics-project-name"
            className="mb-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-white outline-none" />
          <div className="mx-auto rounded-xl border border-slate-700 p-2">
            <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} data-testid="robotics-grid" className="rounded-lg" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
              <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400"><Radar className="h-3.5 w-3.5" /> Distance</p>
              <p className="mt-1 font-mono text-2xl font-bold text-cyan-400" data-testid="robotics-distance">{distance} cm</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
              <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400"><Target className="h-3.5 w-3.5" /> Status</p>
              <p className={`mt-1 font-mono text-lg font-bold capitalize ${statusColor[status]}`} data-testid="robotics-status">{status}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className={`h-3 w-3 rounded-full ${led === "on" ? "bg-cyan-400" : "bg-slate-600"}`} /> LED {led}
          </div>
        </div>
      </div>
    </div>
  );
}
