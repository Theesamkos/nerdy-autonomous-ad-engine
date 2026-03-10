import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Shield, Zap, BarChart3, Brain, Target, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const FEATURES = [
  {
    icon: Cpu,
    code: "01",
    title: "Autonomous Generation",
    body: "LLM-powered pipeline writes, evaluates, and self-heals ad copy without human intervention. Streaming output visible in real time.",
  },
  {
    icon: Shield,
    code: "02",
    title: "5-Dimension Evaluation",
    body: "Every ad is scored on Clarity, Value Proposition, CTA, Brand Voice, and Emotional Resonance by a second LLM acting as judge.",
  },
  {
    icon: Zap,
    code: "03",
    title: "Self-Healing Loops",
    body: "Quality drops are detected, root causes diagnosed, and alternative generation strategies triggered automatically.",
  },
  {
    icon: BarChart3,
    code: "04",
    title: "Quality Ratchet",
    body: "Minimum quality thresholds rise progressively as the engine improves. The bar never drops once it has been raised.",
  },
  {
    icon: Brain,
    code: "05",
    title: "Ad-versarial Mode",
    body: "Pit AI-generated ads against real competitor creatives from the Meta Ad Library. Iterate until you win.",
  },
  {
    icon: Target,
    code: "06",
    title: "Creative Spark",
    body: "Unconstrained generation mode produces wild, out-of-the-box ideas presented as high-contrast inspiration cards.",
  },
];

const STATS = [
  { value: "9", label: "AI Pipeline Stages" },
  { value: "5", label: "Quality Dimensions" },
  { value: "100x", label: "Optimization Target" },
  { value: "v3", label: "Engine Version" },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-[#c8a84b] flex items-center justify-center">
            <div className="w-3 h-3 bg-[#c8a84b]" />
          </div>
          <span className="font-mono text-xs font-bold tracking-[0.18em] uppercase text-white">
            AdEngine
          </span>
          <span className="font-mono text-[9px] tracking-widest text-[#383838] ml-1">v3</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["System", "Features", "Intelligence"].map(item => (
            <span key={item} className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#555] hover:text-[#c8a84b] cursor-pointer transition-colors">
              {item}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            isAuthenticated ? (
              <Link href="/dashboard">
                <button className="btn-ops btn-ops-primary">
                  Enter System <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <button className="btn-ops btn-ops-primary">
                  Request Access <ArrowRight className="w-3 h-3" />
                </button>
              </a>
            )
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-8 pt-24 pb-20 max-w-6xl mx-auto">
        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-12"
        >
          <div className="status-live">SYSTEM ONLINE</div>
          <div className="w-px h-3 bg-[#222]" />
          <span className="font-mono text-[9px] tracking-widest text-[#383838] uppercase">
            Autonomous Content Generation Engine
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-[clamp(3rem,8vw,7rem)] font-black leading-[0.92] tracking-[-0.03em] text-white">
            We Engineer
            <br />
            <span style={{ color: "#c8a84b" }}>Ad Intelligence.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[#666] text-lg max-w-xl leading-relaxed mb-12 font-light"
        >
          An autonomous pipeline that generates, evaluates, self-heals, and
          progressively improves ad copy — without human intervention.
          Built for Facebook and Instagram. Powered by LLM-as-judge.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-4 flex-wrap"
        >
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button className="btn-ops btn-ops-primary text-sm px-6 py-3">
                Launch Engine <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <button className="btn-ops btn-ops-primary text-sm px-6 py-3">
                Request Access <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          )}
          <button className="btn-ops btn-ops-ghost text-sm px-6 py-3">
            View Architecture
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px mt-20 border border-[#111]"
        >
          {STATS.map((s, i) => (
            <div key={i} className="px-6 py-5 bg-[#080808] border-r border-[#111] last:border-r-0">
              <div className="font-mono text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="section-label">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="relative z-10 px-8 py-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="section-label">System Capabilities</div>
          <div className="flex-1 h-px bg-[#111]" />
          <div className="font-mono text-[9px] text-[#383838]">06 MODULES</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#111]">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bracket bg-[#060606] p-8 group hover:bg-[#0a0a0a] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-9 h-9 border border-[#1a1a1a] flex items-center justify-center group-hover:border-[#c8a84b]/30 transition-colors">
                  <f.icon className="w-4 h-4 text-[#555] group-hover:text-[#c8a84b] transition-colors" />
                </div>
                <span className="font-mono text-[10px] text-[#2a2a2a] group-hover:text-[#c8a84b]/40 transition-colors">{f.code}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-3 tracking-tight">{f.title}</h3>
              <p className="text-[#555] text-sm leading-relaxed">{f.body}</p>
              <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-mono text-[9px] text-[#c8a84b] tracking-widest uppercase">Explore</span>
                <ChevronRight className="w-3 h-3 text-[#c8a84b]" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PIPELINE DIAGRAM ── */}
      <section className="relative z-10 px-8 py-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="section-label">Autonomous Pipeline</div>
          <div className="flex-1 h-px bg-[#111]" />
        </div>

        <div className="bracket border border-[#111] p-8 bg-[#060606]">
          <div className="flex flex-wrap items-center gap-0">
            {[
              { label: "INPUT", sub: "Brand Brief", color: "#c8a84b" },
              { label: "GENERATE", sub: "LLM Write", color: "#a78bfa" },
              { label: "EVALUATE", sub: "LLM Judge", color: "#60a5fa" },
              { label: "SELF-HEAL", sub: "Root Cause", color: "#f87171" },
              { label: "RATCHET", sub: "Raise Bar", color: "#4ade80" },
              { label: "APPROVE", sub: "Ship It", color: "#c8a84b" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center py-4 px-5">
                  <div
                    className="font-mono text-[10px] font-bold tracking-[0.12em] mb-1"
                    style={{ color: step.color }}
                  >
                    {step.label}
                  </div>
                  <div className="font-mono text-[9px] text-[#383838]">{step.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center gap-1 px-1">
                    <div className="w-6 h-px bg-[#222]" />
                    <div className="w-1 h-1 bg-[#333]" style={{ clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-[#111] flex items-center gap-3">
            <div className="status-live">PIPELINE ACTIVE</div>
            <span className="font-mono text-[9px] text-[#383838]">
              All stages operational. Self-healing enabled. Quality ratchet at baseline 7.0.
            </span>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative z-10 px-8 py-24 max-w-6xl mx-auto text-center">
        <div className="section-label mb-6 text-center">Ready to Deploy</div>
        <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-black leading-tight tracking-tight text-white mb-6">
          Your ads, engineered.
        </h2>
        <p className="text-[#555] text-base max-w-md mx-auto mb-10">
          Build a campaign. Watch the engine work. Approve what passes the bar.
        </p>
        {isAuthenticated ? (
          <Link href="/campaigns/new">
            <button className="btn-ops btn-ops-primary text-sm px-8 py-4">
              Create First Campaign <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        ) : (
          <a href={getLoginUrl()}>
            <button className="btn-ops btn-ops-primary text-sm px-8 py-4">
              Request Access <ArrowRight className="w-4 h-4" />
            </button>
          </a>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#0f0f0f] px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border border-[#c8a84b]/30 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#c8a84b]/50" />
          </div>
          <span className="font-mono text-[9px] text-[#2a2a2a] tracking-widest uppercase">AdEngine v3</span>
        </div>
        <div className="font-mono text-[9px] text-[#2a2a2a] tracking-widest">
          AUTONOMOUS CONTENT GENERATION SYSTEM
        </div>
      </footer>
    </div>
  );
}
