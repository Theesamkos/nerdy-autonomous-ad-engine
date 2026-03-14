import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, Flame, Plus,
  Sparkles, Swords, TrendingUp, Zap, Activity,
  CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { Link } from "wouter";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(34,211,238,0.15)", borderTopColor: "#22d3ee" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#94a3b8" }}>LOADING</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="ops-card bracket p-10 text-center max-w-sm w-full">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)" }}>
              <Brain size={20} style={{ color: "#22d3ee" }} />
            </div>
            <h2 className="font-display font-bold text-lg mb-2" style={{ color: "#f8fafc" }}>Access Required</h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(148,163,184,0.55)" }}>
              Sign in to access the AdEngine mission control dashboard.
            </p>
            <a href={getLoginUrl()}>
              <button className="btn-primary mx-auto flex items-center gap-2">
                <Zap size={13} /> Request Access
              </button>
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalAds = campaigns?.reduce((s, c) => s + (c.totalAdsGenerated || 0), 0) ?? 0;
  const totalCost = campaigns?.reduce((s, c) => s + (c.totalCostUsd || 0), 0) ?? 0;
  const avgThreshold = campaigns?.length
    ? campaigns.reduce((s, c) => s + (c.currentQualityThreshold || 0), 0) / campaigns.length
    : 0;

  const avgHealthColor = avgThreshold >= 8.0 ? "#34d399" : avgThreshold >= 7.0 ? "#f59e0b" : "#f87171";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="status-live">Mission Control</span>
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(34,211,238,0.65)" }}>
                · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl tracking-tight" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Welcome back,{" "}
              <span style={{ color: "#22d3ee" }}>{user?.name?.split(" ")[0] || "Operator"}</span>
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "rgba(148,163,184,0.5)" }}>
              Your autonomous ad generation system is online and ready.
            </p>
          </div>
          <Link href="/campaigns/new">
            <button className="btn-primary flex items-center gap-2">
              <Plus size={14} /> New Campaign
            </button>
          </Link>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div {...fadeUp(0.06)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Campaigns",     value: String(campaigns?.length ?? 0), icon: Zap,        color: "#22d3ee", sub: "total" },
            { label: "Ads Generated", value: String(totalAds),               icon: Brain,      color: "#a78bfa", sub: "all time" },
            { label: "Avg Quality",   value: avgThreshold.toFixed(1),        icon: TrendingUp, color: "#34d399", sub: "avg threshold" },
            { label: "Total Spend",   value: "$" + totalCost.toFixed(3),     icon: Flame,      color: "#f59e0b", sub: "USD" },
          ].map((s, i) => (
            <motion.div key={s.label} {...fadeUp(0.06 + i * 0.05)} className="ops-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: s.color + "12", border: "1px solid " + s.color + "22" }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#94a3b8" }}>{s.sub}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display font-bold" style={{ fontSize: "2rem", color: "#f8fafc", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {s.value}
                </div>
                {s.label === "Avg Quality" && avgThreshold > 0 && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: avgHealthColor, boxShadow: `0 0 6px ${avgHealthColor}99` }} />
                )}
              </div>
              <div className="font-mono text-[10px] tracking-wider uppercase mt-1.5" style={{ color: "rgba(100,116,139,0.55)" }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Campaigns List — 3 cols */}
          <motion.div {...fadeUp(0.12)} className="lg:col-span-3">
            <div className="ops-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
                <div className="flex items-center gap-2.5">
                  <Activity size={14} style={{ color: "#22d3ee" }} />
                  <span className="font-mono font-semibold text-[11px] tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                    Active Campaigns
                  </span>
                  {campaigns && campaigns.length > 0 && (
                    <span className="tag-ops tag-teal">{campaigns.length}</span>
                  )}
                </div>
                <Link href="/campaigns/new">
                  <button className="btn-secondary flex items-center gap-1.5 text-[11px]" style={{ padding: "0.3rem 0.7rem" }}>
                    <Plus size={11} /> New
                  </button>
                </Link>
              </div>

              {!campaigns || campaigns.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.1)" }}>
                    <Zap size={20} style={{ color: "rgba(34,211,238,0.6)" }} />
                  </div>
                  <p className="font-display font-semibold text-sm mb-1.5" style={{ color: "#e2e8f0" }}>No campaigns yet</p>
                  <p className="text-xs mb-6 leading-relaxed" style={{ color: "#94a3b8" }}>
                    Launch your first autonomous generation pipeline
                  </p>
                  <Link href="/campaigns/new">
                    <button className="btn-primary flex items-center gap-2 mx-auto text-xs">
                      <Plus size={12} /> Create First Campaign
                    </button>
                  </Link>
                </div>
              ) : (
                <div>
                  {campaigns.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                      <Link href={"/campaigns/" + c.id}>
                        <div className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-white/[0.015] group"
                          style={{ borderBottom: "1px solid rgba(34,211,238,0.04)" }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}>
                            <Brain size={14} style={{ color: "#22d3ee" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const health = !c.totalAdsGenerated ? "gray"
                                : c.currentQualityThreshold >= 8.0 ? "green"
                                : c.currentQualityThreshold >= 7.0 ? "amber"
                                : "red";
                              const dotStyle = health === "green" ? { background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.6)" }
                                : health === "amber" ? { background: "#f59e0b", boxShadow: "0 0 6px rgba(245,158,11,0.5)" }
                                : health === "red" ? { background: "#f87171", boxShadow: "0 0 6px rgba(248,113,113,0.5)" }
                                : { background: "rgba(100,116,139,0.3)" };
                              return <div className="w-2 h-2 rounded-full flex-shrink-0" style={dotStyle} />;
                            })()}
                            <div className="font-display font-semibold text-sm truncate" style={{ color: "#e2e8f0" }}>
                              {c.name}
                              {c.autopilotEnabled && (
                                <span
                                  className="ml-2 font-mono text-[9px] px-1.5 py-0.5 rounded align-middle"
                                  style={{ color: "#22d3ee", border: "1px solid rgba(34,211,238,0.45)", background: "rgba(34,211,238,0.12)" }}
                                >
                                  🤖 AUTO
                                </span>
                              )}
                            </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="tag-ops tag-teal text-[9px]">{(c.campaignGoal || "MULTI").toUpperCase()}</span>
                              <span className="font-mono text-[10px]" style={{ color: "#94a3b8" }}>
                                {c.totalAdsGenerated || 0} ads generated
                              </span>
                              {(() => {
                                const health = !c.totalAdsGenerated ? "gray"
                                  : c.currentQualityThreshold >= 8.0 ? "green"
                                  : c.currentQualityThreshold >= 7.0 ? "amber"
                                  : "red";
                                const cfg = health === "green"
                                  ? { label: "HEALTHY", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" }
                                  : health === "amber"
                                  ? { label: "MONITOR", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" }
                                  : health === "red"
                                  ? { label: "AT RISK", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }
                                  : { label: "NO DATA", color: "#94a3b8", bg: "transparent", border: "rgba(100,116,139,0.15)" };
                                return (
                                  <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded"
                                    style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                    {cfg.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-mono font-bold text-sm" style={{ color: "#22d3ee" }}>
                                {(c.currentQualityThreshold || 0).toFixed(1)}
                              </div>
                              <div className="font-mono text-[9px] tracking-wider" style={{ color: "#94a3b8" }}>THRESHOLD</div>
                            </div>
                            <ArrowRight size={13} style={{ color: "rgba(34,211,238,0.5)" }}
                              className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column — 2 cols */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick Actions */}
            <motion.div {...fadeUp(0.16)} className="ops-card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
                <span className="font-mono font-semibold text-[11px] tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                  Quick Actions
                </span>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { href: "/campaigns/new",  icon: Plus,      label: "New Campaign",   sub: "Launch pipeline",   color: "#22d3ee" },
                  { href: "/adversarial",    icon: Swords,    label: "Ad-versarial",   sub: "Battle mode",       color: "#f87171" },
                  { href: "/creative-spark", icon: Sparkles,  label: "Creative Spark", sub: "Ideation engine",   color: "#a78bfa" },
                  { href: "/performance",    icon: BarChart3, label: "Performance",    sub: "Analytics",         color: "#34d399" },
                ].map(a => (
                  <Link key={a.href} href={a.href}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/[0.025] group">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: a.color + "10", border: "1px solid " + a.color + "1a" }}>
                        <a.icon size={13} style={{ color: a.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-semibold text-xs" style={{ color: "#e2e8f0" }}>{a.label}</div>
                        <div className="font-mono text-[10px]" style={{ color: "#94a3b8" }}>{a.sub}</div>
                      </div>
                      <ArrowRight size={11} style={{ color: "#64748b" }}
                        className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div {...fadeUp(0.2)} className="ops-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
                <span className="font-mono font-semibold text-[11px] tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                  System Status
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Generation Engine", status: "Operational", icon: CheckCircle2, color: "#34d399" },
                  { label: "LLM Judge",          status: "Operational", icon: CheckCircle2, color: "#34d399" },
                  { label: "Quality Ratchet",    status: "Active",      icon: CheckCircle2, color: "#22d3ee" },
                  { label: "Self-Heal Loops",    status: "Monitoring",  icon: AlertCircle,  color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="font-mono text-[11px]" style={{ color: "rgba(148,163,184,0.6)" }}>{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <s.icon size={11} style={{ color: s.color }} />
                      <span className="font-mono text-[10px]" style={{ color: s.color, letterSpacing: "0.05em" }}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Log */}
            <motion.div {...fadeUp(0.24)} className="ops-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={12} style={{ color: "#22d3ee" }} />
                <span className="font-mono font-semibold text-[11px] tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                  Activity Log
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { ts: "Just now", msg: "Engine initialized",     type: "sys"  },
                  { ts: "2m ago",   msg: "Quality ratchet active", type: "pass" },
                  { ts: "5m ago",   msg: "System diagnostics OK",  type: "eval" },
                ].map((l, i) => (
                  <div key={i} className="log-entry">
                    <span className="log-ts">{l.ts}</span>
                    <span className={"log-type log-type-" + l.type}>{l.type.toUpperCase()}</span>
                    <span className="log-msg">{l.msg}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
