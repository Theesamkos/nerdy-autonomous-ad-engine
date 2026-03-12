import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { BarChart3, DollarSign, TrendingUp, Zap, Heart, Target, Award, RefreshCw, Activity, Download } from "lucide-react";
import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ReferenceLine
} from "recharts";

const TT = {
  contentStyle: {
    background: "rgba(2,11,24,0.97)",
    border: "1px solid rgba(34,211,238,0.15)",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10,
    color: "#e2e8f0",
    borderRadius: "6px",
  },
  cursor: { stroke: "rgba(34,211,238,0.15)" },
};

const DIM_COLORS: Record<string, string> = {
  clarity:           "#60a5fa",
  valueProp:         "#4ade80",
  cta:               "#22d3ee",
  brandVoice:        "#a78bfa",
  emotionalResonance:"#f87171",
};
const DIM_LABELS: Record<string, string> = {
  clarity:           "Clarity",
  valueProp:         "Value Prop",
  cta:               "CTA",
  brandVoice:        "Brand Voice",
  emotionalResonance:"Emotional Resonance",
};

export default function PerformanceTracker() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);

  const { data: campaign }         = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: analytics }        = trpc.ads.getCampaignAnalytics.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: ads }              = trpc.ads.list.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: selectedAdData }   = trpc.ads.get.useQuery({ id: selectedAdId! }, { enabled: !!selectedAdId });

  const qualityTrend   = analytics?.qualityTrend || [];
  const iterationLogs  = analytics?.iterationLogs || [];
  const avgScores      = analytics?.avgScores;

  const costQualityData = ads?.filter((a: any) => a.qualityScore && a.estimatedCostUsd > 0).map((a: any) => ({
    cost:    parseFloat(a.estimatedCostUsd.toFixed(6)),
    quality: a.qualityScore,
    id:      a.id,
  })) || [];

  const iterationData = iterationLogs.map((log: any) => ({
    iter:        log.iterationNumber,
    before:      log.scoreBefore || 0,
    after:       log.scoreAfter  || 0,
    improvement: log.improvement || 0,
    strategy:    log.strategyUsed || "unknown",
  }));

  const emotionalArc  = (selectedAdData?.evaluation?.emotionalArcData as any[]) || [];
  const approvedAds   = ads?.filter((a: any) => a.status === "approved") || [];

  const exportJSON = () => {
    if (!ads || ads.length === 0) { return; }
    const report = {
      exportedAt: new Date().toISOString(),
      campaign: {
        id: campaign?.id,
        name: campaign?.name,
        audienceSegment: campaign?.audienceSegment,
        product: campaign?.product,
        campaignGoal: campaign?.campaignGoal,
        currentQualityThreshold: campaign?.currentQualityThreshold,
        totalTokensUsed: campaign?.totalTokensUsed,
        totalCostUsd: campaign?.totalCostUsd,
      },
      summary: {
        totalAds: analytics?.totalAds || 0,
        approvedAds: analytics?.approvedAds || 0,
        rejectedAds: analytics?.rejectedAds || 0,
        approvalRate: analytics?.totalAds ? Math.round(((analytics.approvedAds || 0) / analytics.totalAds) * 100) : 0,
        averageScore: analytics?.avgScores ? Object.values(analytics.avgScores).reduce((s: number, v) => s + (v as number), 0) / 5 : 0,
        averageConfidence: ads.reduce((sum: number, a: any) => sum + (a.evaluation?.confidenceScore ?? 0.8), 0) / (ads.length || 1),
        totalIterationCycles: analytics?.iterationLogs?.length || 0,
        totalCostUsd: analytics?.totalCost || 0,
        costPerApprovedAd: analytics?.costPerApprovedAd || 0,
      },
      dimensionWeights: {
        clarity: campaign?.weightClarity,
        valueProp: campaign?.weightValueProp,
        cta: campaign?.weightCta,
        brandVoice: campaign?.weightBrandVoice,
        emotionalResonance: campaign?.weightEmotionalResonance,
      },
      ads: ads.map((a: any) => ({
        id: a.id,
        status: a.status,
        qualityScore: a.qualityScore,
        generationMode: a.generationMode,
        copy: {
          primaryText: a.primaryText,
          headline: a.headline,
          description: a.description,
          ctaButton: a.ctaButton,
        },
        evaluation: a.evaluation ? {
          scoreClarity: a.evaluation.scoreClarity,
          scoreValueProp: a.evaluation.scoreValueProp,
          scoreCta: a.evaluation.scoreCta,
          scoreBrandVoice: a.evaluation.scoreBrandVoice,
          scoreEmotionalResonance: a.evaluation.scoreEmotionalResonance,
          weightedScore: a.evaluation.weightedScore,
          confidenceScore: a.evaluation.confidenceScore ?? 0.8,
          weakestDimension: a.evaluation.weakestDimension,
          improvementSuggestion: a.evaluation.improvementSuggestion,
          rationale: {
            clarity: a.evaluation.rationaleClarity,
            valueProp: a.evaluation.rationaleValueProp,
            cta: a.evaluation.rationaleCta,
            brandVoice: a.evaluation.rationaleBrandVoice,
            emotionalResonance: a.evaluation.rationaleEmotionalResonance,
          },
        } : null,
        tokenUsage: {
          promptTokens: a.promptTokens,
          completionTokens: a.completionTokens,
          estimatedCostUsd: a.estimatedCostUsd,
        },
        createdAt: new Date(a.createdAt).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `${campaign?.name || "campaign"}-evaluation-report-${new Date().toISOString().slice(0, 10)}.json`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!ads || ads.length === 0) { return; }
    const headers = [
      "ID", "Status", "Score", "Mode", "Primary Text", "Headline", "Description",
      "CTA", "Clarity", "Value Prop", "CTA Score", "Brand Voice", "Emotional",
      "Cost (USD)", "Tokens", "Created At"
    ];
    const rows = ads.map((a: any) => [
      a.id,
      a.status,
      a.qualityScore?.toFixed(2) ?? "",
      a.generationMode,
      `"${(a.primaryText || "").replace(/"/g, "'")}"`,
      `"${(a.headline || "").replace(/"/g, "'")}"`,
      `"${(a.description || "").replace(/"/g, "'")}"`,
      a.ctaButton,
      a.evaluation?.scoreClarity?.toFixed(1) ?? "",
      a.evaluation?.scoreValueProp?.toFixed(1) ?? "",
      a.evaluation?.scoreCta?.toFixed(1) ?? "",
      a.evaluation?.scoreBrandVoice?.toFixed(1) ?? "",
      a.evaluation?.scoreEmotionalResonance?.toFixed(1) ?? "",
      a.estimatedCostUsd?.toFixed(6) ?? "0",
      (a.promptTokens || 0) + (a.completionTokens || 0),
      new Date(a.createdAt).toISOString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign?.name || "campaign"}-ads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4 mb-4">
            <Link href={"/campaigns/" + campaignId}>
              <button className="btn-secondary p-2.5 flex-shrink-0"><ArrowLeft size={14} /></button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="section-label mb-1.5">Performance Tracker</div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
                    Analytics & Intelligence
                  </h1>
                  <p className="font-mono text-[10px] mt-1.5 max-w-xl" style={{ color: "rgba(100,116,139,0.5)" }}>
                    Full-spectrum performance intelligence. Quality trends, cost efficiency, dimension breakdown, and emotional resonance arc.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={exportJSON}
                    disabled={!ads || ads.length === 0}
                    className="btn-secondary flex items-center gap-2 disabled:opacity-30"
                    title="Export full evaluation report as JSON">
                    <Download size={13} />
                    <span className="hidden sm:inline">Export JSON</span>
                  </button>
                  <button
                    onClick={exportCSV}
                    disabled={!ads || ads.length === 0}
                    className="btn-secondary flex items-center gap-2 disabled:opacity-30"
                    title="Export all ads to CSV">
                    <Download size={13} />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target,    label: "Total Ads",        value: analytics?.totalAds || 0,                                                                                    color: "#22d3ee" },
            { icon: Award,     label: "Approval Rate",    value: analytics?.totalAds ? Math.round((analytics.approvedAds / analytics.totalAds) * 100) + "%" : "0%",          color: "#34d399" },
            { icon: DollarSign,label: "Cost / Approved",  value: "$" + (analytics?.costPerApprovedAd || 0).toFixed(4),                                                        color: "#a78bfa" },
            { icon: TrendingUp,label: "Quality Threshold",value: (campaign?.currentQualityThreshold || 7.0).toFixed(1) + "/10",                                               color: "#60a5fa" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="ops-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={13} style={{ color }} />
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(100,116,139,0.5)" }}>{label}</span>
              </div>
              <div className="font-display font-bold text-2xl" style={{ color: "#f8fafc", letterSpacing: "-0.03em" }}>{value}</div>
            </div>
          ))}
        </motion.div>

        {/* Quality Trend */}
        {qualityTrend.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="ops-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={13} style={{ color: "#22d3ee" }} />
              <div className="section-label">Quality Trend & Ratchet</div>
              <div className="ml-auto font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.4)" }}>
                {qualityTrend.length} evaluations
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={qualityTrend}>
                <defs>
                  <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(34,211,238,0.05)" />
                <XAxis dataKey="index" tick={{ fill: "rgba(100,116,139,0.5)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <YAxis domain={[0, 10]} tick={{ fill: "rgba(100,116,139,0.5)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Tooltip {...TT} formatter={(val: number) => [val.toFixed(2), "Score"]} />
                <ReferenceLine y={campaign?.currentQualityThreshold || 7} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={1.5} fill="url(#qualGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Ratchet progress */}
            <div className="mt-5 rounded-lg p-4" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#34d399" }}>Quality Ratchet</span>
                <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>
                  {(campaign?.currentQualityThreshold || 7).toFixed(1)} / 9.5
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: (((campaign?.currentQualityThreshold || 7) - 7) / (9.5 - 7) * 100) + "%" }}
                  transition={{ duration: 1.2 }}
                  className="h-full rounded-full" style={{ background: "#34d399" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Cost vs Quality + Dimension Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {costQualityData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              className="ops-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign size={13} style={{ color: "#a78bfa" }} />
                <div className="section-label">Performance-per-Token</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(34,211,238,0.05)" />
                  <XAxis dataKey="cost"    name="Cost ($)"  tick={{ fill: "rgba(100,116,139,0.5)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                  <YAxis dataKey="quality" name="Quality" domain={[0, 10]} tick={{ fill: "rgba(100,116,139,0.5)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                  <ZAxis range={[30, 30]} />
                  <Tooltip {...TT} cursor={{ strokeDasharray: "3 3" }}
                    formatter={(val: number, name: string) => [name === "cost" ? "$" + val.toFixed(6) : val.toFixed(2), name === "cost" ? "Cost" : "Quality"]} />
                  <Scatter data={costQualityData} fill="#22d3ee" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {avgScores && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="ops-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Target size={13} style={{ color: "#60a5fa" }} />
                <div className="section-label">Avg Quality Profile</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={[
                  { dim: "Clarity",    score: avgScores.clarity },
                  { dim: "Value Prop", score: avgScores.valueProp },
                  { dim: "CTA",        score: avgScores.cta },
                  { dim: "Brand Voice",score: avgScores.brandVoice },
                  { dim: "Emotional",  score: avgScores.emotionalResonance },
                ]}>
                  <PolarGrid stroke="rgba(34,211,238,0.08)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                  <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {Object.entries(avgScores).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DIM_COLORS[key] || "rgba(100,116,139,0.4)" }} />
                    <span className="font-mono text-[10px] flex-1" style={{ color: "rgba(100,116,139,0.6)" }}>{DIM_LABELS[key] || key}</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: "#f8fafc" }}>{typeof val === "number" ? val.toFixed(2) : "—"}</span>
                    <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${((typeof val === "number" ? val : 0) / 10) * 100}%`, background: DIM_COLORS[key] || "#22d3ee" }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Emotional Resonance Visualizer */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="ops-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart size={13} style={{ color: "#f87171" }} />
            <div className="section-label">Emotional Resonance Visualizer</div>
          </div>

          {approvedAds.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap mb-5">
                {approvedAds.slice(0, 6).map((ad: any) => (
                  <button key={ad.id} onClick={() => setSelectedAdId(ad.id === selectedAdId ? null : ad.id)}
                    className="font-mono text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
                    style={{
                      background: selectedAdId === ad.id ? "rgba(248,113,113,0.08)" : "rgba(8,24,48,0.5)",
                      border: `1px solid ${selectedAdId === ad.id ? "rgba(248,113,113,0.3)" : "rgba(34,211,238,0.08)"}`,
                      color: selectedAdId === ad.id ? "#f87171" : "rgba(100,116,139,0.5)",
                    }}>
                    Ad #{ad.id}
                  </button>
                ))}
              </div>

              {selectedAdId && emotionalArc.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4" style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                      <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: "rgba(100,116,139,0.4)" }}>Intensity Arc</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={emotionalArc}>
                          <defs>
                            <linearGradient id="emotGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#f87171" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(34,211,238,0.04)" />
                          <XAxis dataKey="segment" tick={{ fill: "rgba(100,116,139,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <YAxis domain={[0, 10]} tick={{ fill: "rgba(100,116,139,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <Tooltip {...TT} formatter={(val: number) => [val.toFixed(1), "Intensity"]} />
                          <Area type="monotone" dataKey="intensity" stroke="#f87171" fill="url(#emotGrad)" strokeWidth={1.5} dot={{ fill: "#f87171", r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="rounded-lg p-4" style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                      <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: "rgba(100,116,139,0.4)" }}>Valence (-1 to +1)</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={emotionalArc}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(34,211,238,0.04)" />
                          <XAxis dataKey="segment" tick={{ fill: "rgba(100,116,139,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <YAxis domain={[-1, 1]} tick={{ fill: "rgba(100,116,139,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <Tooltip {...TT} formatter={(val: number) => [val.toFixed(2), "Valence"]} />
                          <Bar dataKey="valence" fill="#34d399" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {emotionalArc.map((seg: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: "rgba(2,11,24,0.5)", border: "1px solid rgba(34,211,238,0.04)" }}>
                        <div className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center font-mono text-[9px]"
                          style={{ border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[10px] italic leading-relaxed" style={{ color: "rgba(148,163,184,0.55)" }}>
                            "{seg.text}"
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>
                              Intensity: <span style={{ color: "#f87171" }}>{seg.intensity?.toFixed(1)}</span>
                            </span>
                            <span className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>
                              Valence: <span style={{ color: seg.valence > 0 ? "#34d399" : seg.valence < 0 ? "#f87171" : "rgba(100,116,139,0.5)" }}>
                                {seg.valence?.toFixed(2)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedAdId ? (
                <div className="flex items-center gap-3 py-10 justify-center">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "rgba(248,113,113,0.2)", borderTopColor: "#f87171" }} />
                  <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>Loading emotional arc...</span>
                </div>
              ) : (
                <div className="font-mono text-[10px] text-center py-10" style={{ color: "rgba(100,116,139,0.4)" }}>
                  Select an approved ad above to visualize its emotional journey.
                </div>
              )}
            </>
          ) : (
            <div className="font-mono text-[10px] text-center py-10" style={{ color: "rgba(100,116,139,0.4)" }}>
              Generate and approve ads to unlock emotional resonance analysis.
            </div>
          )}
        </motion.div>

        {/* Self-healing log */}
        {iterationData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            className="ops-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <RefreshCw size={13} style={{ color: "#34d399" }} />
              <div className="section-label">Self-Healing Loop History</div>
            </div>
            <div className="space-y-1">
              {iterationData.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg font-mono text-[10px]"
                  style={{ background: "rgba(2,11,24,0.5)", border: "1px solid rgba(34,211,238,0.04)" }}>
                  <span className="w-12 flex-shrink-0" style={{ color: "rgba(100,116,139,0.4)" }}>Iter {log.iter}</span>
                  <span className="flex-1 truncate" style={{ color: "rgba(100,116,139,0.5)" }}>{log.strategy}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ color: "#f87171" }}>{log.before.toFixed(1)}</span>
                    <span style={{ color: "rgba(100,116,139,0.3)" }}>→</span>
                    <span style={{ color: "#34d399" }}>{log.after.toFixed(1)}</span>
                    <span className="font-bold" style={{ color: log.improvement > 0 ? "#34d399" : "#f87171" }}>
                      {log.improvement > 0 ? "+" : ""}{log.improvement.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </AppLayout>
  );
}
