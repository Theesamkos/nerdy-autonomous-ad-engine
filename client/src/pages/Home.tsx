import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  Zap, Brain, TrendingUp, Swords, Sparkles, BarChart3,
  ArrowRight, Bot, Shield, Target, Cpu, ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    color: "oklch(0.65 0.22 260)",
    glowClass: "glow-blue",
    title: "Real-Time Generation",
    desc: "Watch AI craft high-converting Facebook & Instagram ads token by token with live streaming output.",
  },
  {
    icon: Brain,
    color: "oklch(0.6 0.25 295)",
    glowClass: "glow-purple",
    title: "5-Dimension Evaluation",
    desc: "LLM-as-judge scores every ad on Clarity, Value Prop, CTA, Brand Voice & Emotional Resonance.",
  },
  {
    icon: Shield,
    color: "oklch(0.72 0.2 145)",
    glowClass: "glow-green",
    title: "Self-Healing Loops",
    desc: "Detects quality drops, diagnoses root causes, and auto-triggers targeted improvement strategies.",
  },
  {
    icon: TrendingUp,
    color: "oklch(0.72 0.2 55)",
    glowClass: "",
    title: "Quality Ratchet",
    desc: "Progressively raises the minimum quality bar as the engine learns what works for your brand.",
  },
  {
    icon: Swords,
    color: "oklch(0.65 0.25 340)",
    glowClass: "glow-pink",
    title: "Ad-versarial Mode",
    desc: "Pit your AI-generated ads against real competitor ads from Meta Ad Library. Win every battle.",
  },
  {
    icon: Sparkles,
    color: "oklch(0.75 0.18 200)",
    glowClass: "glow-cyan",
    title: "Creative Spark",
    desc: "Unconstrained LLM mode generates wild, out-of-the-box ideas presented as inspirational cards.",
  },
];

const STATS = [
  { value: "9", label: "AI Features" },
  { value: "5", label: "Quality Dimensions" },
  { value: "3x", label: "Faster Iteration" },
  { value: "∞", label: "Creative Potential" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30 backdrop-blur-sm bg-background/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-blue">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-foreground">AdEngine</span>
            <span className="text-muted-foreground text-sm"> by Nerdy × AI</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="gap-2 glow-blue">
                <LayoutDashboard className="w-4 h-4" />
                Open Dashboard
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm" className="gap-2 glow-blue">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-6">
            <Cpu className="w-3.5 h-3.5" />
            Autonomous Ad Copy Generation · v3.0
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            <span className="text-foreground">The AI that writes</span>
            <br />
            <span className="gradient-text">ads that actually convert.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A self-improving, self-healing ad copy engine built for Varsity Tutors. Generate, evaluate, iterate, and win — all powered by autonomous AI with real-time quality intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 px-8 glow-blue font-semibold">
                    Open Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/campaigns/new">
                  <Button size="lg" variant="outline" className="gap-2 px-8">
                    <Zap className="w-4 h-4" />
                    New Campaign
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2 px-8 glow-blue font-semibold">
                    Start Generating <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="gap-2 px-8" onClick={() => {}}>
                  <Sparkles className="w-4 h-4" />
                  See Demo
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto"
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display text-3xl font-bold gradient-text">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Live Preview Mockup */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 0 80px oklch(0.65 0.22 260 / 0.1), 0 25px 50px rgba(0,0,0,0.5)" }}
        >
          {/* Terminal-style header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <div className="flex-1 mx-4">
              <div className="bg-background/50 rounded px-3 py-1 text-xs text-muted-foreground font-mono text-center">
                adengine.nerdy.ai · Autonomous Generation Pipeline
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              <span className="text-xs text-green-400 font-mono">LIVE</span>
            </div>
          </div>

          {/* Mock UI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Generation */}
            <div className="p-6 border-r border-border/30">
              <div className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                GENERATING · Iteration 2/3
              </div>
              <div className="space-y-3">
                <div className="h-4 shimmer rounded w-full" />
                <div className="h-4 shimmer rounded w-5/6" />
                <div className="h-4 shimmer rounded w-4/5" />
                <div className="h-3 shimmer rounded w-1/2 mt-4" />
                <div className="h-3 shimmer rounded w-2/3" />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-xs text-primary font-mono">
                  ▸ Unlock your child's potential with expert 1-on-1 SAT tutoring...
                  <span className="typing-cursor" />
                </div>
              </div>
            </div>

            {/* Right: Scores */}
            <div className="p-6">
              <div className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                EVALUATING · 5 Dimensions
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Clarity", score: 8.4, color: "oklch(0.65 0.22 260)" },
                  { label: "Value Prop", score: 9.1, color: "oklch(0.72 0.2 145)" },
                  { label: "CTA", score: 7.8, color: "oklch(0.72 0.2 55)" },
                  { label: "Brand Voice", score: 8.6, color: "oklch(0.6 0.25 295)" },
                  { label: "Emotional", score: 9.3, color: "oklch(0.65 0.25 340)" },
                ].map(({ label, score, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-muted-foreground">{label}</div>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 1, delay: 0.5 + Math.random() * 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <div className="w-8 text-xs font-mono text-right" style={{ color }}>{score}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-xs text-green-400 font-medium">Weighted Score</span>
                <span className="text-lg font-display font-bold text-green-400">8.64</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Every feature you need to dominate Meta ads
            </h2>
            <p className="text-muted-foreground">9 AI-powered capabilities working in concert</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, color, glowClass, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.07 }}
                className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-200 group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 group-hover:${glowClass}`}
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="p-10 rounded-2xl bg-card border border-border/50 gradient-border">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Ready to build ads that win?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your first campaign and watch the autonomous engine go to work.
          </p>
          {isAuthenticated ? (
            <Link href="/campaigns/new">
              <Button size="lg" className="gap-2 px-10 glow-blue font-semibold">
                Launch First Campaign <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2 px-10 glow-blue font-semibold">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

// Missing import fix
function LayoutDashboard(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}
