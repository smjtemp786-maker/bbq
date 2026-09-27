import React, { useRef, useState, useEffect, useMemo } from "react";
import { Play, Square, RotateCcw, Save, Code2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import BlocklyEditor from "@/components/labs/BlocklyEditor";
import { runGeneratedCode, saveProjectOfflineFirst, sleep } from "@/lib/labRuntime";
import api from "@/lib/api";
import { toast } from "sonner";

const TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    { kind: "category", name: "Events", colour: "#F59E0B", contents: [{ kind: "block", type: "bb_when_start" }] },
    { kind: "category", name: "Motion", colour: "#2563EB", contents: [
      { kind: "block", type: "bb_move_forward" }, { kind: "block", type: "bb_turn_left" },
      { kind: "block", type: "bb_turn_right" },
      { kind: "block", type: "bb_move_steps", inputs: { STEPS: { shadow: { type: "math_number", fields: { NUM: 3 } } } } },
      { kind: "block", type: "bb_pen" },
    ] },
    { kind: "category", name: "Looks", colour: "#9333EA", contents: [
      { kind: "block", type: "bb_say", inputs: { MSG: { shadow: { type: "text", fields: { TEXT: "Hello!" } } } } },
    ] },
    { kind: "category", name: "Sound", colour: "#9333EA", contents: [{ kind: "block", type: "bb_play_sound" }] },
    { kind: "category", name: "Control", colour: "#0D9488", contents: [
      { kind: "block", type: "bb_repeat", inputs: { COUNT: { shadow: { type: "math_number", fields: { NUM: 4 } } } } },
      { kind: "block", type: "bb_forever" },
      { kind: "block", type: "bb_wait", inputs: { SECS: { shadow: { type: "math_number", fields: { NUM: 1 } } } } },
      { kind: "block", type: "controls_if" },
    ] },
    { kind: "category", name: "Logic", colour: "#F59E0B", contents: [
      { kind: "block", type: "logic_compare" }, { kind: "block", type: "logic_operation" }, { kind: "block", type: "logic_boolean" },
    ] },
    { kind: "category", name: "Math", colour: "#10B981", contents: [
      { kind: "block", type: "math_number", fields: { NUM: 0 } }, { kind: "block", type: "math_arithmetic" },
    ] },
    { kind: "category", name: "Variables", colour: "#EF4444", custom: "VARIABLE" },
    { kind: "category", name: "Score", colour: "#EF4444", contents: [
      { kind: "block", type: "bb_change_score", inputs: { N: { shadow: { type: "math_number", fields: { NUM: 1 } } } } },
    ] },
  ],
};

const STARTER = `<xml xmlns="https://developers.google.com/blockly/xml">
<block type="bb_when_start" x="30" y="30"><next>
<block type="bb_pen"><field name="STATE">down</field><next>
<block type="bb_repeat"><value name="COUNT"><shadow type="math_number"><field name="NUM">4</field></shadow></value><statement name="DO">
<block type="bb_move_steps"><value name="STEPS"><shadow type="math_number"><field name="NUM">4</field></shadow></value><next>
<block type="bb_turn_right"></block></next></block></statement></block></next></block></next></block></xml>`;

export default function CodingLab() {
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const stoppedRef = useRef(false);
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState("// Generated code appears here");
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState(0);
  const [projectName, setProjectName] = useState("My Coding Project");
  const [projectId, setProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toolbox = useMemo(() => TOOLBOX, []);

  const turtle = useRef({ x: 200, y: 160, angle: 0, pen: true });

  const resetStage = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, cv.width, cv.height);
    turtle.current = { x: cv.width / 2, y: cv.height / 2, angle: 0, pen: true };
    drawTurtle();
    setScore(0);
    setLogs([]);
  };

  const drawTurtle = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const { x, y, angle } = turtle.current;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    // load a project if opened from Projects page
    const openId = localStorage.getItem("bb_open_project");
    if (openId) {
      localStorage.removeItem("bb_open_project");
      api.get(`/projects/${openId}`).then(({ data }) => {
        if (data.type !== "coding") return;
        setProjectId(data.id);
        setProjectName(data.name);
        if (data.data?.xml && editorRef.current) editorRef.current.loadXml(data.data.xml);
      }).catch(() => {});
    }
    setTimeout(resetStage, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const log = (msg) => setLogs((l) => [...l.slice(-30), msg]);

  const helpers = {
    move: async (steps) => {
      const cv = canvasRef.current;
      const ctx = cv.getContext("2d");
      const dist = steps * 20;
      const rad = (turtle.current.angle * Math.PI) / 180;
      const nx = turtle.current.x + Math.cos(rad) * dist;
      const ny = turtle.current.y + Math.sin(rad) * dist;
      if (turtle.current.pen) {
        ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(turtle.current.x, turtle.current.y); ctx.lineTo(nx, ny); ctx.stroke();
      }
      turtle.current.x = nx; turtle.current.y = ny;
      redraw(); await sleep(120);
    },
    turnLeft: async () => { turtle.current.angle -= 90; redraw(); await sleep(80); },
    turnRight: async () => { turtle.current.angle += 90; redraw(); await sleep(80); },
    wait: async (s) => { await sleep(s * 1000); },
    say: async (msg) => { log("💬 " + msg); await sleep(200); },
    playSound: async () => { log("♪ beep"); try { beep(); } catch (e) {} await sleep(150); },
    changeScore: (n) => setScore((s) => s + Number(n)),
    pen: (state) => { turtle.current.pen = state === "down"; },
    tick: async () => { await sleep(30); },
    isStopped: () => stoppedRef.current,
  };

  const redraw = () => {
    // redraw only turtle marker over existing trail by repainting a fresh turtle
    drawTurtle();
  };

  const beep = () => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.frequency.value = 600; o.start();
    g.gain.setValueAtTime(0.1, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
    o.stop(ac.currentTime + 0.2);
  };

  const run = async () => {
    if (running) return;
    resetStage();
    const generated = editorRef.current.getCode();
    setCode(generated || "// (add a 'when start' block)");
    if (!generated.trim()) { toast.error("Add some blocks first!"); return; }
    stoppedRef.current = false;
    setRunning(true);
    try {
      await runGeneratedCode(generated, helpers);
    } catch (e) {
      log("⚠ " + e.message);
    }
    setRunning(false);
  };

  const stop = () => { stoppedRef.current = true; setRunning(false); };

  const save = async () => {
    setSaving(true);
    const xml = editorRef.current.getXml();
    const id = await saveProjectOfflineFirst({
      id: projectId, name: projectName, type: "coding",
      data: { xml, code: editorRef.current.getCode() }, ownerId: user.id, isOnline,
    });
    setProjectId(id);
    setSaving(false);
    toast.success(isOnline ? "Project saved & synced" : "Saved locally (will sync when online)");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} data-testid="coding-project-name"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-600" data-testid="coding-score">Score: {score}</span>
          <button onClick={run} disabled={running} data-testid="blockly-run-button" className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
          </button>
          <button onClick={stop} data-testid="blockly-stop-button" className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"><Square className="h-4 w-4" /> Stop</button>
          <button onClick={resetStage} data-testid="blockly-reset-button" className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" /> Reset</button>
          <button onClick={save} disabled={saving} data-testid="blockly-save-button" className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
        <div className="relative col-span-1 border-r border-border lg:col-span-3">
          <BlocklyEditor ref={editorRef} toolbox={toolbox} initialXml={STARTER} />
        </div>
        <div className="col-span-1 flex min-h-0 flex-col lg:col-span-2">
          <div className="border-b border-border bg-slate-950 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Stage</p>
            <canvas ref={canvasRef} width={400} height={300} className="w-full rounded-lg" data-testid="coding-stage" />
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-slate-900 p-3 font-mono text-xs text-slate-300">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Output</p>
            {logs.length === 0 ? <p className="text-slate-600">Press Run to see output…</p> : logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
          <details className="border-t border-border bg-slate-950 p-3 text-xs">
            <summary className="cursor-pointer text-slate-400">Generated JavaScript</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-emerald-300" data-testid="coding-generated-code">{code}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
