import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, CheckCircle2, XCircle, Swords, Sparkles,
  BarChart3, ChevronDown, ChevronUp, Target, DollarSign, Award,
  SlidersHorizontal, Save, ArrowLeft, Copy, Check, Activity, Smartphone, Layers, Trophy
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from "recharts";
import AdPreviewMockup from "@/components/AdPreviewMockup";

const DIM_COLORS: Record<string, string> = {
  clarity: "#60a5fa",
  valueProp: "#4ade80",
  cta: "#22d3ee",
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
  const color = score >= 8 ? "#34d399" : score >= 7 ? "#22d3ee" : "#f87171";
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="3" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1 }}
        />
      </svg>
      <span className="font-mono font-bold" style={{ fontSize: size * 0.22, color: "#f8fafc" }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function AdCard({ ad, evaluation, isExpanded, onToggle, onCopy, copied, showPreview, onTogglePreview }: {
  ad: any; evaluation: any; isExpanded: boolean; onToggle: () => void;
  onCopy: () => void; copied: boolean;
  showPreview: boolean; onTogglePreview: () => void;
}) {
  const radarData = evaluation ? [
    { dim: "Clarity",    score: evaluation.scoreClarity },
    { dim: "Value Prop", score: evaluation.scoreValueProp },
    { dim: "CTA",        score: evaluation.scoreCta },
    { dim: "Brand Voice",score: evaluation.scoreBrandVoice },
    { dim: "Emotional",  score: evaluation.scoreEmotionalResonance },
  ] : [];

  const modeColors: Record<string, string> = {
    creative_spark: "#22d3ee",
    adversarial:    "#f472b6",
    self_healing:   "#fb923c",
    standard:       "#f59e0b",
  };
  const modeColor = modeColors[ad.generationMode] || "#f59e0b";

  return (
    <motion.div layout className="ops-card overflow-hidden"
      style={{ borderColor: ad.isPublishable ? "rgba(52,211,153,0.2)" : undefined }}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {ad.isPublishable
              ? <CheckCircle2 size={16} style={{ color: "#34d399" }} />
              : <XCircle size={16} style={{ color: "rgba(100,116,139,0.4)" }} />
            }
          </div>

          {/* Ad content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>#{ad.id}</span>
              <span className="tag-ops" style={{
                color: modeColor,
                border: `1px solid ${modeColor}30`,
                background: `${modeColor}0a`,
              }}>
                {ad.generationMode.replace("_", " ")}
              </span>
              {ad.iterationNumber > 1 && (
                <span className="tag-ops tag-dim">iter {ad.iterationNumber}</span>
              )}
            </div>

            {/* Ad preview card */}
            <div className="rounded-lg p-4 mb-3"
              style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(226,232,240,0.85)" }}>
                {ad.primaryText}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display font-bold text-sm" style={{ color: "#f8fafc" }}>{ad.headline}</span>
                <span className="tag-ops tag-gold">{ad.ctaButton}</span>
              </div>
              {ad.description && (
                <p className="font-mono text-[10px] mt-2" style={{ color: "rgba(100,116,139,0.5)" }}>{ad.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={onCopy} className="flex items-center gap-1.5 font-mono text-[10px] transition-colors"
                style={{ color: copied ? "#34d399" : "rgba(100,116,139,0.5)" }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={onTogglePreview} className="flex items-center gap-1.5 font-mono text-[10px] transition-colors"
                style={{ color: showPreview ? "#22d3ee" : "rgba(100,116,139,0.5)" }}>
                <Smartphone size={11} />
                {showPreview ? "Hide Preview" : "Ad Preview"}
              </button>
              <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.35)" }}>
                {ad.promptTokens + ad.completionTokens} tokens · ${ad.estimatedCostUsd.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Score ring + expand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {evaluation && <ScoreRing score={evaluation.weightedScore} size={52} />}
            <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(100,116,139,0.4)", background: "rgba(34,211,238,0.04)" }}>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Phone frame preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
            <div className="p-6 flex flex-col items-center">
              <div className="section-label mb-4 self-start">Ad Preview</div>
              <AdPreviewMockup
                primaryText={ad.primaryText}
                headline={ad.headline}
                description={ad.description}
                ctaButton={ad.ctaButton}
                imagePrompt={ad.imagePrompt}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded evaluation */}
      <AnimatePresence>
        {isExpanded && evaluation && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="section-label mb-3">Quality Radar</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(34,211,238,0.08)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="section-label mb-3">Dimension Scores</div>
                {[
                  { key: "clarity",           score: evaluation.scoreClarity,           rationale: evaluation.rationaleClarity },
                  { key: "valueProp",         score: evaluation.scoreValueProp,         rationale: evaluation.rationaleValueProp },
                  { key: "cta",               score: evaluation.scoreCta,               rationale: evaluation.rationaleCta },
                  { key: "brandVoice",        score: evaluation.scoreBrandVoice,        rationale: evaluation.rationaleBrandVoice },
                  { key: "emotionalResonance",score: evaluation.scoreEmotionalResonance,rationale: evaluation.rationaleEmotionalResonance },
                ].map(({ key, score, rationale }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.6)" }}>{DIM_LABELS[key]}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: DIM_COLORS[key] }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 0.8 }} className="h-full rounded-full"
                        style={{ background: DIM_COLORS[key] }} />
                    </div>
                    {rationale && (
                      <p className="font-mono text-[9px] mt-1 leading-relaxed" style={{ color: "rgba(100,116,139,0.4)" }}>{rationale}</p>
                    )}
                  </div>
                ))}
              </div>

              {evaluation.improvementSuggestion && (
                <div className="md:col-span-2 rounded-lg p-4"
                  style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <div className="section-label mb-1.5" style={{ color: "#f59e0b" }}>Improvement Suggestion</div>
                  <p className="font-mono text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>
                    {evaluation.improvementSuggestion}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AdCardWrapper({ ad, isExpanded, onToggle }: { ad: any; isExpanded: boolean; onToggle: () => void }) {
  const { data } = trpc.ads.get.useQuery({ id: ad.id }, { enabled: isExpanded });
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const onCopy = useCallback(() => {
    const text = [ad.headline, "", ad.primaryText, ad.description, "", ad.ctaButton].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Ad copy copied.");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [ad]);
  return <AdCard ad={ad} evaluation={data?.evaluation || null} isExpanded={isExpanded} onToggle={onToggle}
    onCopy={onCopy} copied={copied} showPreview={showPreview} onTogglePreview={() => setShowPreview(p => !p)} />;
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

  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ winnerId: number; winnerScore: number; totalAdsGenerated: number; approvedCount: number } | null>(null);

  const bulkGenerateMutation = trpc.ads.bulkGenerate.useMutation({
    onSuccess: (result) => {
      setIsBulkGenerating(false);
      setIsGenerating(false);
      setLogStep(0);
      refetchAds();
      refetchAnalytics();
      setBulkResult({
        winnerId: result.winnerId,
        winnerScore: result.winnerScore,
        totalAdsGenerated: result.totalAdsGenerated,
        approvedCount: result.approvedCount,
      });
      toast.success(
        `Bulk complete — ${result.approvedCount}/${result.totalAdsGenerated} approved. Winner: ${result.winnerScore.toFixed(1)}/10`,
        { duration: 6000 }
      );
      if (result.qualityRatchetApplied) toast.info("Quality threshold raised — the bar just got higher.");
    },
    onError: (err) => { setIsBulkGenerating(false); setIsGenerating(false); setLogStep(0); toast.error(err.message); },
  });

  const handleBulkGenerate = () => {
    setIsBulkGenerating(true);
    setIsGenerating(true);
    setLogStep(0);
    setBulkResult(null);
    // Animate log steps over ~12 seconds (5 pipelines × ~2.5s each)
    const BULK_LOG = [
      { type: "sys",  msg: "Initializing 5 parallel generation pipelines..." },
      { type: "ai",   msg: "Pipeline 1/5: Generating standard ad copy..." },
      { type: "ai",   msg: "Pipeline 2/5: Generating standard variant..." },
      { type: "ai",   msg: "Pipeline 3/5: Generating standard variant..." },
      { type: "ai",   msg: "Pipeline 4/5: Generating standard variant..." },
      { type: "ai",   msg: "Pipeline 5/5: Creative Spark mode — breaking rules..." },
      { type: "eval", msg: "Evaluating all 5 ads across 5 quality dimensions..." },
      { type: "eval", msg: "Ranking by weighted score..." },
      { type: "pass", msg: "Surfacing winner — highest scoring ad wins." },
    ];
    BULK_LOG.forEach((_, i) => { setTimeout(() => setLogStep(i + 1), i * 1400); });
    bulkGenerateMutation.mutate({ campaignId, count: 5 });
  };

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
    { key: "weightClarity" as const,           label: "Clarity",    color: "#60a5fa" },
    { key: "weightValueProp" as const,         label: "Value Prop", color: "#4ade80" },
    { key: "weightCta" as const,               label: "CTA",        color: "#22d3ee" },
    { key: "weightBrandVoice" as const,        label: "Brand Voice",color: "#a78bfa" },
    { key: "weightEmotionalResonance" as const,label: "Emotional",  color: "#f87171" },
  ];

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(34,211,238,0.15)", borderTopColor: "#22d3ee" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "rgba(100,116,139,0.5)" }}>LOADING</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const qualityTrend = analytics?.qualityTrend || [];
  const avgScores = analytics?.avgScores;

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign.name}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4 flex-wrap mb-5">
            <Link href="/dashboard">
              <button className="btn-secondary p-2.5 flex-shrink-0">
                <ArrowLeft size={14} />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="section-label mb-1.5">Campaign</div>
              <h1 className="font-display font-bold text-2xl tracking-tight truncate" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
                {campaign.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Link href={`/campaigns/${campaignId}/adversarial`}>
                <button className="btn-secondary flex items-center gap-1.5 text-xs">
                  <Swords size={12} /> Adversarial
                </button>
              </Link>
              <Link href={`/campaigns/${campaignId}/spark`}>
                <button className="btn-secondary flex items-center gap-1.5 text-xs">
                  <Sparkles size={12} /> Spark
                </button>
              </Link>
              <Link href={`/campaigns/${campaignId}/performance`}>
                <button className="btn-secondary flex items-center gap-1.5 text-xs">
                  <BarChart3 size={12} /> Analytics
                </button>
              </Link>
            </div>
          </div>

          {/* Campaign meta tags */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="tag-ops tag-teal">{campaign.campaignGoal}</span>
            <span className="tag-ops tag-dim">{campaign.tone}</span>
            <span className="tag-ops tag-teal">Threshold: {campaign.currentQualityThreshold.toFixed(1)}/10</span>
            <span className="tag-ops tag-dim">{campaign.totalAdsGenerated} ads generated</span>
          </div>
        </motion.div>

        {/* ── KPI Row ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Activity,    label: "Total Ads",  value: analytics?.totalAds || 0,                              color: "#22d3ee" },
            { icon: CheckCircle2,label: "Approved",   value: analytics?.approvedAds || 0,                           color: "#34d399" },
            { icon: Award,       label: "Threshold",  value: `${campaign.currentQualityThreshold.toFixed(1)}/10`,   color: "#60a5fa" },
            { icon: DollarSign,  label: "Total Cost", value: `$${(analytics?.totalCost || 0).toFixed(4)}`,          color: "#a78bfa" },
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

        {/* ── Generation Engine ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="ops-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
            <div className="flex items-center gap-3">
              <Zap size={14} style={{ color: "#22d3ee" }} />
              <div>
                <div className="font-mono font-semibold text-[11px] tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                  Generation Engine
                </div>
                <div className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.45)" }}>
                  generate → evaluate → self-heal → approve
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.45)" }}>Max iter:</span>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setMaxIterations(n)}
                  className="w-7 h-7 font-mono text-[11px] font-bold rounded transition-all"
                  style={{
                    background: maxIterations === n ? "rgba(34,211,238,0.1)" : "transparent",
                    color: maxIterations === n ? "#22d3ee" : "rgba(100,116,139,0.4)",
                    border: `1px solid ${maxIterations === n ? "rgba(34,211,238,0.3)" : "rgba(34,211,238,0.08)"}`,
                  }}>
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
                  <div className="terminal-dot" style={{ background: "#f59e0b" }} />
                  <div className="terminal-dot" style={{ background: "#34d399" }} />
                  <span className="font-mono text-[9px] ml-2" style={{ color: "rgba(34,211,238,0.4)" }}>
                    adengine — generation pipeline
                  </span>
                </div>
                {LOG_STEPS.slice(0, logStep).map((entry, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className="log-entry">
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
              <div className="space-y-3">
                {/* Bulk × 5 result banner */}
                {bulkResult && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
                    <Trophy size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[10px] font-bold" style={{ color: "#f59e0b" }}>BULK COMPLETE</span>
                      <span className="font-mono text-[10px] ml-2" style={{ color: "rgba(148,163,184,0.7)" }}>
                        {bulkResult.approvedCount}/{bulkResult.totalAdsGenerated} approved · Winner: {bulkResult.winnerScore.toFixed(1)}/10
                      </span>
                    </div>
                    <button onClick={() => setBulkResult(null)}
                      className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>✕</button>
                  </div>
                )}
                {/* Primary action row */}
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => handleGenerate("standard")}
                    className="btn-primary flex-1 min-w-[120px] flex items-center justify-center gap-2">
                    <Zap size={13} /> Generate Ad
                  </button>
                  <button onClick={() => handleGenerate("creative_spark")}
                    className="btn-secondary flex-1 min-w-[120px] flex items-center justify-center gap-2">
                    <Sparkles size={13} /> Creative Mode
                  </button>
                </div>
                {/* Bulk × 5 button */}
                <button onClick={handleBulkGenerate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono font-bold text-[11px] tracking-widest uppercase transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(34,211,238,0.08) 100%)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "#f59e0b",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)")}>
                  <Layers size={13} />
                  Bulk × 5 — Race to Best
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Dimension Weight Tuner ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="ops-card overflow-hidden">
          <button onClick={() => setShowWeightTuner(!showWeightTuner)}
            className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.015]">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={14} style={{ color: "#f59e0b" }} />
              <span className="font-mono font-semibold text-[11px] tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                Quality Dimension Weights
              </span>
              <span className={`tag-ops ${weightTotal === 100 ? "tag-green" : "tag-red"}`}>
                {weightTotal}/100
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-3">
                {WEIGHT_DIMS.map(d => (
                  <div key={d.key} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                    <span className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.5)" }}>{weights[d.key]}%</span>
                  </div>
                ))}
              </div>
              {showWeightTuner
                ? <ChevronUp size={14} style={{ color: "rgba(100,116,139,0.4)" }} />
                : <ChevronDown size={14} style={{ color: "rgba(100,116,139,0.4)" }} />
              }
            </div>
          </button>

          <AnimatePresence>
            {showWeightTuner && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
                <div className="px-6 py-5 space-y-4">
                  <p className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>
                    Adjust how much each quality dimension contributes to the overall score. Weights must sum to 100.
                  </p>
                  {WEIGHT_DIMS.map(({ key, label, color }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="font-mono text-[11px]" style={{ color: "rgba(148,163,184,0.7)" }}>{label}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold" style={{ color }}>{weights[key]}%</span>
                      </div>
                      <input type="range" min={0} max={60} value={weights[key]}
                        onChange={e => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                        className="w-full h-0.5 appearance-none cursor-pointer rounded-full"
                        style={{ background: `linear-gradient(to right, ${color} ${(weights[key] / 60) * 100}%, rgba(34,211,238,0.08) ${(weights[key] / 60) * 100}%)` }}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-mono text-[11px]" style={{ color: weightTotal === 100 ? "#34d399" : "#f87171" }}>
                      Total: {weightTotal}/100
                    </span>
                    <button onClick={() => {
                      if (weightTotal !== 100) { toast.error(`Weights must sum to 100 (currently ${weightTotal})`); return; }
                      updateWeightsMutation.mutate({ campaignId, ...weights });
                    }} disabled={weightTotal !== 100 || updateWeightsMutation.isPending}
                      className="btn-primary flex items-center gap-2 text-xs disabled:opacity-30">
                      {updateWeightsMutation.isPending
                        ? <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                            style={{ borderColor: "rgba(34,211,238,0.3)", borderTopColor: "#22d3ee" }} /> Saving...</>
                        : <><Save size={12} /> Save Weights</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Quality Trend Chart ── */}
        {qualityTrend.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="ops-card p-6">
            <div className="section-label mb-4">Quality Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.05)" />
                <XAxis dataKey="index" tick={{ fill: "rgba(100,116,139,0.5)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis domain={[0, 10]} tick={{ fill: "rgba(100,116,139,0.5)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ background: "rgba(2,11,24,0.95)", border: "1px solid rgba(34,211,238,0.15)", color: "#e2e8f0", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  formatter={(val: number) => [val.toFixed(2), "Score"]} />
                <ReferenceLine y={campaign.currentQualityThreshold} stroke="#34d399" strokeDasharray="4 4" strokeWidth={1} />
                <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2} dot={{ fill: "#22d3ee", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded" style={{ background: "#22d3ee" }} />
                <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>Quality Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded" style={{ background: "#34d399", opacity: 0.6 }} />
                <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>Threshold</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Average Quality Profile ── */}
        {avgScores && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="ops-card p-6">
            <div className="section-label mb-5">Average Quality Profile</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={[
                  { dim: "Clarity",    score: avgScores.clarity },
                  { dim: "Value Prop", score: avgScores.valueProp },
                  { dim: "CTA",        score: avgScores.cta },
                  { dim: "Brand Voice",score: avgScores.brandVoice },
                  { dim: "Emotional",  score: avgScores.emotionalResonance },
                ]}>
                  <PolarGrid stroke="rgba(34,211,238,0.08)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {Object.entries(avgScores).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1.5">
                      <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.6)" }}>{DIM_LABELS[key]}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: DIM_COLORS[key] }}>{(val as number).toFixed(1)}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(val as number) * 10}%`, background: DIM_COLORS[key] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Generated Ads ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="section-label">Generated Ads</div>
            <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.06)" }} />
            <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.4)" }}>
              {ads?.length || 0} total · {ads?.filter((a: any) => a.status === "approved").length || 0} approved
            </span>
          </div>

          {ads && ads.length > 0 ? (
            <div className="space-y-3">
              {ads.map(ad => (
                <AdCardWrapper key={ad.id} ad={ad}
                  isExpanded={expandedAdId === ad.id}
                  onToggle={() => setExpandedAdId(expandedAdId === ad.id ? null : ad.id)}
                />
              ))}
            </div>
          ) : (
            <div className="ops-card bracket py-16 text-center">
              <Zap size={24} style={{ color: "rgba(34,211,238,0.2)", margin: "0 auto 1rem" }} />
              <div className="section-label mb-2 text-center">No Ads Generated</div>
              <p className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.4)" }}>
                Use the generation engine above to create your first ad.
              </p>
            </div>
          )}
        </motion.div>

      </div>
    </AppLayout>
  );
}
