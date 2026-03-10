import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  BarChart3, DollarSign, TrendingUp, Zap, Brain, Heart,
  Target, Award, RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: {
    background: "oklch(0.13 0.014 260)",
    border: "1px solid oklch(0.25 0.015 260)",
    borderRadius: "8px",
    color: "oklch(0.96 0.005 260)",
    fontSize: "12px",
  },
};

export default function PerformanceTracker() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: analytics } = trpc.ads.getCampaignAnalytics.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: ads } = trpc.ads.list.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: selectedAdData } = trpc.ads.get.useQuery(
    { id: selectedAdId! },
    { enabled: !!selectedAdId }
  );

  const qualityTrend = analytics?.qualityTrend || [];
  const iterationLogs = analytics?.iterationLogs || [];
  const avgScores = analytics?.avgScores;

  // Cost vs quality scatter data
  const costQualityData = ads?.filter(a => a.qualityScore && a.estimatedCostUsd > 0).map(a => ({
    cost: parseFloat(a.estimatedCostUsd.toFixed(6)),
    quality: a.qualityScore,
    id: a.id,
    mode: a.generationMode,
  })) || [];

  // Iteration improvement data
  const iterationData = iterationLogs.map(log => ({
    iter: log.iterationNumber,
    before: log.scoreBefore || 0,
    after: log.scoreAfter || 0,
    improvement: log.improvement || 0,
    strategy: log.strategyUsed || "unknown",
  }));

  // Emotional arc data from selected ad
  const emotionalArc = (selectedAdData?.evaluation?.emotionalArcData as any[]) || [];

  const approvedAds = ads?.filter(a => a.status === "approved") || [];

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center" style={{ boxShadow: "0 0 20px oklch(0.72 0.2 55 / 0.3)" }}>
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Performance Tracker</h1>
            <p className="text-sm text-muted-foreground">Cost-quality analysis, iteration intelligence, and emotional resonance</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: Target, label: "Total Ads", value: analytics?.totalAds || 0,
              color: "text-primary", bg: "bg-primary/10 border-primary/20"
            },
            {
              icon: Award, label: "Approval Rate",
              value: analytics?.totalAds ? `${Math.round((analytics.approvedAds / analytics.totalAds) * 100)}%` : "0%",
              color: "text-green-400", bg: "bg-green-500/10 border-green-500/20"
            },
            {
              icon: DollarSign, label: "Cost / Approved Ad",
              value: `$${(analytics?.costPerApprovedAd || 0).toFixed(4)}`,
              color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20"
            },
            {
              icon: TrendingUp, label: "Quality Threshold",
              value: `${campaign?.currentQualityThreshold?.toFixed(1) || "7.0"}/10`,
              color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20"
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${bg} bg-card`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            </motion.div>
          ))}
        </div>

        {/* Quality Trend + Ratchet */}
        {qualityTrend.length > 0 && (
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Quality Trend & Ratchet</h2>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-primary" />
                  <span className="text-muted-foreground">Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-green-500" style={{ borderTop: "1px dashed" }} />
                  <span className="text-muted-foreground">Threshold</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={qualityTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 260)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 260)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.015 260)" />
                <XAxis dataKey="index" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                <Tooltip {...CUSTOM_TOOLTIP_STYLE} formatter={(val: number) => [val.toFixed(2), "Score"]} />
                <Area type="monotone" dataKey="score" stroke="oklch(0.65 0.22 260)" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: "oklch(0.65 0.22 260)", r: 3 }} />
                <Line type="monotone" dataKey={() => campaign?.currentQualityThreshold || 7} stroke="oklch(0.72 0.2 145)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Ratchet progress */}
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-green-400">Quality Ratchet Progress</div>
                <div className="text-xs text-muted-foreground">Current: {campaign?.currentQualityThreshold?.toFixed(1) || "7.0"} / Max: 9.5</div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((campaign?.currentQualityThreshold || 7) - 7) / (9.5 - 7) * 100}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-green-500"
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {campaign?.currentQualityThreshold === 7 ? "Generate more high-quality ads to raise the bar" : `Threshold raised ${((campaign?.currentQualityThreshold || 7) - 7).toFixed(2)} points above baseline`}
              </div>
            </div>
          </div>
        )}

        {/* Cost vs Quality */}
        {costQualityData.length > 0 && (
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h2 className="font-display font-semibold text-foreground mb-4">Performance-per-Token Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Cost vs Quality (each dot = one ad)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.015 260)" />
                    <XAxis dataKey="cost" name="Cost ($)" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} label={{ value: "Cost ($)", position: "insideBottom", offset: -5, fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                    <YAxis dataKey="quality" name="Quality" domain={[0, 10]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                    <ZAxis range={[40, 40]} />
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} formatter={(val: number, name: string) => [name === "cost" ? `$${val.toFixed(6)}` : val.toFixed(2), name === "cost" ? "Cost" : "Quality"]} />
                    <Scatter data={costQualityData} fill="oklch(0.65 0.22 260)" fillOpacity={0.8} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Quality distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={costQualityData.map((d, i) => ({ name: `Ad ${d.id}`, quality: d.quality }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.015 260)" />
                    <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 9 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} formatter={(val: number) => [val.toFixed(2), "Quality"]} />
                    <Bar dataKey="quality" fill="oklch(0.65 0.22 260)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Average Quality Profile */}
        {avgScores && (
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h2 className="font-display font-semibold text-foreground mb-4">Average Quality Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={[
                  { dim: "Clarity", score: avgScores.clarity },
                  { dim: "Value Prop", score: avgScores.valueProp },
                  { dim: "CTA", score: avgScores.cta },
                  { dim: "Brand Voice", score: avgScores.brandVoice },
                  { dim: "Emotional", score: avgScores.emotionalResonance },
                ]}>
                  <PolarGrid stroke="oklch(0.2 0.015 260)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="oklch(0.65 0.22 260)" fill="oklch(0.65 0.22 260)" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-3 self-center">
                {[
                  { key: "clarity", label: "Clarity", color: "oklch(0.65 0.22 260)" },
                  { key: "valueProp", label: "Value Prop", color: "oklch(0.72 0.2 145)" },
                  { key: "cta", label: "CTA", color: "oklch(0.72 0.2 55)" },
                  { key: "brandVoice", label: "Brand Voice", color: "oklch(0.6 0.25 295)" },
                  { key: "emotionalResonance", label: "Emotional Resonance", color: "oklch(0.65 0.25 340)" },
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-bold" style={{ color }}>{(avgScores[key as keyof typeof avgScores] as number).toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(avgScores[key as keyof typeof avgScores] as number) * 10}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emotional Resonance Visualizer */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-400" />
            <h2 className="font-display font-semibold text-foreground">Emotional Resonance Visualizer</h2>
          </div>

          {approvedAds.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {approvedAds.slice(0, 6).map(ad => (
                  <button
                    key={ad.id}
                    onClick={() => setSelectedAdId(ad.id === selectedAdId ? null : ad.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedAdId === ad.id
                        ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Ad #{ad.id}
                  </button>
                ))}
              </div>

              {selectedAdId && emotionalArc.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Intensity chart */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Emotional Intensity Arc</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={emotionalArc}>
                          <defs>
                            <linearGradient id="emotGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.65 0.25 340)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="oklch(0.65 0.25 340)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.015 260)" />
                          <XAxis dataKey="segment" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                          <YAxis domain={[0, 10]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                          <Tooltip {...CUSTOM_TOOLTIP_STYLE} formatter={(val: number) => [val.toFixed(1), "Intensity"]} />
                          <Area type="monotone" dataKey="intensity" stroke="oklch(0.65 0.25 340)" fill="url(#emotGrad)" strokeWidth={2} dot={{ fill: "oklch(0.65 0.25 340)", r: 4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Valence chart */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Emotional Valence (-1 negative → +1 positive)</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={emotionalArc}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.015 260)" />
                          <XAxis dataKey="segment" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                          <YAxis domain={[-1, 1]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                          <Tooltip {...CUSTOM_TOOLTIP_STYLE} formatter={(val: number) => [val.toFixed(2), "Valence"]} />
                          <Bar dataKey="valence" radius={[3, 3, 0, 0]}
                            fill="oklch(0.72 0.2 145)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Segment breakdown */}
                  <div className="mt-4 space-y-2">
                    {emotionalArc.map((seg: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-background/30">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-xs font-bold text-pink-400">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground italic">"{seg.text}"</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>Intensity: <span className="text-pink-400 font-mono">{seg.intensity.toFixed(1)}</span></span>
                            <span>Valence: <span className={`font-mono ${seg.valence > 0 ? "text-green-400" : seg.valence < 0 ? "text-red-400" : "text-muted-foreground"}`}>{seg.valence.toFixed(2)}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedAdId ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading emotional arc data...
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Select an approved ad above to visualize its emotional journey
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Generate and approve ads to unlock emotional resonance analysis
            </div>
          )}
        </div>

        {/* Self-healing log */}
        {iterationData.length > 0 && (
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <h2 className="font-display font-semibold text-foreground">Self-Healing Loop History</h2>
            </div>
            <div className="space-y-2">
              {iterationData.map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-background/30 border border-border/20 text-xs">
                  <div className="text-muted-foreground font-mono">Iter {log.iter}</div>
                  <div className="flex-1 text-muted-foreground">{log.strategy}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">{log.before.toFixed(1)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-green-400">{log.after.toFixed(1)}</span>
                    <span className={`font-bold ${log.improvement > 0 ? "text-green-400" : "text-red-400"}`}>
                      {log.improvement > 0 ? "+" : ""}{log.improvement.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
