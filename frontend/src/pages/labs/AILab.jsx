import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User, Lightbulb, BookOpen, MessageCircle } from "lucide-react";
import { API } from "@/lib/api";
import { Page } from "@/components/common/Page";

const ACTIVITIES = [
  { key: "chat", label: "Ask Bondi", icon: MessageCircle, placeholder: "Ask me anything about coding, robots or AI!", desc: "Chat with your friendly AI tutor." },
  { key: "explain", label: "Explain a Concept", icon: BookOpen, placeholder: "e.g. What is machine learning?", desc: "Get a simple analogy for any concept." },
  { key: "hint", label: "Get a Hint", icon: Lightbulb, placeholder: "Describe what you're stuck on…", desc: "A gentle nudge without the full answer." },
];

const SUGGESTIONS = {
  chat: ["What is a robot?", "How do computers think?", "Tell me a fun coding fact"],
  explain: ["What is machine learning?", "Explain a loop", "What is a sensor?"],
  hint: ["My robot keeps hitting the wall", "My loop never stops", "How do I add a score?"],
};

export default function AILab() {
  const [activity, setActivity] = useState("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: prompt }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bb_token")}` },
        body: JSON.stringify({ activity, prompt }),
      });
      if (!res.ok || !res.body) throw new Error("AI unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "I need an internet connection to think. Please try again when you're online! 🌐" };
        return copy;
      });
    }
    setStreaming(false);
  };

  const current = ACTIVITIES.find((a) => a.key === activity);

  return (
    <Page title="AI Lab" subtitle="Learn AI concepts by chatting with Bondi, your AI tutor.">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {ACTIVITIES.map((a) => (
              <button key={a.key} onClick={() => setActivity(a.key)} data-testid={`ai-activity-${a.key}`}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${activity === a.key ? "border-amber-500 bg-amber-500/5" : "border-border bg-card hover:bg-muted"}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${activity === a.key ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <a.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex h-[62vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-auto p-5" data-testid="ai-chat-window">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold">Hi, I'm Bondi! 🤖</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">{current.desc} Try one of these:</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS[activity].map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-amber-500 hover:bg-amber-500/5" data-testid="ai-suggestion">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"}`}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content || <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-3">
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={current.placeholder} data-testid="ai-input"
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="submit" disabled={streaming || !input.trim()} data-testid="ai-send-button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white disabled:opacity-50">
                  {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
