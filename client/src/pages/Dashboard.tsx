import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, Clock, Flame, Plus,
  Sparkles, Swords, TrendingUp, Zap
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(34,211,238,0.2)", borderTopColor: "#22d3ee" }} />
            <span className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.6)", letterSpacing: "0.1em" }}>INITIALIZING...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="ops-card p-10 text-center max-w-md w-full">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <Brain size={24} style={{ color: "#22d3ee" }} />
            </div>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: "#f8fafc" }}>Access Required</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(148,163,184,0.6)" }}>Sign in to access the AdEngine mission control dashboard.</p>
            <a href={getLoginUrl()}>
              <button className="btn-primary flex items-center gap-2 mx-auto">
                <Zap size={14} />Request Access
              </button>
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalAds = campaigns?.reduce((sum, c) => sum + (c.totalAdsGenerated || 0), 0) ?? 0;
  const totalCost = campaigns?.reduce((sum, c) => sum + (c.totalCostUsd || 0), 0) ?? 0;
  const avgThreshold = campaigns && campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + (c.currentQualityThreshold || 0), 0) / campaigns.length
    : 0;

  const STATS = [
    { label: "Campaigns",     value: String(campaigns?.length ?? 0), icon: Zap,        color: "#22d3ee" },
    { label: "Ads Generated", value: String(totalAds),               icon: Brain,      color: "#a78bfa" },
    { label: "Avg Threshold", value: avgThreshold.toFixed(1),        icon: TrendingUp, color: "#34d399" },
    { label: "Total Spend",   value: "$" + totalCost.toFixed(3),     icon: Flame,      color: "#f59e0b" },
  ];

  const QUICK_ACTIONS = [
    { href: "/campaigns/new",  icon: Plus,      label: "New Campaign",   sub: "Launch a pipeline",   color: "#22d3ee" },
    { href: "/adversarial",    icon: Swords,    label: "Ad-versarial",   sub: "Battle competitors",  color: "#f87171" },
    { href: "/creative-spark", icon: Sparkles,  label: "Creative Spark", sub: "Generate wild ideas", color: "#a78bfa" },
    { href: "/performance",    icon: BarChart3, label: "Performance",    sub: "Analytics & costs",   color: "#34d399" },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="status-live">Mission Control</span>
              </div>
              <h1 className="display-md" style={{ color: "#f8fafc" }}>
                Welcome back,{" "}
                <span style={{ color: "#22d3ee" }}>{user?.name?.split(" ")[0] || "Operator"}</span>
              </h1>
              <p className="mt-1 text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
                Your autonomous ad generation system is online and ready.
              </p>
            </div>
            <Link href="/campaigns/new">
              <button className="btn-primary flex items-center gap-2">
                <Plus size={14} />New Campaign
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="ops-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono" style={{ fontSize: "0.6rem", color: "rgba(100,116,139,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.color + "10", border: "1px solid " + s.color + "20" }}>
                  <s.icon size={13} style={{ color: s.color }} />
                </div>
              </div>
              <div className="font-display font-bold" style={{ fontSize: "1.75rem", color: "#f8fafc", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Campaigns list */}
          <div className="lg:col-span-2">
            <div className="ops-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: "#22d3ee" }} />
                  <span className="font-mono font-semibold" style={{ fontSize: "0.7rem", color: "#e2e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>Active Campaigns</span>
                </div>
                <Link href="/campaigns/new">
                  <button className="btn-secondary flex items-center gap-1.5" style={{ fontSize: "0.65rem", padding: "0.3rem 0.75rem" }}>
                    <Plus size={11} />New
                  </button>
                </Link>
              </div>

              {!campaigns || campaigns.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}>
                    <Zap size={22} style={{ color: "rgba(34,211,238,0.4)" }} />
                  </div>
                  <p className="font-display font-semibold mb-1" style={{ color: "#e2e8f0" }}>No campaigns yet</p>
                  <p className="text-xs mb-5" style={{ color: "rgba(100,116,139,0.6)" }}>Launch your first autonomous generation pipeline</p>
                  <Link href="/campaigns/new">
                    <button className="btn-primary flex items-center gap-2 mx-auto text-sm">
                      <Plus size={13} />Create First Campaign
                    </button>
                  </Link>
                </div>
              ) : (
                <div>
                  {campaigns.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link href={"/campaigns/" + c.id}>
                        <div
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all hover:bg-white/[0.02] group"
                          style={{ borderBottom: "1px solid rgba(34,211,238,0.04)" }}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.14)" }}>
                            <Brain size={15} style={{ color: "#22d3ee" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-semibold text-sm truncate mb-0.5" style={{ color: "#e2e8f0" }}>{c.name}</div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono" style={{ fontSize: "0.6rem", color: "rgba(100,116,139,0.6)" }}>{(c.campaignGoal || "MULTI").toUpperCase()}</span>
                              <span className="font-mono" style={{ fontSize: "0.6rem", color: "rgba(100,116,139,0.5)" }}>{c.totalAdsGenerated || 0} ads</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-mono font-bold" style={{ fontSize: "0.85rem", color: "#22d3ee" }}>{(c.currentQualityThreshold || 0).toFixed(1)}</div>
                              <div className="font-mono" style={{ fontSize: "0.55rem", color: "rgba(100,116,139,0.5)", letterSpacing: "0.08em" }}>THRESHOLD</div>
                            </div>
                            <ArrowRight size={14} style={{ color: "rgba(34,211,238,0.3)" }} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="ops-card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
                <span className="font-mono font-semibold" style={{ fontSize: "0.7rem", color: "#e2e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick Actions</span>
              </div>
              <div className="p-3 space-y-1.5">
                {QUICK_ACTIONS.map(a => (
                  <Link key={a.href} href={a.href}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/[0.03]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.color + "10", border: "1px solid " + a.color + "20" }}>
                        <a.icon size={14} style={{ color: a.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-semibold text-xs" style={{ color: "#e2e8f0" }}>{a.label}</div>
                        <div className="font-mono" style={{ fontSize: "0.58rem", color: "rgba(100,116,139,0.6)" }}>{a.sub}</div>
                      </div>
                      <ArrowRight size={12} style={{ color: "rgba(100,116,139,0.4)" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="ops-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#34d399" }} />
                <span className="font-mono font-semibold" style={{ fontSize: "0.68rem", color: "#e2e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>System Status</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Generation Engine", status: "Operational", color: "#34d399" },
                  { label: "LLM Judge",          status: "Operational", color: "#34d399" },
                  { label: "Quality Ratchet",    status: "Active",      color: "#22d3ee" },
                  { label: "Self-Heal Loops",    status: "Monitoring",  color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="font-mono" style={{ fontSize: "0.65rem", color: "rgba(148,163,184,0.7)" }}>{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                      <span className="font-mono" style={{ fontSize: "0.6rem", color: s.color, letterSpacing: "0.06em" }}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ops-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: "#22d3ee" }} />
                <span className="font-mono font-semibold" style={{ fontSize: "0.68rem", color: "#e2e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>Activity Log</span>
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
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
