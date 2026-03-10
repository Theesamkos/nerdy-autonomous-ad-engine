import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Brain, TrendingUp, Shield, CheckCircle, XCircle,
  RefreshCw, Swords, Sparkles, BarChart3, ChevronDown, ChevronUp,
  Target, Clock, DollarSign, Award, SlidersHorizontal, Save
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const DIM_COLORS: Record<string, string> = {
  clarity: "oklch(0.65 0.22 260)",
  valueProp: "oklch(0.72 0.2 145)",
  cta: "oklch(0.72 0.2 55)",
  brandVoice: "oklch(0.6 0.25 295)",
  emotionalResonance: "oklch(0.65 0.25 340)",
};

const DIM_LABELS: Record<string, string> = {
  clarity: "Clarity",
  valueProp: "Value Prop",
  cta: "CTA",
  brandVoice: "Brand Voice",
  emotionalResonance: "Emotional",
};

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  const color = score >= 8 ? "oklch(0.72 0.2 145)" : score >= 7 ? "oklch(0.65 0.22 260)" : "oklch(0.72 0.2 55)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.2 0.015 260)" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="font-display font-bold text-foreground" style={{ fontSize: size * 0.22 }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function AdCard({ ad, evaluation, isExpanded, onToggle }: {
  ad: any; evaluation: any; isExpanded: boolean; onToggle: () => void;
}) {
  const radarData = evaluation ? [
    { dim: "Clarity", score: evaluation.scoreClarity },
    { dim: "Value Prop", score: evaluation.scoreValueProp },
    { dim: "CTA", score: evaluation.scoreCta },
    { dim: "Brand Voice", score: evaluation.scoreBrandVoice },
    { dim: "Emotional", score: evaluation.scoreEmotionalResonance },
  ] : [];

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        ad.isPublishable
          ? "border-green-500/30 bg-green-500/5"
          : "border-border/50 bg-card"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            {ad.isPublishable
              ? <CheckCircle className="w-5 h-5 text-green-400" />
              : <XCircle className="w-5 h-5 text-muted-foreground" />
            }
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">#{ad.id}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  ad.generationMode === "creative_spark" ? "bg-cyan-500/20 text-cyan-400" :
                  ad.generationMode === "adversarial" ? "bg-pink-500/20 text-pink-400" :
                  ad.generationMode === "self_healing" ? "bg-orange-500/20 text-orange-400" :
                  "bg-primary/20 text-primary"
                }`}>
                  {ad.generationMode.replace("_", " ")}
                </span>
                {ad.iterationNumber > 1 && (
                  <span className="text-xs text-muted-foreground">iter {ad.iterationNumber}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {evaluation && <ScoreRing score={evaluation.weightedScore} size={52} />}
            <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Ad preview */}
        <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/30">
          <p className="text-sm text-foreground leading-relaxed">{ad.primaryText}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">{ad.headline}</span>
            <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">{ad.ctaButton}</span>
          </div>
          {ad.description && (
            <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>
          )}
        </div>
      </div>

      {/* Expanded evaluation */}
      <AnimatePresence>
        {isExpanded && evaluation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/30 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar chart */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quality Radar</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="oklch(0.2 0.015 260)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                    <Radar dataKey="score" stroke="oklch(0.65 0.22 260)" fill="oklch(0.65 0.22 260)" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Dimension scores */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dimension Scores</div>
                {[
                  { key: "clarity", score: evaluation.scoreClarity, rationale: evaluation.rationaleClarity },
                  { key: "valueProp", score: evaluation.scoreValueProp, rationale: evaluation.rationaleValueProp },
                  { key: "cta", score: evaluation.scoreCta, rationale: evaluation.rationaleCta },
                  { key: "brandVoice", score: evaluation.scoreBrandVoice, rationale: evaluation.rationaleBrandVoice },
                  { key: "emotionalResonance", score: evaluation.scoreEmotionalResonance, rationale: evaluation.rationaleEmotionalResonance },
                ].map(({ key, score, rationale }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{DIM_LABELS[key]}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: DIM_COLORS[key] }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: DIM_COLORS[key] }}
                      />
                    </div>
                    {rationale && (
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{rationale}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Improvement suggestion */}
              {evaluation.improvementSuggestion && (
                <div className="md:col-span-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-xs font-semibold text-orange-400 mb-1">💡 Improvement Suggestion</div>
                  <p className="text-xs text-muted-foreground">{evaluation.improvementSuggestion}</p>
                </div>
              )}

              {/* Cost */}
              <div className="md:col-span-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Tokens: {ad.promptTokens + ad.completionTokens}</span>
                <span>Cost: ${ad.estimatedCostUsd.toFixed(6)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [expandedAdId, setExpandedAdId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [maxIterations, setMaxIterations] = useState(3);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: ads, refetch: refetchAds } = trpc.ads.list.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: analytics, refetch: refetchAnalytics } = trpc.ads.getCampaignAnalytics.useQuery({ campaignId }, { enabled: !!campaignId });

  const generateMutation = trpc.ads.generateAndEvaluate.useMutation({
    onSuccess: (result) => {
      setIsGenerating(false);
      setGenerationLog([]);
      refetchAds();
      refetchAnalytics();
      if (result.isPublishable) {
        toast.success(`🎉 Ad approved! Score: ${result.bestScore.toFixed(1)}/10 in ${result.totalIterations} iteration(s)`);
      } else {
        toast.warning(`Ad generated but below threshold. Best score: ${result.bestScore.toFixed(1)}/10`);
      }
      if (result.qualityRatchetApplied) {
        toast.info("📈 Quality threshold raised — the bar just got higher!");
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      setGenerationLog([]);
      toast.error(err.message);
    },
  });

  const handleGenerate = (mode: "standard" | "creative_spark" = "standard") => {
    setIsGenerating(true);
    setGenerationLog([
      "⚡ Initializing generation pipeline...",
      "🧠 Loading brand context for Varsity Tutors...",
      "✍️ Crafting ad copy...",
    ]);

    // Simulate streaming log updates
    const logs = [
      "📊 Evaluating 5 quality dimensions...",
      "🎯 Checking against quality threshold...",
      "🔄 Running self-healing loop if needed...",
      "✅ Finalizing best candidate...",
    ];
    logs.forEach((log, i) => {
      setTimeout(() => setGenerationLog(prev => [...prev, log]), (i + 1) * 2000);
    });

    generateMutation.mutate({ campaignId, mode, maxIterations });
  };

  // --- Dimension weight tuning state ---
  const [showWeightTuner, setShowWeightTuner] = useState(false);
  const [weights, setWeights] = useState({
    weightClarity: campaign?.weightClarity ?? 20,
    weightValueProp: campaign?.weightValueProp ?? 25,
    weightCta: campaign?.weightCta ?? 20,
    weightBrandVoice: campaign?.weightBrandVoice ?? 15,
    weightEmotionalResonance: campaign?.weightEmotionalResonance ?? 20,
  });

  // Sync weights when campaign loads
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

  const weightTotal = useMemo(
    () => Object.values(weights).reduce((s, v) => s + v, 0),
    [weights]
  );

  const updateWeightsMutation = trpc.campaigns.updateWeights.useMutation({
    onSuccess: () => {
      toast.success("✅ Dimension weights updated!");
      setShowWeightTuner(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveWeights = () => {
    if (weightTotal !== 100) {
      toast.error(`Weights must sum to 100 (currently ${weightTotal})`);
      return;
    }
    updateWeightsMutation.mutate({ campaignId, ...weights });
  };

  const WEIGHT_DIMS = [
    { key: "weightClarity" as const, label: "Clarity", color: "oklch(0.65 0.22 260)", desc: "How clear and easy to understand the ad is" },
    { key: "weightValueProp" as const, label: "Value Prop", color: "oklch(0.72 0.2 145)", desc: "Strength of the offer and unique selling point" },
    { key: "weightCta" as const, label: "CTA", color: "oklch(0.72 0.2 55)", desc: "How compelling the call-to-action is" },
    { key: "weightBrandVoice" as const, label: "Brand Voice", color: "oklch(0.6 0.25 295)", desc: "Alignment with Varsity Tutors brand guidelines" },
    { key: "weightEmotionalResonance" as const, label: "Emotional", color: "oklch(0.65 0.25 340)", desc: "Emotional impact and resonance with audience" },
  ];

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const qualityTrend = analytics?.qualityTrend || [];
  const avgScores = analytics?.avgScores;

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign.name}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="capitalize">{campaign.campaignGoal}</span>
              <span>·</span>
              <span className="capitalize">{campaign.tone}</span>
              <span>·</span>
              <span>Threshold: <span className="text-primary font-medium">{campaign.currentQualityThreshold.toFixed(1)}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/campaigns/${campaignId}/adversarial`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Swords className="w-3.5 h-3.5" /> Ad-versarial
              </Button>
            </Link>
            <Link href={`/campaigns/${campaignId}/spark`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Creative Spark
              </Button>
            </Link>
            <Link href={`/campaigns/${campaignId}/performance`}>
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-3.5 h-3.5" /> Performance
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Target, label: "Total Ads", value: analytics?.totalAds || 0, color: "text-primary" },
            { icon: CheckCircle, label: "Approved", value: analytics?.approvedAds || 0, color: "text-green-400" },
            { icon: Award, label: "Threshold", value: `${campaign.currentQualityThreshold.toFixed(1)}/10`, color: "text-cyan-400" },
            { icon: DollarSign, label: "Total Cost", value: `$${(analytics?.totalCost || 0).toFixed(4)}`, color: "text-orange-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-3 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className={`font-display text-xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Dimension Weight Tuner */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <button
            onClick={() => setShowWeightTuner(!showWeightTuner)}
            className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-foreground text-sm">Quality Dimension Weights</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${weightTotal === 100 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{weightTotal}/100</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex gap-2">
                {WEIGHT_DIMS.map(d => (
                  <div key={d.key} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span>{weights[d.key]}%</span>
                  </div>
                ))}
              </div>
              {showWeightTuner ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          <AnimatePresence>
            {showWeightTuner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground pt-3">Adjust how much each quality dimension contributes to the overall score. Weights must sum to 100.</p>
                  {WEIGHT_DIMS.map(({ key, label, color, desc }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">— {desc}</span>
                        </div>
                        <span className="font-mono font-bold text-sm" style={{ color }}>{weights[key]}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        value={weights[key]}
                        onChange={e => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, ${color} ${(weights[key] / 60) * 100}%, oklch(0.2 0.015 260) ${(weights[key] / 60) * 100}%)` }}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-sm font-mono ${weightTotal === 100 ? "text-green-400" : "text-red-400"}`}>
                      Total: {weightTotal}/100
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSaveWeights}
                      disabled={weightTotal !== 100 || updateWeightsMutation.isPending}
                      className="gap-2"
                    >
                      {updateWeightsMutation.isPending ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save Weights
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generation Panel */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-foreground">Generate New Ad</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Autonomous pipeline: generate → evaluate → self-heal → approve</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Max iterations:</span>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setMaxIterations(n)}
                  className={`w-7 h-7 rounded-lg font-mono font-bold transition-all ${
                    maxIterations === n ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {isGenerating ? (
            <div className="space-y-2">
              {generationLog.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground font-mono"
                >
                  {i === generationLog.length - 1 ? (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 flex-shrink-0 text-green-400">✓</div>
                  )}
                  {log}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => handleGenerate("standard")} className="gap-2 glow-blue flex-1 min-w-[140px]">
                <Zap className="w-4 h-4" /> Generate Ad
              </Button>
              <Button onClick={() => handleGenerate("creative_spark")} variant="outline" className="gap-2 flex-1 min-w-[140px]">
                <Sparkles className="w-4 h-4" /> Creative Mode
              </Button>
            </div>
          )}
        </div>

        {/* Quality Trend Chart */}
        {qualityTrend.length > 1 && (
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h2 className="font-display font-semibold text-foreground mb-4">Quality Trend</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.015 260)" />
                <XAxis dataKey="index" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.13 0.014 260)", border: "1px solid oklch(0.25 0.015 260)", borderRadius: "8px", color: "oklch(0.96 0.005 260)" }}
                  formatter={(val: number) => [val.toFixed(2), "Score"]}
                />
                <Line type="monotone" dataKey="score" stroke="oklch(0.65 0.22 260)" strokeWidth={2} dot={{ fill: "oklch(0.65 0.22 260)", r: 3 }} />
                {/* Threshold line */}
                <Line type="monotone" dataKey={() => campaign.currentQualityThreshold} stroke="oklch(0.72 0.2 145)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-primary" /> Quality Score</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-green-500 border-dashed" /> Threshold</div>
            </div>
          </div>
        )}

        {/* Avg Scores Radar */}
        {avgScores && (
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h2 className="font-display font-semibold text-foreground mb-4">Average Quality Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={[
                  { dim: "Clarity", score: avgScores.clarity },
                  { dim: "Value Prop", score: avgScores.valueProp },
                  { dim: "CTA", score: avgScores.cta },
                  { dim: "Brand Voice", score: avgScores.brandVoice },
                  { dim: "Emotional", score: avgScores.emotionalResonance },
                ]}>
                  <PolarGrid stroke="oklch(0.2 0.015 260)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="oklch(0.65 0.22 260)" fill="oklch(0.65 0.22 260)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {Object.entries(avgScores).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{DIM_LABELS[key]}</span>
                      <span className="font-mono" style={{ color: DIM_COLORS[key] }}>{(val as number).toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(val as number) * 10}%`, background: DIM_COLORS[key] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ads List */}
        <div>
          <h2 className="font-display font-semibold text-foreground mb-4">
            Generated Ads ({ads?.length || 0})
          </h2>
          {ads && ads.length > 0 ? (
            <div className="space-y-3">
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
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No ads yet. Generate your first ad above.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function AdCardWrapper({ ad, isExpanded, onToggle }: { ad: any; isExpanded: boolean; onToggle: () => void }) {
  const { data } = trpc.ads.get.useQuery({ id: ad.id }, { enabled: isExpanded });
  return (
    <AdCard
      ad={ad}
      evaluation={data?.evaluation || null}
      isExpanded={isExpanded}
      onToggle={onToggle}
    />
  );
}
