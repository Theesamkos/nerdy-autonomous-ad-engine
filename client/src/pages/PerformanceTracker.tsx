import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { BarChart3, DollarSign, TrendingUp, Zap, Heart, Target, Award, RefreshCw, Activity } from "lucide-react";
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
    background: "#060606",
    border: "1px solid #1a1a1a",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10,
    color: "#888",
    borderRadius: 0,
  },
  cursor: { stroke: "#1a1a1a" },
};

const DIM_COLORS: Record<string, string> = {
  clarity: "#c8a84b",
  valueProp: "#60a5fa",
  cta: "#4ade80",
  brandVoice: "#a78bfa",
  emotionalResonance: "#f97316",
};
const DIM_LABELS: Record<string, string> = {
  clarity: "Clarity",
  valueProp: "Value Prop",
  cta: "CTA",
  brandVoice: "Brand Voice",
  emotionalResonance: "Emotional Resonance",
};

export default function PerformanceTracker() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: analytics } = trpc.ads.getCampaignAnalytics.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: ads } = trpc.ads.list.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: selectedAdData } = trpc.ads.get.useQuery({ id: selectedAdId! }, { enabled: !!selectedAdId });

  const qualityTrend = analytics?.qualityTrend || [];
  const iterationLogs = analytics?.iterationLogs || [];
  const avgScores = analytics?.avgScores;

  const costQualityData = ads?.filter((a: any) => a.qualityScore && a.estimatedCostUsd > 0).map((a: any) => ({
    cost: parseFloat(a.estimatedCostUsd.toFixed(6)),
    quality: a.qualityScore,
    id: a.id,
  })) || [];

  const iterationData = iterationLogs.map((log: any) => ({
    iter: log.iterationNumber,
    before: log.scoreBefore || 0,
    after: log.scoreAfter || 0,
    improvement: log.improvement || 0,
    strategy: log.strategyUsed || "unknown",
  }));

  const emotionalArc = (selectedAdData?.evaluation?.emotionalArcData as any[]) || [];
  const approvedAds = ads?.filter((a: any) => a.status === "approved") || [];

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Link href={"/campaigns/" + campaignId}>
              <button className="btn-ops btn-ops-ghost px-3 py-2 text-xs">
                <ArrowLeft className="w-3 h-3" />
              </button>
            </Link>
            <div>
              <div className="section-label mb-1">Performance Tracker</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Analytics & Intelligence</h1>
            </div>
          </div>
          <p className="font-mono text-[10px] text-[#383838] max-w-xl">
            Full-spectrum performance intelligence. Quality trends, cost efficiency, dimension breakdown, and emotional resonance arc.
          </p>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Target, label: "Total Ads", value: analytics?.totalAds || 0, color: "#c8a84b" },
            { icon: Award, label: "Approval Rate", value: analytics?.totalAds ? Math.round((analytics.approvedAds / analytics.totalAds) * 100) + "%" : "0%", color: "#4ade80" },
            { icon: DollarSign, label: "Cost / Approved", value: "$" + (analytics?.costPerApprovedAd || 0).toFixed(4), color: "#a78bfa" },
            { icon: TrendingUp, label: "Quality Threshold", value: (campaign?.currentQualityThreshold || 7.0).toFixed(1) + "/10", color: "#60a5fa" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[rgba(8,24,48,0.6)] px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3 h-3" style={{ color }} />
                <div className="section-label">{label}</div>
              </div>
              <div className="font-mono text-xl font-black text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Quality Trend */}
        {qualityTrend.length > 0 && (
          <div className="border border-[#1a1a1a] bg-[rgba(8,24,48,0.6)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-3 h-3 text-[#c8a84b]" />
              <div className="section-label">Quality Trend & Ratchet</div>
              <div className="ml-auto font-mono text-[9px] text-[#383838]">{qualityTrend.length} evaluations</div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={qualityTrend}>
                <defs>
                  <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8a84b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#c8a84b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#111" />
                <XAxis dataKey="index" tick={{ fill: "#333", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <YAxis domain={[0, 10]} tick={{ fill: "#333", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Tooltip {...TT} formatter={(val: number) => [val.toFixed(2), "Score"]} />
                <ReferenceLine y={campaign?.currentQualityThreshold || 7} stroke="#c8a84b" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Area type="monotone" dataKey="score" stroke="#c8a84b" strokeWidth={1.5} fill="url(#qualGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            {/* Ratchet bar */}
            <div className="mt-4 p-3 border border-[#4ade80]/10 bg-[#4ade80]/03">
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[9px] text-[#4ade80] uppercase tracking-widest">Quality Ratchet</div>
                <div className="font-mono text-[9px] text-[#383838]">
                  {(campaign?.currentQualityThreshold || 7).toFixed(1)} / 9.5
                </div>
              </div>
              <div className="h-1 bg-[#111] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: (((campaign?.currentQualityThreshold || 7) - 7) / (9.5 - 7) * 100) + "%" }}
                  transition={{ duration: 1.2 }}
                  className="h-full bg-[#4ade80]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cost vs Quality + Dimension Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* Cost vs Quality */}
          {costQualityData.length > 0 && (
            <div className="bg-[rgba(8,24,48,0.6)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-3 h-3 text-[#a78bfa]" />
                <div className="section-label">Performance-per-Token</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="2 4" stroke="#111" />
                  <XAxis dataKey="cost" name="Cost ($)" tick={{ fill: "#333", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                  <YAxis dataKey="quality" name="Quality" domain={[0, 10]} tick={{ fill: "#333", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                  <ZAxis range={[30, 30]} />
                  <Tooltip {...TT} cursor={{ strokeDasharray: "3 3" }} formatter={(val: number, name: string) => [name === "cost" ? "$" + val.toFixed(6) : val.toFixed(2), name === "cost" ? "Cost" : "Quality"]} />
                  <Scatter data={costQualityData} fill="#c8a84b" fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Dimension Radar */}
          {avgScores && (
            <div className="bg-[rgba(8,24,48,0.6)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-3 h-3 text-[#60a5fa]" />
                <div className="section-label">Avg Quality Profile</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={[
                  { dim: "Clarity", score: avgScores.clarity },
                  { dim: "Value Prop", score: avgScores.valueProp },
                  { dim: "CTA", score: avgScores.cta },
                  { dim: "Brand Voice", score: avgScores.brandVoice },
                  { dim: "Emotional", score: avgScores.emotionalResonance },
                ]}>
                  <PolarGrid stroke="#1a1a1a" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#444", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                  <Radar dataKey="score" stroke="#c8a84b" fill="#c8a84b" fillOpacity={0.1} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {Object.entries(avgScores).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: DIM_COLORS[key] || "#555" }} />
                    <div className="font-mono text-[9px] text-[#555] flex-1">{DIM_LABELS[key] || key}</div>
                    <div className="font-mono text-[9px] font-bold text-white">{typeof val === "number" ? val.toFixed(2) : "—"}</div>
                    <div className="w-14 h-0.5 bg-[#111]">
                      <div className="h-full" style={{ width: (((typeof val === "number" ? val : 0) / 10) * 100) + "%", background: DIM_COLORS[key] || "#555" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emotional Resonance Visualizer */}
        <div className="border border-[#1a1a1a] bg-[rgba(8,24,48,0.6)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-3 h-3 text-[#f97316]" />
            <div className="section-label">Emotional Resonance Visualizer</div>
          </div>

          {approvedAds.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {approvedAds.slice(0, 6).map((ad: any) => (
                  <button key={ad.id} onClick={() => setSelectedAdId(ad.id === selectedAdId ? null : ad.id)}
                    className={"font-mono text-[9px] px-3 py-1.5 border uppercase tracking-wider transition-all " + (selectedAdId === ad.id ? "border-[#f97316]/40 text-[#f97316] bg-[#f97316]/05" : "border-[#1a1a1a] text-[#555] hover:border-[#333]")}>
                    Ad #{ad.id}
                  </button>
                ))}
              </div>

              {selectedAdId && emotionalArc.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[rgba(2,11,24,0.8)] p-4">
                      <div className="font-mono text-[8px] text-[#383838] mb-3 uppercase tracking-widest">Intensity Arc</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={emotionalArc}>
                          <defs>
                            <linearGradient id="emotGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0f0f0f" />
                          <XAxis dataKey="segment" tick={{ fill: "#333", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <YAxis domain={[0, 10]} tick={{ fill: "#333", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <Tooltip {...TT} formatter={(val: number) => [val.toFixed(1), "Intensity"]} />
                          <Area type="monotone" dataKey="intensity" stroke="#f97316" fill="url(#emotGrad)" strokeWidth={1.5} dot={{ fill: "#f97316", r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-[rgba(2,11,24,0.8)] p-4">
                      <div className="font-mono text-[8px] text-[#383838] mb-3 uppercase tracking-widest">Valence (-1 to +1)</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={emotionalArc}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0f0f0f" />
                          <XAxis dataKey="segment" tick={{ fill: "#333", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <YAxis domain={[-1, 1]} tick={{ fill: "#333", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                          <Tooltip {...TT} formatter={(val: number) => [val.toFixed(2), "Valence"]} />
                          <Bar dataKey="valence" fill="#4ade80" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-px">
                    {emotionalArc.map((seg: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[rgba(2,11,24,0.8)] border-b border-[#0f0f0f]">
                        <div className="flex-shrink-0 w-5 h-5 border border-[#f97316]/30 flex items-center justify-center font-mono text-[8px] text-[#f97316]">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[9px] text-[#555] italic leading-relaxed">"{seg.text}"</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-mono text-[8px] text-[#333]">Intensity: <span className="text-[#f97316]">{seg.intensity?.toFixed(1)}</span></span>
                            <span className="font-mono text-[8px] text-[#333]">Valence: <span className={seg.valence > 0 ? "text-[#4ade80]" : seg.valence < 0 ? "text-[#f87171]" : "text-[#555]"}>{seg.valence?.toFixed(2)}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedAdId ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <div className="w-3 h-3 border border-[#f97316]/30 border-t-[#f97316] rounded-full animate-spin" />
                  <span className="font-mono text-[10px] text-[#555]">Loading emotional arc...</span>
                </div>
              ) : (
                <div className="font-mono text-[10px] text-[#383838] text-center py-8">
                  Select an approved ad above to visualize its emotional journey.
                </div>
              )}
            </>
          ) : (
            <div className="font-mono text-[10px] text-[#383838] text-center py-8">
              Generate and approve ads to unlock emotional resonance analysis.
            </div>
          )}
        </div>

        {/* Self-healing log */}
        {iterationData.length > 0 && (
          <div className="border border-[#1a1a1a] bg-[rgba(8,24,48,0.6)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-3 h-3 text-[#4ade80]" />
              <div className="section-label">Self-Healing Loop History</div>
            </div>
            <div className="space-y-px">
              {iterationData.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-[rgba(2,11,24,0.8)] border-b border-[#0f0f0f] font-mono text-[9px]">
                  <div className="text-[#383838] w-12">Iter {log.iter}</div>
                  <div className="flex-1 text-[#383838] truncate">{log.strategy}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#f87171]">{log.before.toFixed(1)}</span>
                    <span className="text-[#333]">{"->"}</span>
                    <span className="text-[#4ade80]">{log.after.toFixed(1)}</span>
                    <span className={"font-bold " + (log.improvement > 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
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
