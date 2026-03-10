import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, CheckCircle2,
  Cpu, Flame, Shield, Swords, Zap, ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Generation",
    hook: "Watch every token stream live as the engine writes.",
    desc: "Token-by-token streaming output. Every iteration visible in real time — no black box.",
    tag: "LIVE STREAM",
    color: "#22d3ee",
  },
  {
    icon: Brain,
    title: "5-Dimension Evaluation",
    hook: "LLM-as-judge. Not vibes — structured scoring.",
    desc: "Clarity, Value Prop, CTA, Brand Voice, Emotional Resonance. Each scored 1–10 with rationale.",
    tag: "LLM JUDGE",
    color: "#a78bfa",
  },
  {
    icon: Shield,
    title: "Self-Healing Loops",
    hook: "Quality drops trigger automatic recovery.",
    desc: "The engine diagnoses root causes and switches generation strategy without human input.",
    tag: "AUTONOMOUS",
    color: "#34d399",
  },
  {
    icon: BarChart3,
    title: "Quality Ratchet",
    hook: "The floor only moves up. Never down.",
    desc: "Minimum thresholds rise as performance improves. The system is incapable of regression.",
    tag: "ADAPTIVE",
    color: "#f59e0b",
  },
  {
    icon: Swords,
    title: "Ad-versarial Mode",
    hook: "Your AI vs. real competitor ads. May the best copy win.",
    desc: "Pull from Meta Ad Library. Iterate until every dimension score beats the competition.",
    tag: "COMPETITIVE",
    color: "#f87171",
  },
  {
    icon: Flame,
    title: "Creative Spark",
    hook: "No guardrails. Pure creative firepower.",
    desc: "Unconstrained mode produces wild, unexpected ideas. Inspirational cards for human review.",
    tag: "UNFILTERED",
    color: "#fb923c",
  },
];

const STATS = [
  { value: "9", suffix: "×", label: "Pipeline Stages" },
  { value: "5",  suffix: "",  label: "Quality Dimensions" },
  { value: "100", suffix: "×", label: "Optimization Target" },
  { value: "v3", suffix: "",  label: "Engine Version" },
];

const TERMINAL_LINES = [
  { ts: "00:01", type: "sys",  msg: "Initializing autonomous generation pipeline..." },
  { ts: "00:03", type: "ai",   msg: "Generating copy for target audience segment..." },
  { ts: "00:07", type: "eval", msg: "LLM-as-judge scoring 5 quality dimensions..." },
  { ts: "00:09", type: "pass", msg: "Score 8.7/10 — threshold met. Approving." },
  { ts: "00:11", type: "sys",  msg: "Ratchet updated: new minimum 8.8" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [terminalLine, setTerminalLine] = useState(0);
  const [scoreVal, setScoreVal] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTerminalLine(l => (l + 1) % TERMINAL_LINES.length), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += 0.15;
      if (v >= 8.7) { clearInterval(t); setScoreVal(8.7); return; }
      setScoreVal(parseFloat(v.toFixed(1)));
    }, 28);
    return () => clearInterval(t);
  }, []);

  const circumference = 2 * Math.PI * 30;
  const dashOffset = circumference - (scoreVal / 10) * circumference;

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

      {/* ── Nav ── */}
      <nav
        className="relative z-20 flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(34,211,238,0.07)", background: "rgba(2,11,24,0.75)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.04))", border: "1px solid rgba(34,211,238,0.28)" }}
          >
            <Brain size={15} style={{ color: "#22d3ee" }} />
          </div>
          <span className="font-display font-bold text-sm tracking-tight" style={{ color: "#f8fafc" }}>
            AdEngine <span className="font-mono font-normal" style={{ fontSize: "0.58rem", color: "rgba(34,211,238,0.45)", letterSpacing: "0.1em" }}>v3</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {["System", "Features", "Intelligence", "Architecture"].map(item => (
            <span
              key={item}
              className="font-mono cursor-pointer transition-colors hover:text-white"
              style={{ fontSize: "0.65rem", color: "rgba(148,163,184,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34d399", boxShadow: "0 0 5px #34d399" }} />
            <span className="font-mono" style={{ fontSize: "0.6rem", color: "rgba(52,211,153,0.7)", letterSpacing: "0.1em" }}>SYSTEM ONLINE</span>
          </div>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button className="btn-primary flex items-center gap-2">
                <Cpu size={12} /> Enter System
              </button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <button className="btn-primary flex items-center gap-2">
                <Zap size={12} /> Request Access
              </button>
            </a>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 px-8 pt-20 pb-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_480px] gap-16 items-center">

          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Label */}
            <div
              className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22d3ee", boxShadow: "0 0 5px #22d3ee" }} />
              <span className="font-mono" style={{ fontSize: "0.6rem", color: "#22d3ee", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Autonomous Content Generation Engine
              </span>
            </div>

            {/* Headline */}
            <h1 className="display-xl mb-6 leading-[1.05]" style={{ color: "#f8fafc", letterSpacing: "-0.03em" }}>
              We Engineer<br />
              <span style={{ color: "#22d3ee" }}>Ad Intelligence.</span>
            </h1>

            {/* Subtext — one clean paragraph, nothing more */}
            <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(148,163,184,0.75)", maxWidth: "440px" }}>
              An autonomous pipeline that generates, evaluates, self-heals, and progressively improves ad copy — without human intervention.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                    Launch Engine <ArrowRight size={14} />
                  </button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                    Launch Engine <ArrowRight size={14} />
                  </button>
                </a>
              )}
              <button className="btn-secondary flex items-center gap-2 px-6 py-3 text-sm">
                View Architecture <ChevronRight size={13} />
              </button>
            </div>

            {/* Trust signals — minimal, inline */}
            <div className="flex flex-wrap gap-5">
              {["LLM-as-Judge Scoring", "Self-Healing Loops", "Quality Ratchet"].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={12} style={{ color: "#34d399" }} />
                  <span className="font-mono" style={{ fontSize: "0.63rem", color: "rgba(148,163,184,0.6)", letterSpacing: "0.04em" }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Pipeline mockup — clean, focused */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="self-start"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(4,14,30,0.9)",
                border: "1px solid rgba(34,211,238,0.18)",
                boxShadow: "0 0 80px rgba(34,211,238,0.06), 0 32px 80px rgba(0,0,0,0.6)",
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ borderBottom: "1px solid rgba(34,211,238,0.09)", background: "rgba(2,11,24,0.7)" }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#34d399" }} />
                <span className="font-mono ml-3" style={{ fontSize: "0.6rem", color: "rgba(34,211,238,0.45)", letterSpacing: "0.1em" }}>
                  GENERATION PIPELINE — LIVE
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
                  <span className="font-mono" style={{ fontSize: "0.58rem", color: "rgba(52,211,153,0.7)", letterSpacing: "0.08em" }}>ACTIVE</span>
                </div>
              </div>

              <div className="p-6">
                {/* Score — the ONE focal point */}
                <div className="flex items-center gap-6 mb-6">
                  {/* Large score ring */}
                  <div className="relative flex-shrink-0">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="30" fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth="5" />
                      <circle
                        cx="44" cy="44" r="30"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 44 44)"
                        style={{ transition: "stroke-dashoffset 0.3s ease", filter: "drop-shadow(0 0 8px rgba(34,211,238,0.5))" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono font-bold" style={{ color: "#22d3ee", fontSize: "1.25rem", lineHeight: 1 }}>{scoreVal.toFixed(1)}</span>
                      <span className="font-mono" style={{ fontSize: "0.48rem", color: "rgba(34,211,238,0.45)", letterSpacing: "0.1em" }}>SCORE</span>
                    </div>
                  </div>

                  {/* Ad copy — clean, readable */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#e2e8f0" }}>
                      "Stop wasting money on ads that don't convert. Our AI generates, tests, and optimizes automatically."
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="tag-ops tag-green" style={{ fontSize: "0.55rem" }}>APPROVED</span>
                      <span className="font-mono" style={{ fontSize: "0.57rem", color: "rgba(148,163,184,0.45)" }}>Iteration 2 · Standard Mode</span>
                    </div>
                  </div>
                </div>

                {/* Dimension bars — compact */}
                <div className="space-y-2.5 mb-6">
                  {[
                    { label: "CLARITY",    val: 88, color: "#22d3ee" },
                    { label: "VALUE PROP", val: 92, color: "#a78bfa" },
                    { label: "CTA",        val: 95, color: "#34d399" },
                    { label: "BRAND VOICE",val: 84, color: "#f59e0b" },
                    { label: "EMOTIONAL",  val: 79, color: "#f87171" },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="font-mono w-[72px] flex-shrink-0" style={{ fontSize: "0.56rem", color: "rgba(148,163,184,0.45)", letterSpacing: "0.05em" }}>{d.label}</span>
                      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${d.val}%`, background: d.color, boxShadow: `0 0 4px ${d.color}50`, transition: "width 1s ease" }}
                        />
                      </div>
                      <span className="font-mono w-5 text-right flex-shrink-0" style={{ fontSize: "0.58rem", color: d.color }}>{(d.val / 10).toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Pipeline log — minimal */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.07)" }}
                >
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(34,211,238,0.05)" }}>
                    <span className="font-mono" style={{ fontSize: "0.56rem", color: "rgba(34,211,238,0.35)", letterSpacing: "0.1em" }}>PIPELINE LOG</span>
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
                      <span className="log-msg"><span className="cursor-blink" /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar — Tesla instrument cluster style ── */}
      <section className="relative z-10 px-8 pb-20 max-w-7xl mx-auto">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-0 rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(34,211,238,0.1)", background: "rgba(4,14,30,0.6)", backdropFilter: "blur(20px)" }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex-1 flex flex-col items-center justify-center py-7 px-6"
              style={{
                borderRight: i < STATS.length - 1 ? "1px solid rgba(34,211,238,0.07)" : "none",
                borderBottom: "none",
              }}
            >
              <div className="font-display font-bold mb-1" style={{ fontSize: "2.2rem", color: "#f8fafc", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {s.value}<span style={{ color: "#22d3ee" }}>{s.suffix}</span>
              </div>
              <div className="font-mono text-center" style={{ fontSize: "0.58rem", color: "rgba(100,116,139,0.7)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-8 pb-24 max-w-7xl mx-auto">

        {/* Section header — minimal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-14"
        >
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.13)" }}
          >
            <span className="font-mono" style={{ fontSize: "0.6rem", color: "#22d3ee", letterSpacing: "0.14em", textTransform: "uppercase" }}>System Capabilities</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="display-md" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Everything the engine can do
            </h2>
            <p className="text-sm" style={{ color: "rgba(148,163,184,0.55)", maxWidth: "340px" }}>
              Nine interconnected systems working in concert — no human intervention required.
            </p>
          </div>
        </motion.div>

        {/* 2-column feature grid — more space per card */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.07 }}
              className="ops-card p-6 group cursor-pointer"
            >
              {/* Icon + tag row */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                  style={{ background: `${f.color}10`, border: `1px solid ${f.color}22` }}
                >
                  <f.icon size={17} style={{ color: f.color }} />
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: "0.54rem", color: f.color, letterSpacing: "0.1em", border: `1px solid ${f.color}20`, background: `${f.color}08`, padding: "2px 7px", borderRadius: "4px" }}
                >
                  {f.tag}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display font-semibold text-sm mb-1.5" style={{ color: "#f8fafc" }}>{f.title}</h3>

              {/* Hook — the one-liner that sells it */}
              <p className="text-xs font-medium mb-2.5" style={{ color: f.color, opacity: 0.85 }}>{f.hook}</p>

              {/* Description — supporting detail */}
              <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-8 py-5"
        style={{ borderTop: "1px solid rgba(34,211,238,0.07)", background: "rgba(2,11,24,0.8)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Brain size={13} style={{ color: "#22d3ee" }} />
            <span className="font-mono" style={{ fontSize: "0.6rem", color: "rgba(100,116,139,0.6)", letterSpacing: "0.1em" }}>
              ADENGINE v3 · AUTONOMOUS CONTENT GENERATION SYSTEM
            </span>
          </div>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Docs"].map(item => (
              <span key={item} className="font-mono cursor-pointer hover:text-white transition-colors" style={{ fontSize: "0.6rem", color: "rgba(100,116,139,0.5)", letterSpacing: "0.08em" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
