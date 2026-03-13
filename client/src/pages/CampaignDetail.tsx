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

const CTA_TYPES = ["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "GET_OFFER", "BOOK_NOW", "CONTACT_US", "DOWNLOAD", "WATCH_MORE"];

function ReadyToLaunchPanel({ ad }: { ad: any }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };
  const headline = (ad.headline || "").slice(0, 27);
  const headlineOver = (ad.headline || "").length > 27;
  const inferredCta = CTA_TYPES.find(c => (ad.ctaButton || "").toUpperCase().includes(c.replace("_", " "))) || "LEARN_MORE";
  const fields = [
    { key: "headline",    label: "Headline",     value: headline,        limit: 27, over: headlineOver },
    { key: "primaryText", label: "Primary Text",  value: ad.primaryText || "",  limit: 125, over: (ad.primaryText || "").length > 125 },
    { key: "description", label: "Description",  value: ad.description || "",  limit: 30,  over: (ad.description || "").length > 30 },
    { key: "ctaType",     label: "CTA Type",      value: inferredCta,     limit: null, over: false },
  ];
  return (
    <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(52,211,153,0.12)", background: "rgba(52,211,153,0.02)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Target size={11} style={{ color: "#34d399" }} />
        <span className="font-mono font-bold text-[9px] tracking-widest uppercase" style={{ color: "#34d399" }}>Ready to Launch</span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.08)", color: "rgba(52,211,153,0.6)" }}>Meta Ads Manager format</span>
      </div>
      <div className="space-y-2">
        {fields.map(({ key, label, value, limit, over }) => (
          <div key={key} className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(100,116,139,0.5)" }}>{label}</span>
                {limit && (
                  <span className="font-mono text-[9px]" style={{ color: over ? "#f87171" : "rgba(100,116,139,0.35)" }}>
                    {value.length}/{limit}{over ? " ⚠" : ""}
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] rounded px-2 py-1.5 leading-relaxed"
                style={{ background: "rgba(2,11,24,0.6)", border: "1px solid rgba(34,211,238,0.08)", color: "rgba(226,232,240,0.8)", wordBreak: "break-word" }}>
                {value || <span style={{ color: "rgba(100,116,139,0.3)" }}>—</span>}
              </div>
            </div>
            <button onClick={() => copyField(key, value)}
              className="flex-shrink-0 mt-5 flex items-center gap-1 font-mono text-[9px] px-2 py-1 rounded transition-all"
              style={{
                background: copiedField === key ? "rgba(52,211,153,0.1)" : "rgba(34,211,238,0.05)",
                border: `1px solid ${copiedField === key ? "rgba(52,211,153,0.3)" : "rgba(34,211,238,0.1)"}`,
                color: copiedField === key ? "#34d399" : "rgba(100,116,139,0.5)",
              }}>
              {copiedField === key ? <Check size={9} /> : <Copy size={9} />}
              {copiedField === key ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
      <a href="https://www.facebook.com/adsmanager/creation" target="_blank" rel="noopener noreferrer"
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg font-mono font-bold text-[10px] tracking-widest uppercase transition-all"
        style={{
          background: "rgba(52,211,153,0.06)",
          border: "1px solid rgba(52,211,153,0.2)",
          color: "#34d399",
        }}>
        <Target size={11} />
        Open Meta Ads Manager
      </a>
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

      {/* Ready to Launch panel for approved ads */}
      {ad.isPublishable && (
        <ReadyToLaunchPanel ad={ad} />
      )}

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

              {/* Confidence Score */}
              {evaluation.confidenceScore !== undefined && (
                <div className="md:col-span-2 flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{
                    background: (evaluation.confidenceScore ?? 0.8) >= 0.8 ? "rgba(52,211,153,0.04)" : (evaluation.confidenceScore ?? 0.8) >= 0.6 ? "rgba(245,158,11,0.04)" : "rgba(248,113,113,0.04)",
                    border: `1px solid ${(evaluation.confidenceScore ?? 0.8) >= 0.8 ? "rgba(52,211,153,0.12)" : (evaluation.confidenceScore ?? 0.8) >= 0.6 ? "rgba(245,158,11,0.12)" : "rgba(248,113,113,0.12)"}`
                  }}>
                  <div className="flex-1">
                    <div className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: "rgba(100,116,139,0.5)" }}>Evaluator Confidence</div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(evaluation.confidenceScore ?? 0.8) * 100}%` }}
                        transition={{ duration: 0.8 }} className="h-full rounded-full"
                        style={{ background: (evaluation.confidenceScore ?? 0.8) >= 0.8 ? "#34d399" : (evaluation.confidenceScore ?? 0.8) >= 0.6 ? "#f59e0b" : "#f87171" }} />
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[11px]" style={{ color: (evaluation.confidenceScore ?? 0.8) >= 0.8 ? "#34d399" : (evaluation.confidenceScore ?? 0.8) >= 0.6 ? "#f59e0b" : "#f87171" }}>
                    {Math.round((evaluation.confidenceScore ?? 0.8) * 100)}%
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>
                    {(evaluation.confidenceScore ?? 0.8) >= 0.8 ? "High confidence" : (evaluation.confidenceScore ?? 0.8) >= 0.6 ? "Medium confidence" : "Low confidence — review manually"}
                  </span>
                </div>
              )}
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

  const { data: campaign, refetch: refetchCampaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
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

  // Threshold manual override
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<string>("");
  const updateThresholdMutation = trpc.campaigns.updateThreshold.useMutation({
    onSuccess: (updated) => {
      toast.success(`Quality threshold set to ${updated.newThreshold.toFixed(1)}/10`);
      setShowThresholdEditor(false);
      refetchCampaign();
    },
    onError: (err) => toast.error(err.message),
  });

  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [batchSize, setBatchSize] = useState<5 | 10 | 25 | 50>(10);
  const [bulkResult, setBulkResult] = useState<{
    winnerId: number; winnerScore: number; totalAdsGenerated: number;
    approvedCount: number; remediatedCount: number; qualityRatchetApplied: boolean;
    varietyStats?: { uniqueTones: number; uniqueFormats: number; diversityScore: number; toneDistribution: Record<string, number>; formatDistribution: Record<string, number> };
  } | null>(null);

  // Smart Prompt Expansion
  const [smartPromptText, setSmartPromptText] = useState("");
  const [expandedAngles, setExpandedAngles] = useState<Array<{
    angleId: string; angleName: string; tone: string; format: string;
    emotionalHook: string; audienceAngle: string; exampleHeadline: string;
    examplePrimaryText: string; creativeDirection: string;
  }>>([]);
  const [showSmartPrompt, setShowSmartPrompt] = useState(false);

  const expandPromptMutation = trpc.ads.expandPrompt.useMutation({
    onSuccess: (result) => {
      setExpandedAngles(result.angles);
      toast.success(`Expanded into ${result.angles.length} creative angles.`);
    },
    onError: (err) => toast.error(err.message),
  });

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
        remediatedCount: result.remediatedCount,
        qualityRatchetApplied: result.qualityRatchetApplied,
        varietyStats: result.varietyStats,
      });
      toast.success(
        `Batch complete — ${result.approvedCount}/${result.totalAdsGenerated} approved. Winner: ${result.winnerScore.toFixed(1)}/10`,
        { duration: 6000 }
      );
      if (result.remediatedCount > 0) toast.info(`${result.remediatedCount} ad(s) auto-remediated and improved.`);
      if (result.qualityRatchetApplied) toast.info("Quality threshold raised — the bar just got higher.");
    },
    onError: (err) => { setIsBulkGenerating(false); setIsGenerating(false); setLogStep(0); toast.error(err.message); },
  });

  const handleBulkGenerate = () => {
    setIsBulkGenerating(true);
    setIsGenerating(true);
    setLogStep(0);
    setBulkResult(null);
    // Animate log steps scaled to batch size
    const perStep = batchSize <= 10 ? 1200 : batchSize <= 25 ? 900 : 600;
    const BULK_LOG = [
      { type: "sys",  msg: `Initializing ${batchSize} parallel generation pipelines...` },
      { type: "ai",   msg: `Generating ${batchSize} ad variants with brand context...` },
      { type: "eval", msg: `Evaluating all ${batchSize} ads across 5 quality dimensions...` },
      { type: "heal", msg: `Running remediation loop on ads below threshold...` },
      { type: "eval", msg: `Re-evaluating remediated ads (up to 3 rounds per ad)...` },
      { type: "pass", msg: `Ranking by weighted score — surfacing winner...` },
      { type: "pass", msg: `Quality ratchet check — raising the bar if warranted...` },
    ];
    BULK_LOG.forEach((_, i) => { setTimeout(() => setLogStep(i + 1), i * perStep); });
    bulkGenerateMutation.mutate({ campaignId, count: batchSize });
  };

  const generateMutation = trpc.ads.generateAndEvaluate.useMutation({
    onSuccess: (result) => {
      setIsGenerating(false);
      setLogStep(0);
      refetchAds();
      refetchAnalytics();
      const latency = result.latency;
      if (result.isPublishable) {
        toast.success(
          `✅ Approved — ${result.bestScore.toFixed(1)}/10 in ${result.totalIterations} iter${result.totalIterations > 1 ? 's' : ''} · ${latency.totalMs}ms total`
        );
      } else {
        toast.warning(`Below threshold. Best: ${result.bestScore.toFixed(1)}/10 · ${latency.totalMs}ms`);
      }
      if (result.qualityRatchetApplied) {
        toast.info("⚡ Quality threshold raised — the bar just got higher.");
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
            {/* Threshold — click to edit */}
            <button
              onClick={() => { setShowThresholdEditor(!showThresholdEditor); setThresholdInput(campaign.currentQualityThreshold.toFixed(1)); }}
              className="tag-ops tag-teal flex items-center gap-1.5 transition-all"
              style={{ cursor: "pointer", borderStyle: showThresholdEditor ? "solid" : "dashed" }}
              title="Click to adjust quality threshold">
              <Target size={9} />
              Threshold: {campaign.currentQualityThreshold.toFixed(1)}/10
              <span className="font-mono text-[8px] opacity-50">✎</span>
            </button>
            <span className="tag-ops tag-dim">{campaign.totalAdsGenerated} ads generated</span>
          </div>

          {/* Threshold Editor — inline popover */}
          <AnimatePresence>
            {showThresholdEditor && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                className="rounded-xl p-4 mt-2"
                style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Target size={12} style={{ color: "#60a5fa" }} />
                    <span className="font-mono font-bold text-[10px] tracking-widest uppercase" style={{ color: "#60a5fa" }}>Set Quality Threshold</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range" min="1" max="9.9" step="0.1"
                      value={thresholdInput || campaign.currentQualityThreshold}
                      onChange={e => setThresholdInput(e.target.value)}
                      className="flex-1 accent-blue-400"
                      style={{ minWidth: 120 }}
                    />
                    <span className="font-mono font-bold text-sm w-12 text-center" style={{ color: "#60a5fa" }}>
                      {parseFloat(thresholdInput || String(campaign.currentQualityThreshold)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const val = parseFloat(thresholdInput);
                        if (!isNaN(val) && val >= 1 && val <= 9.9) {
                          updateThresholdMutation.mutate({ campaignId, threshold: val });
                        } else {
                          toast.error("Threshold must be between 1.0 and 9.9");
                        }
                      }}
                      disabled={updateThresholdMutation.isPending}
                      className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5">
                      {updateThresholdMutation.isPending ? (
                        <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }} /> Saving...</>
                      ) : (
                        <><Save size={11} /> Apply</>
                      )}
                    </button>
                    <button onClick={() => setShowThresholdEditor(false)}
                      className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                  </div>
                </div>
                <div className="font-mono text-[9px] mt-2" style={{ color: "rgba(100,116,139,0.4)" }}>
                  Current: {campaign.currentQualityThreshold.toFixed(1)}/10 — Ads scoring below this are rejected and sent to self-healing. Range: 1.0 – 9.9
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              <div className="space-y-4">
                {/* Batch result summary */}
                {bulkResult && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.15)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy size={13} style={{ color: "#f59e0b" }} />
                        <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color: "#f59e0b" }}>BATCH COMPLETE</span>
                      </div>
                      <button onClick={() => setBulkResult(null)} className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>✕</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg p-3 text-center" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)" }}>
                        <div className="font-mono font-bold text-lg" style={{ color: "#34d399" }}>
                          {bulkResult.approvedCount}<span className="text-[10px] font-normal opacity-60">/{bulkResult.totalAdsGenerated}</span>
                        </div>
                        <div className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: "rgba(100,116,139,0.5)" }}>APPROVED</div>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                        <div className="font-mono font-bold text-lg" style={{ color: "#f59e0b" }}>
                          {bulkResult.winnerScore.toFixed(1)}
                        </div>
                        <div className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: "rgba(100,116,139,0.5)" }}>WINNER SCORE</div>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.12)" }}>
                        <div className="font-mono font-bold text-lg" style={{ color: "#fb923c" }}>
                          {bulkResult.remediatedCount}
                        </div>
                        <div className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: "rgba(100,116,139,0.5)" }}>REMEDIATED</div>
                      </div>
                    </div>
                    {bulkResult.varietyStats && (
                      <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(167,139,250,0.7)" }}>VARIETY DISTRIBUTION</span>
                          <span className="font-mono font-bold text-[10px]" style={{ color: "#a78bfa" }}>{bulkResult.varietyStats.diversityScore}% diversity</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(bulkResult.varietyStats.toneDistribution).map(([tone, count]) => (
                            <span key={tone} className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,211,238,0.06)", color: "rgba(34,211,238,0.6)", border: "1px solid rgba(34,211,238,0.1)" }}>
                              {tone} ×{count}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(bulkResult.varietyStats.formatDistribution).map(([fmt, count]) => (
                            <span key={fmt} className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(74,222,128,0.06)", color: "rgba(74,222,128,0.6)", border: "1px solid rgba(74,222,128,0.1)" }}>
                              {fmt} ×{count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {bulkResult.qualityRatchetApplied && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
                        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#60a5fa" }}>↑ QUALITY RATCHET APPLIED — threshold raised automatically</span>
                      </div>
                    )}
                  </motion.div>
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

                {/* Batch Generation Engine — Variety Matrix */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.06)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
                    <div className="flex items-center gap-2">
                      <Layers size={12} style={{ color: "#f59e0b" }} />
                      <span className="font-mono font-bold text-[10px] tracking-widest uppercase" style={{ color: "#f59e0b" }}>Batch Generation Engine</span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "rgba(245,158,11,0.7)" }}>8 tones × 6 formats × 5 hooks</span>
                    </div>
                    <button onClick={() => setShowSmartPrompt(!showSmartPrompt)}
                      className="flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: showSmartPrompt ? "rgba(167,139,250,0.15)" : "rgba(34,211,238,0.04)",
                        border: `1px solid ${showSmartPrompt ? "rgba(167,139,250,0.4)" : "rgba(34,211,238,0.1)"}`,
                        color: showSmartPrompt ? "#a78bfa" : "rgba(100,116,139,0.5)",
                      }}>
                      <Brain size={10} />
                      Smart Prompt
                    </button>
                  </div>
                  <div className="p-4 space-y-4">

                    {/* Smart Prompt Expansion Panel */}
                    <AnimatePresence>
                      {showSmartPrompt && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden">
                          <div className="rounded-xl p-4 space-y-3 mb-1"
                            style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}>
                            <div className="flex items-center gap-2">
                              <Brain size={11} style={{ color: "#a78bfa" }} />
                              <span className="font-mono font-bold text-[10px] tracking-widest uppercase" style={{ color: "#a78bfa" }}>Smart Prompt Expansion</span>
                              <span className="font-mono text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>vague brief → 8 distinct creative angles</span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={smartPromptText}
                                onChange={e => setSmartPromptText(e.target.value)}
                                placeholder="e.g. 'tutoring for stressed parents' or 'SAT prep that actually works'"
                                className="flex-1 px-3 py-2 rounded-lg font-mono text-[11px] outline-none"
                                style={{
                                  background: "rgba(2,11,24,0.8)",
                                  border: "1px solid rgba(167,139,250,0.2)",
                                  color: "#e2e8f0",
                                }}
                                onKeyDown={e => { if (e.key === "Enter" && smartPromptText.trim().length >= 3) expandPromptMutation.mutate({ campaignId, vaguePrompt: smartPromptText.trim() }); }}
                              />
                              <button
                                onClick={() => expandPromptMutation.mutate({ campaignId, vaguePrompt: smartPromptText.trim() })}
                                disabled={smartPromptText.trim().length < 3 || expandPromptMutation.isPending}
                                className="px-4 py-2 rounded-lg font-mono font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5"
                                style={{
                                  background: "rgba(167,139,250,0.15)",
                                  border: "1px solid rgba(167,139,250,0.4)",
                                  color: "#a78bfa",
                                  opacity: smartPromptText.trim().length < 3 ? 0.4 : 1,
                                }}>
                                {expandPromptMutation.isPending ? (
                                  <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "rgba(167,139,250,0.3)", borderTopColor: "#a78bfa" }} /> Expanding...</>
                                ) : (
                                  <><Brain size={11} /> Expand</>
                                )}
                              </button>
                            </div>

                            {/* Angle Cards */}
                            {expandedAngles.length > 0 && (
                              <div className="space-y-2 mt-1">
                                <div className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>8 CREATIVE ANGLES — each is a distinct ad strategy:</div>
                                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                                  {expandedAngles.map((angle, i) => (
                                    <motion.div key={angle.angleId}
                                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="rounded-lg p-3 space-y-1.5"
                                      style={{ background: "rgba(2,11,24,0.6)", border: "1px solid rgba(167,139,250,0.12)" }}>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-bold text-[10px]" style={{ color: "#a78bfa" }}>#{i + 1} {angle.angleName}</span>
                                        <span className="tag-ops" style={{ color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.06)" }}>{angle.tone}</span>
                                        <span className="tag-ops" style={{ color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.06)" }}>{angle.format.replace(/_/g, " ")}</span>
                                        <span className="tag-ops" style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.06)" }}>{angle.emotionalHook.replace(/_/g, " ")}</span>
                                        <span className="tag-ops" style={{ color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.06)" }}>{angle.audienceAngle.replace(/_/g, " ")}</span>
                                      </div>
                                      <div className="font-display font-bold text-sm" style={{ color: "#f8fafc" }}>{angle.exampleHeadline}</div>
                                      <div className="font-mono text-[10px] leading-relaxed" style={{ color: "rgba(226,232,240,0.6)" }}>{angle.examplePrimaryText}</div>
                                      <div className="font-mono text-[9px] italic" style={{ color: "rgba(167,139,250,0.5)" }}>{angle.creativeDirection}</div>
                                    </motion.div>
                                  ))}
                                </div>
                                <div className="font-mono text-[9px] px-2 py-1.5 rounded-lg" style={{ background: "rgba(167,139,250,0.06)", color: "rgba(167,139,250,0.6)" }}>
                                  ℹ These angles inform your batch. Launch below — all {batchSize} ads use the full variety matrix.
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Variety Matrix Preview */}
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.08)" }}>
                      <div className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "rgba(100,116,139,0.4)" }}>VARIETY MATRIX — each ad gets a unique combination:</div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {["Empowering", "Urgent", "Friendly", "Professional", "Playful", "Provocative", "Storytelling", "Social Proof"].map(t => (
                          <span key={t} className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,211,238,0.06)", color: "rgba(34,211,238,0.55)", border: "1px solid rgba(34,211,238,0.1)" }}>{t}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {["Problem→Solution", "Before→After", "Question Hook", "Bold Claim", "Listicle", "Testimonial"].map(f => (
                          <span key={f} className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(74,222,128,0.06)", color: "rgba(74,222,128,0.55)", border: "1px solid rgba(74,222,128,0.1)" }}>{f}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>Batch size:</span>
                      <div className="flex gap-1.5">
                        {([5, 10, 25, 50] as const).map(n => (
                          <button key={n} onClick={() => setBatchSize(n)}
                            className="px-3 py-1.5 rounded-lg font-mono font-bold text-[11px] transition-all"
                            style={{
                              background: batchSize === n ? "rgba(245,158,11,0.15)" : "rgba(34,211,238,0.04)",
                              border: `1px solid ${batchSize === n ? "rgba(245,158,11,0.4)" : "rgba(34,211,238,0.1)"}`,
                              color: batchSize === n ? "#f59e0b" : "rgba(100,116,139,0.5)",
                            }}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <span className="font-mono text-[9px] ml-auto" style={{ color: "rgba(100,116,139,0.35)" }}>
                        {batchSize} ads × unique variety → {Math.min(batchSize, 8)} distinct tones
                      </span>
                    </div>
                    <button onClick={handleBulkGenerate}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono font-bold text-[11px] tracking-widest uppercase transition-all"
                      style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(34,211,238,0.08) 100%)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "#f59e0b",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)")}>
                      <Layers size={13} />
                      Launch Batch × {batchSize} — Full Variety Matrix
                    </button>
                  </div>
                </div>
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
