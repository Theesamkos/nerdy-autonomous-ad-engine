import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Brain, CheckCircle, XCircle, RefreshCw, Swords, Sparkles,
  BarChart3, ChevronDown, ChevronUp, Target, DollarSign, Award,
  SlidersHorizontal, Save, ArrowRight, Copy, Check, ArrowLeft
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from "recharts";

const DIM_COLORS: Record<string, string> = {
  clarity: "#60a5fa",
  valueProp: "#4ade80",
  cta: "#c8a84b",
  brandVoice: "#a78bfa",
  emotionalResonance: "#f87171",
};
const DIM_LABELS: Record<string, string> = {
  clarity: "Clarity",
  valueProp: "Value Prop",
  cta: "CTA",
  brandVoice: "Brand Voice",
  emotionalResonance: "Emotional",
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  const color = score >= 8 ? "#4ade80" : score >= 7 ? "#c8a84b" : "#f87171";
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111" strokeWidth="3" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="butt" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="font-mono font-black text-white" style={{ fontSize: size * 0.22 }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function AdCard({ ad, evaluation, isExpanded, onToggle }: { ad: any; evaluation: any; isExpanded: boolean; onToggle: () => void }) {
  const radarData = evaluation ? [
    { dim: "Clarity", score: evaluation.scoreClarity },
    { dim: "Value Prop", score: evaluation.scoreValueProp },
    { dim: "CTA", score: evaluation.scoreCta },
    { dim: "Brand Voice", score: evaluation.scoreBrandVoice },
    { dim: "Emotional", score: evaluation.scoreEmotionalResonance },
  ] : [];

  const modeColors: Record<string, string> = {
    creative_spark: "#22d3ee",
    adversarial: "#f472b6",
    self_healing: "#fb923c",
    standard: "#c8a84b",
  };
  const modeColor = modeColors[ad.generationMode] || "#c8a84b";

  return (
    <motion.div layout className={`border transition-all overflow-hidden ${
      ad.isPublishable ? "border-[#4ade80]/20 bg-[#4ade80]/02" : "border-[#1a1a1a] bg-[#060606]"
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              {ad.isPublishable
                ? <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                : <XCircle className="w-4 h-4 text-[#333]" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-[9px] text-[#383838]">#{ad.id}</span>
                <span
                  className="font-mono text-[8px] px-2 py-0.5 uppercase tracking-wider"
                  style={{ color: modeColor, border: `1px solid ${modeColor}25`, background: `${modeColor}08` }}
                >
                  {ad.generationMode.replace("_", " ")}
                </span>
                {ad.iterationNumber > 1 && (
                  <span className="font-mono text-[9px] text-[#383838]">iter {ad.iterationNumber}</span>
                )}
              </div>
              {/* Ad preview */}
              <div className="border border-[#111] p-3 bg-black">
                <p className="text-sm text-[#ccc] leading-relaxed mb-2">{ad.primaryText}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{ad.headline}</span>
                  <span
                    className="font-mono text-[9px] px-2 py-1 uppercase tracking-wider"
                    style={{ color: "#c8a84b", border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.06)" }}
                  >
                    {ad.ctaButton}
                  </span>
                </div>
                {ad.description && (
                  <p className="font-mono text-[10px] text-[#444] mt-1.5">{ad.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {evaluation && <ScoreRing score={evaluation.weightedScore} size={52} />}
            <button onClick={onToggle} className="text-[#333] hover:text-[#c8a84b] transition-colors p-1">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && evaluation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#111] overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="section-label mb-3">Quality Radar</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1a1a1a" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: "#444", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <Radar dataKey="score" stroke="#c8a84b" fill="#c8a84b" fillOpacity={0.12} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="section-label mb-3">Dimension Scores</div>
                {[
                  { key: "clarity", score: evaluation.scoreClarity, rationale: evaluation.rationaleClarity },
                  { key: "valueProp", score: evaluation.scoreValueProp, rationale: evaluation.rationaleValueProp },
                  { key: "cta", score: evaluation.scoreCta, rationale: evaluation.rationaleCta },
                  { key: "brandVoice", score: evaluation.scoreBrandVoice, rationale: evaluation.rationaleBrandVoice },
                  { key: "emotionalResonance", score: evaluation.scoreEmotionalResonance, rationale: evaluation.rationaleEmotionalResonance },
                ].map(({ key, score, rationale }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] text-[#555]">{DIM_LABELS[key]}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: DIM_COLORS[key] }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="bar-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full"
                        style={{ background: DIM_COLORS[key] }}
                      />
                    </div>
                    {rationale && (
                      <p className="font-mono text-[9px] text-[#383838] mt-1 leading-relaxed">{rationale}</p>
                    )}
                  </div>
                ))}
              </div>

              {evaluation.improvementSuggestion && (
                <div className="md:col-span-2 border border-[#c8a84b]/15 p-3 bg-[#c8a84b]/03">
                  <div className="section-label mb-1" style={{ color: "#c8a84b" }}>Improvement Suggestion</div>
                  <p className="font-mono text-[10px] text-[#555]">{evaluation.improvementSuggestion}</p>
                </div>
              )}

              <div className="md:col-span-2 flex items-center gap-4">
                <span className="font-mono text-[9px] text-[#2a2a2a]">Tokens: {ad.promptTokens + ad.completionTokens}</span>
                <span className="font-mono text-[9px] text-[#2a2a2a]">Cost: ${ad.estimatedCostUsd.toFixed(6)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AdCardWrapper({ ad, isExpanded, onToggle }: { ad: any; isExpanded: boolean; onToggle: () => void }) {
  const { data } = trpc.ads.get.useQuery({ id: ad.id }, { enabled: isExpanded });
  return <AdCard ad={ad} evaluation={data?.evaluation || null} isExpanded={isExpanded} onToggle={onToggle} />;
}

const LOG_STEPS = [
  { type: "sys",  msg: "Initializing generation pipeline..." },
  { type: "sys",  msg: "Loading brand context and campaign brief..." },
  { type: "ai",   msg: "Crafting ad copy with LLM..." },
  { type: "eval", msg: "Evaluating 5 quality dimensions..." },
  { type: "eval", msg: "Checking against quality threshold..." },
  { type: "heal", msg: "Running self-healing loop if needed..." },
  { type: "pass", msg: "Finalizing best candidate..." },
];

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [expandedAdId, setExpandedAdId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logStep, setLogStep] = useState(0);
  const [maxIterations, setMaxIterations] = useState(3);
  const [showWeightTuner, setShowWeightTuner] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyAd = useCallback((ad: any) => {
    const text = [ad.headline, "", ad.primaryText, ad.description, "", ad.ctaButton].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(ad.id);
      toast.success("Ad copy copied.");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: ads, refetch: refetchAds } = trpc.ads.list.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: analytics, refetch: refetchAnalytics } = trpc.ads.getCampaignAnalytics.useQuery({ campaignId }, { enabled: !!campaignId });

  const [weights, setWeights] = useState({
    weightClarity: 20,
    weightValueProp: 25,
    weightCta: 20,
    weightBrandVoice: 15,
    weightEmotionalResonance: 20,
  });

  useEffect(() => {
    if (campaign) {
      setWeights({
        weightClarity: campaign.weightClarity,
        weightValueProp: campaign.weightValueProp,
        weightCta: campaign.weightCta,
        weightBrandVoice: campaign.weightBrandVoice,
        weightEmotionalResonance: campaign.weightEmotionalResonance,
      });
    }
  }, [campaign?.id]);

  const weightTotal = useMemo(() => Object.values(weights).reduce((s, v) => s + v, 0), [weights]);

  const updateWeightsMutation = trpc.campaigns.updateWeights.useMutation({
    onSuccess: () => { toast.success("Dimension weights updated."); setShowWeightTuner(false); },
    onError: (err) => toast.error(err.message),
  });

  const generateMutation = trpc.ads.generateAndEvaluate.useMutation({
    onSuccess: (result) => {
      setIsGenerating(false);
      setLogStep(0);
      refetchAds();
      refetchAnalytics();
      if (result.isPublishable) {
        toast.success(`Ad approved. Score: ${result.bestScore.toFixed(1)}/10 in ${result.totalIterations} iteration(s)`);
      } else {
        toast.warning(`Below threshold. Best score: ${result.bestScore.toFixed(1)}/10`);
      }
      if (result.qualityRatchetApplied) {
        toast.info("Quality threshold raised — the bar just got higher.");
      }
    },
    onError: (err) => { setIsGenerating(false); setLogStep(0); toast.error(err.message); },
  });

  const handleGenerate = (mode: "standard" | "creative_spark" = "standard") => {
    setIsGenerating(true);
    setLogStep(0);
    LOG_STEPS.forEach((_, i) => {
      setTimeout(() => setLogStep(i + 1), i * 1800);
    });
    generateMutation.mutate({ campaignId, mode, maxIterations });
  };

  const WEIGHT_DIMS = [
    { key: "weightClarity" as const, label: "Clarity", color: "#60a5fa" },
    { key: "weightValueProp" as const, label: "Value Prop", color: "#4ade80" },
    { key: "weightCta" as const, label: "CTA", color: "#c8a84b" },
    { key: "weightBrandVoice" as const, label: "Brand Voice", color: "#a78bfa" },
    { key: "weightEmotionalResonance" as const, label: "Emotional", color: "#f87171" },
  ];

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border border-[#c8a84b]/30 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#c8a84b] animate-pulse" />
            </div>
            <div className="font-mono text-[10px] text-[#383838] tracking-widest uppercase">Loading Campaign</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const qualityTrend = analytics?.qualityTrend || [];
  const avgScores = analytics?.avgScores;

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign.name}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <Link href="/dashboard">
              <button className="btn-ops btn-ops-ghost px-3 py-2"><ArrowLeft className="w-3 h-3" /></button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="section-label mb-1">Campaign</div>
              <h1 className="text-2xl font-black text-white tracking-tight truncate">{campaign.name}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Link href={`/campaigns/${campaignId}/adversarial`}>
                <button className="btn-ops btn-ops-ghost text-xs px-3 py-2"><Swords className="w-3 h-3" /> Adversarial</button>
              </Link>
              <Link href={`/campaigns/${campaignId}/spark`}>
                <button className="btn-ops btn-ops-ghost text-xs px-3 py-2"><Sparkles className="w-3 h-3" /> Spark</button>
              </Link>
              <Link href={`/campaigns/${campaignId}/performance`}>
                <button className="btn-ops btn-ops-ghost text-xs px-3 py-2"><BarChart3 className="w-3 h-3" /> Analytics</button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-px bg-[#0f0f0f]">
            {[
              { label: "Goal", value: campaign.campaignGoal },
              { label: "Tone", value: campaign.tone },
              { label: "Threshold", value: campaign.currentQualityThreshold.toFixed(1) + "/10" },
              { label: "Total Ads", value: campaign.totalAdsGenerated },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#060606] px-4 py-3">
                <div className="section-label mb-1">{label}</div>
                <div className="font-mono text-xs font-bold text-white capitalize">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#0f0f0f] border border-[#0f0f0f]">
          {[
            { icon: Target, label: "Total Ads", value: analytics?.totalAds || 0, color: "#c8a84b" },
            { icon: CheckCircle, label: "Approved", value: analytics?.approvedAds || 0, color: "#4ade80" },
            { icon: Award, label: "Threshold", value: `${campaign.currentQualityThreshold.toFixed(1)}/10`, color: "#60a5fa" },
            { icon: DollarSign, label: "Total Cost", value: `$${(analytics?.totalCost || 0).toFixed(4)}`, color: "#a78bfa" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#060606] px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3 h-3" style={{ color }} />
                <div className="section-label">{label}</div>
              </div>
              <div className="font-mono text-xl font-black text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Dimension Weight Tuner */}
        <div className="border border-[#111] overflow-hidden">
          <button
            onClick={() => setShowWeightTuner(!showWeightTuner)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0a0a0a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c8a84b]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">Quality Dimension Weights</span>
              <span className={`font-mono text-[9px] px-2 py-0.5 ${weightTotal === 100 ? "text-[#4ade80] bg-[#4ade80]/08" : "text-[#f87171] bg-[#f87171]/08"}`}>
                {weightTotal}/100
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-3">
                {WEIGHT_DIMS.map(d => (
                  <div key={d.key} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5" style={{ background: d.color }} />
                    <span className="font-mono text-[9px] text-[#444]">{weights[d.key]}%</span>
                  </div>
                ))}
              </div>
              {showWeightTuner ? <ChevronUp className="w-3.5 h-3.5 text-[#333]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#333]" />}
            </div>
          </button>

          <AnimatePresence>
            {showWeightTuner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[#0f0f0f]"
              >
                <div className="px-5 py-5 space-y-4">
                  <p className="font-mono text-[9px] text-[#383838]">
                    Adjust how much each quality dimension contributes to the overall score. Weights must sum to 100.
                  </p>
                  {WEIGHT_DIMS.map(({ key, label, color }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2" style={{ background: color }} />
                          <span className="font-mono text-[10px] text-[#888]">{label}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold" style={{ color }}>{weights[key]}%</span>
                      </div>
                      <input
                        type="range" min={0} max={60} value={weights[key]}
                        onChange={e => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                        className="w-full h-0.5 appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, ${color} ${(weights[key] / 60) * 100}%, #1a1a1a ${(weights[key] / 60) * 100}%)` }}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className={`font-mono text-[10px] ${weightTotal === 100 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                      Total: {weightTotal}/100
                    </span>
                    <button
                      onClick={() => {
                        if (weightTotal !== 100) { toast.error(`Weights must sum to 100 (currently ${weightTotal})`); return; }
                        updateWeightsMutation.mutate({ campaignId, ...weights });
                      }}
                      disabled={weightTotal !== 100 || updateWeightsMutation.isPending}
                      className="btn-ops btn-ops-primary text-xs px-4 py-2 disabled:opacity-30"
                    >
                      {updateWeightsMutation.isPending
                        ? <><div className="w-2.5 h-2.5 border border-[#c8a84b]/30 border-t-[#c8a84b] rounded-full animate-spin" /> Saving...</>
                        : <><Save className="w-3 h-3" /> Save Weights</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generation Panel */}
        <div className="border border-[#111] bg-[#060606]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f0f0f]">
            <div>
              <div className="section-label mb-1">Generation Engine</div>
              <div className="font-mono text-[10px] text-[#383838]">
                Autonomous pipeline: generate → evaluate → self-heal → approve
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-[#383838]">Max iter:</span>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setMaxIterations(n)}
                  className={`w-7 h-7 font-mono text-[10px] font-bold transition-all ${
                    maxIterations === n
                      ? "bg-[#c8a84b]/10 text-[#c8a84b] border border-[#c8a84b]/30"
                      : "text-[#333] border border-[#111] hover:border-[#222] hover:text-[#555]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {isGenerating ? (
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot" style={{ background: "#f87171" }} />
                  <div className="terminal-dot" style={{ background: "#c8a84b" }} />
                  <div className="terminal-dot" style={{ background: "#4ade80" }} />
                  <span className="font-mono text-[9px] text-[#383838] ml-2">adengine — generation pipeline</span>
                </div>
                {LOG_STEPS.slice(0, logStep).map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="log-entry"
                  >
                    <span className="log-ts">{String(i).padStart(2, "0")}:{String(i * 18).padStart(2, "0")}</span>
                    <span className={`log-type log-type-${entry.type}`}>{entry.type.toUpperCase()}</span>
                    <span className="log-msg">{entry.msg}</span>
                  </motion.div>
                ))}
                {logStep < LOG_STEPS.length && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="log-ts">--:--</span>
                    <span className="cursor-blink" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => handleGenerate("standard")} className="btn-ops btn-ops-primary flex-1 min-w-[140px] justify-center">
                  <Zap className="w-3 h-3" /> Generate Ad
                </button>
                <button onClick={() => handleGenerate("creative_spark")} className="btn-ops btn-ops-outline flex-1 min-w-[140px] justify-center">
                  <Sparkles className="w-3 h-3" /> Creative Mode
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quality Trend */}
        {qualityTrend.length > 1 && (
          <div className="border border-[#111] bg-[#060606] p-5">
            <div className="section-label mb-4">Quality Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" />
                <XAxis dataKey="index" tick={{ fill: "#333", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis domain={[0, 10]} tick={{ fill: "#333", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  contentStyle={{ background: "#060606", border: "1px solid #1a1a1a", color: "#888", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  formatter={(val: number) => [val.toFixed(2), "Score"]}
                />
                <ReferenceLine y={campaign.currentQualityThreshold} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={1} />
                <Line type="monotone" dataKey="score" stroke="#c8a84b" strokeWidth={2} dot={{ fill: "#c8a84b", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-[#c8a84b]" />
                <span className="font-mono text-[9px] text-[#383838]">Quality Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-[#4ade80]" style={{ borderTop: "1px dashed #4ade80" }} />
                <span className="font-mono text-[9px] text-[#383838]">Threshold</span>
              </div>
            </div>
          </div>
        )}

        {/* Avg Scores */}
        {avgScores && (
          <div className="border border-[#111] bg-[#060606] p-5">
            <div className="section-label mb-4">Average Quality Profile</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={[
                  { dim: "Clarity", score: avgScores.clarity },
                  { dim: "Value Prop", score: avgScores.valueProp },
                  { dim: "CTA", score: avgScores.cta },
                  { dim: "Brand Voice", score: avgScores.brandVoice },
                  { dim: "Emotional", score: avgScores.emotionalResonance },
                ]}>
                  <PolarGrid stroke="#1a1a1a" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#444", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <Radar dataKey="score" stroke="#c8a84b" fill="#c8a84b" fillOpacity={0.12} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {Object.entries(avgScores).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[9px] text-[#555]">{DIM_LABELS[key]}</span>
                      <span className="font-mono text-[9px] font-bold" style={{ color: DIM_COLORS[key] }}>{(val as number).toFixed(1)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="h-full" style={{ width: `${(val as number) * 10}%`, background: DIM_COLORS[key] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ads List */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="section-label">Generated Ads</div>
            <div className="flex-1 h-px bg-[#0f0f0f]" />
            <div className="font-mono text-[9px] text-[#2a2a2a]">{ads?.length || 0} TOTAL &nbsp;·&nbsp; {ads?.filter((a: any) => a.status === 'approved').length || 0} APPROVED</div>
          </div>

          {ads && ads.length > 0 ? (
            <div className="space-y-px">
              {ads.map(ad => (
                <AdCardWrapper
                  key={ad.id}
                  ad={ad}
                  isExpanded={expandedAdId === ad.id}
                  onToggle={() => setExpandedAdId(expandedAdId === ad.id ? null : ad.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bracket border border-dashed border-[#1a1a1a] p-12 text-center">
              <Zap className="w-6 h-6 text-[#2a2a2a] mx-auto mb-4" />
              <div className="section-label mb-2 text-center">No Ads Generated</div>
              <p className="font-mono text-[10px] text-[#383838]">Use the generation engine above to create your first ad.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
