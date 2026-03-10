import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, CheckCircle2, ChevronRight,
  Cpu, Flame, Shield, Swords, Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Generation",
    desc: "Watch the AI write your ad copy token-by-token with live streaming output. Every word, every iteration — visible in real time.",
    tag: "LIVE STREAM",
    color: "#22d3ee",
  },
  {
    icon: Brain,
    title: "5-Dimension Evaluation",
    desc: "LLM-as-judge scores every ad across Clarity, Value Prop, CTA, Brand Voice, and Emotional Resonance with detailed rationale.",
    tag: "LLM JUDGE",
    color: "#a78bfa",
  },
  {
    icon: Shield,
    title: "Self-Healing Loops",
    desc: "Quality drops are detected automatically. The engine diagnoses root causes and triggers alternative generation strategies without human intervention.",
    tag: "AUTONOMOUS",
    color: "#34d399",
  },
  {
    icon: BarChart3,
    title: "Quality Ratchet",
    desc: "Minimum quality thresholds rise progressively as performance improves. The engine never regresses — it only gets better.",
    tag: "ADAPTIVE",
    color: "#f59e0b",
  },
  {
    icon: Swords,
    title: "Ad-versarial Mode",
    desc: "Pit AI-generated ads against real competitor ads from the Meta Ad Library. Iterate until yours wins on every dimension.",
    tag: "COMPETITIVE",
    color: "#f87171",
  },
  {
    icon: Flame,
    title: "Creative Spark",
    desc: "Unconstrained LLM mode produces wild, out-of-the-box ideas. No guardrails. Pure creative firepower presented as inspirational cards.",
    tag: "UNFILTERED",
    color: "#fb923c",
  },
];

const STATS = [
  { value: "9", label: "Pipeline Stages", suffix: "×" },
  { value: "5", label: "Quality Dimensions", suffix: "" },
  { value: "100", label: "Optimization Target", suffix: "×" },
  { value: "v3", label: "Engine Version", suffix: "" },
];

const TERMINAL_LINES = [
  { ts: "00:01", type: "sys",  msg: "Initializing autonomous generation pipeline..." },
  { ts: "00:03", type: "ai",   msg: "Generating ad copy for target audience segment..." },
  { ts: "00:07", type: "eval", msg: "LLM-as-judge scoring 5 quality dimensions..." },
  { ts: "00:09", type: "pass", msg: "Score 8.7/10 — threshold met. Approving." },
  { ts: "00:11", type: "sys",  msg: "Ratchet updated: new minimum threshold 8.8" },
  { ts: "00:14", type: "ai",   msg: "Iteration 2 — applying creative variation..." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [terminalLine, setTerminalLine] = useState(0);
  const [scoreVal, setScoreVal] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTerminalLine(l => (l + 1) % TERMINAL_LINES.length);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += 0.12;
      if (v >= 8.7) { clearInterval(t); setScoreVal(8.7); return; }
      setScoreVal(parseFloat(v.toFixed(1)));
    }, 30);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: "#020b18" }}>
      {/* Space background */}
      <div className="space-bg">
        <div className="space-bg-image" />
        <div className="space-bg-overlay" />
        <div className="space-bg-scanlines" />
        <div className="space-bg-glow-top" />
        <div className="space-bg-glow-bottom" />
      </div>

      {/* Nav */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(34,211,238,0.08)", background: "rgba(2,11,24,0.7)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.05))", border: "1px solid rgba(34,211,238,0.3)", boxShadow: "0 0 16px rgba(34,211,238,0.15)" }}
          >
            <Brain size={16} style={{ color: "#22d3ee" }} />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight" style={{ color: "#f8fafc" }}>AdEngine</span>
            <span className="font-mono ml-2" style={{ fontSize: "0.58rem", color: "rgba(34,211,238,0.5)", letterSpacing: "0.12em" }}>v3</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {["System", "Features", "Intelligence", "Architecture"].map(item => (
            <span key={item} className="font-mono cursor-pointer transition-colors" style={{ fontSize: "0.68rem", color: "rgba(148,163,184,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {item}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="status-live hidden sm:flex">System Online</span>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button className="btn-primary flex items-center gap-2">
                <Cpu size={13} />
                Enter System
              </button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <button className="btn-primary flex items-center gap-2">
                <Zap size={13} />
                Request Access
              </button>
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-20 pb-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.18)" }}>
              <span className="font-mono" style={{ fontSize: "0.62rem", color: "#22d3ee", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Autonomous Content Generation Engine
              </span>
            </div>

            <h1 className="display-xl mb-6" style={{ color: "#f8fafc" }}>
              We Engineer<br />
              <span style={{ color: "#22d3ee", textShadow: "0 0 40px rgba(34,211,238,0.3)" }}>Ad Intelligence.</span>
            </h1>

            <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(148,163,184,0.8)", maxWidth: "480px" }}>
              An autonomous pipeline that generates, evaluates, self-heals, and progressively improves ad copy — without human intervention. Built for Facebook and Instagram. Powered by LLM-as-judge.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="btn-primary flex items-center gap-2 text-sm px-6 py-3">
                    Launch Engine
                    <ArrowRight size={15} />
                  </button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <button className="btn-primary flex items-center gap-2 text-sm px-6 py-3">
                    Launch Engine
                    <ArrowRight size={15} />
                  </button>
                </a>
              )}
              <button className="btn-secondary flex items-center gap-2 text-sm px-6 py-3">
                View Architecture
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4">
              {["LLM-as-Judge Scoring", "Self-Healing Loops", "Quality Ratchet System"].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: "#34d399" }} />
                  <span className="font-mono" style={{ fontSize: "0.65rem", color: "rgba(148,163,184,0.7)", letterSpacing: "0.04em" }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Live terminal mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(5,18,35,0.85)",
                border: "1px solid rgba(34,211,238,0.2)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 0 60px rgba(34,211,238,0.08), 0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(34,211,238,0.1)", background: "rgba(2,11,24,0.6)" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: "#f87171" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#34d399" }} />
                <span className="font-mono ml-3" style={{ fontSize: "0.62rem", color: "rgba(34,211,238,0.5)", letterSpacing: "0.1em" }}>GENERATION PIPELINE — LIVE</span>
                <div className="ml-auto">
                  <span className="status-live">Active</span>
                </div>
              </div>

              {/* Score ring + ad copy */}
              <div className="p-5">
                <div className="flex items-start gap-4 mb-5">
                  {/* Score ring */}
                  <div className="relative flex-shrink-0">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="4" />
                      <circle
                        cx="36" cy="36" r="28"
                        fill="none"
                        stroke="url(#scoreGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(scoreVal / 10) * 175.9} 175.9`}
                        transform="rotate(-90 36 36)"
                        style={{ transition: "stroke-dasharray 0.3s ease" }}
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0891b2" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono font-bold" style={{ color: "#22d3ee", fontSize: "1rem" }}>{scoreVal.toFixed(1)}</span>
                      <span className="font-mono" style={{ fontSize: "0.5rem", color: "rgba(34,211,238,0.5)", letterSpacing: "0.08em" }}>SCORE</span>
                    </div>
                  </div>

                  {/* Ad copy preview */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="rounded-lg p-3 mb-2"
                      style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}
                    >
                      <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>
                        "Stop wasting money on ads that don't convert. Our AI-powered system generates, tests, and optimizes your campaigns automatically."
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tag-ops tag-green">APPROVED</span>
                      <span className="font-mono" style={{ fontSize: "0.58rem", color: "rgba(148,163,184,0.5)" }}>Iteration 2 of 3 · Standard Mode</span>
                    </div>
                  </div>
                </div>

                {/* Dimension bars */}
                <div className="space-y-2 mb-5">
                  {[
                    { label: "CLARITY",    val: 88, color: "#22d3ee" },
                    { label: "VALUE PROP", val: 92, color: "#a78bfa" },
                    { label: "CTA",        val: 95, color: "#34d399" },
                    { label: "BRAND VOICE",val: 84, color: "#f59e0b" },
                    { label: "EMOTIONAL",  val: 79, color: "#f87171" },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="font-mono w-20 flex-shrink-0" style={{ fontSize: "0.58rem", color: "rgba(148,163,184,0.5)", letterSpacing: "0.06em" }}>{d.label}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${d.val}%`, background: d.color, boxShadow: `0 0 6px ${d.color}60` }} />
                      </div>
                      <span className="font-mono w-6 text-right flex-shrink-0" style={{ fontSize: "0.6rem", color: d.color }}>{(d.val / 10).toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Terminal log */}
                <div className="rounded-lg overflow-hidden" style={{ background: "rgba(2,11,24,0.8)", border: "1px solid rgba(34,211,238,0.08)" }}>
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
                    <span className="font-mono" style={{ fontSize: "0.58rem", color: "rgba(34,211,238,0.4)", letterSpacing: "0.1em" }}>PIPELINE LOG</span>
                  </div>
                  <div className="p-3 space-y-1">
                    {TERMINAL_LINES.slice(0, terminalLine + 1).map((line, i) => (
                      <div key={i} className="log-entry">
                        <span className="log-ts">{line.ts}</span>
                        <span className={`log-type log-type-${line.type}`}>{line.type.toUpperCase()}</span>
                        <span className="log-msg">{line.msg}</span>
                      </div>
                    ))}
                    <div className="log-entry">
                      <span className="log-ts">--:--</span>
                      <span className="log-type log-type-sys">SYS</span>
                      <span className="log-msg">
                        <span className="cursor-blink" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating glow */}
            <div
              className="absolute -inset-4 rounded-2xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.04) 0%, transparent 70%)", zIndex: -1 }}
            />
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 px-6 pb-12 max-w-7xl mx-auto">
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(34,211,238,0.12)", background: "rgba(34,211,238,0.08)" }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex flex-col items-center justify-center py-6 px-4"
              style={{ background: "rgba(2,11,24,0.85)", backdropFilter: "blur(16px)" }}
            >
              <div className="font-display font-bold mb-1" style={{ fontSize: "2rem", color: "#f8fafc", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {s.value}<span style={{ color: "#22d3ee" }}>{s.suffix}</span>
              </div>
              <div className="font-mono text-center" style={{ fontSize: "0.6rem", color: "rgba(100,116,139,0.8)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 px-6 pb-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)" }}>
            <span className="font-mono" style={{ fontSize: "0.62rem", color: "#22d3ee", letterSpacing: "0.12em", textTransform: "uppercase" }}>System Capabilities</span>
          </div>
          <h2 className="display-md mb-4" style={{ color: "#f8fafc" }}>
            Everything the engine can do
          </h2>
          <p style={{ color: "rgba(148,163,184,0.7)", maxWidth: "480px", margin: "0 auto" }}>
            Nine interconnected systems working in concert to produce, evaluate, and continuously improve ad copy without human intervention.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="ops-card p-5 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{ background: `${f.color}12`, border: `1px solid ${f.color}25` }}
                >
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-display font-semibold text-sm" style={{ color: "#f8fafc" }}>{f.title}</h3>
                    <span className="tag-ops" style={{ color: f.color, border: `1px solid ${f.color}25`, background: `${f.color}08`, fontSize: "0.55rem" }}>{f.tag}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-20 max-w-3xl mx-auto text-center">
        <div
          className="rounded-2xl p-10"
          style={{
            background: "rgba(5,18,35,0.8)",
            border: "1px solid rgba(34,211,238,0.18)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 60px rgba(34,211,238,0.06)",
          }}
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)" }}>
            <span className="status-live">Ready to Deploy</span>
          </div>
          <h2 className="display-md mb-4" style={{ color: "#f8fafc" }}>
            Ready to engineer<br />
            <span style={{ color: "#22d3ee" }}>your first campaign?</span>
          </h2>
          <p className="mb-8" style={{ color: "rgba(148,163,184,0.7)" }}>
            Enter the system and launch your first autonomous ad generation pipeline in under 60 seconds.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button className="btn-primary flex items-center gap-2 mx-auto text-sm px-8 py-3">
                Enter the System
                <ArrowRight size={15} />
              </button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <button className="btn-primary flex items-center gap-2 mx-auto text-sm px-8 py-3">
                Enter the System
                <ArrowRight size={15} />
              </button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-6"
        style={{ borderTop: "1px solid rgba(34,211,238,0.07)", background: "rgba(2,11,24,0.7)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brain size={14} style={{ color: "#22d3ee" }} />
            <span className="font-mono" style={{ fontSize: "0.65rem", color: "rgba(100,116,139,0.7)", letterSpacing: "0.08em" }}>
              ADENGINE v3 · AUTONOMOUS CONTENT GENERATION SYSTEM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-live" style={{ fontSize: "0.6rem" }}>All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
