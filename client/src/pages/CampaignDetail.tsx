import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Zap, Brain, CheckCircle2, XCircle, Swords, Sparkles,
  BarChart3, ChevronDown, ChevronUp, Target, DollarSign, Award,
  SlidersHorizontal, Save, ArrowLeft, Copy, Check, Activity, Smartphone, Layers, Trophy,
  Rocket, ExternalLink, ClipboardCheck, Info, Download, HelpCircle, Users, Bot, Loader2, Cpu
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from "recharts";
import AdPreviewMockup from "@/components/AdPreviewMockup";
import GenerationTheater from "@/components/GenerationTheater";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Streamdown } from "streamdown";

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
  const [displayScore, setDisplayScore] = useState(score);
  useEffect(() => {
    const controls = animate(displayScore, score, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayScore(latest),
    });
    return () => controls.stop();
  }, [score]);

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
        {displayScore.toFixed(1)}
      </span>
    </div>
  );
}

function AnimatedMetricValue({
  value,
  decimals = 2,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value]);

  return <>{`${prefix}${display.toFixed(decimals)}${suffix}`}</>;
}

function renderHighlightedPhrase(text: string, color: string) {
  const parts = text.split(/(".*?")/g);
  return (
    <>
      {parts.map((part, idx) => (
        <span key={`${part}-${idx}`} style={part.startsWith("\"") && part.endsWith("\"") ? { color } : undefined}>
          {part}
        </span>
      ))}
    </>
  );
}

function AdCard({
  ad,
  evaluation,
  isExpanded,
  onToggle,
  onCopy,
  copied,
  showPreview,
  onTogglePreview,
  onABTestClick,
  isABSelecting,
  isABPrimary,
  isABTarget,
  onExplainScore,
  isExplaining,
  explanation,
  onApplyRewrite,
  isApplyingRewrite,
  onSplitClick,
}: {
  ad: any; evaluation: any; isExpanded: boolean; onToggle: () => void;
  onCopy: () => void; copied: boolean;
  showPreview: boolean; onTogglePreview: () => void;
  onABTestClick?: (adId: number) => void;
  isABSelecting?: boolean;
  isABPrimary?: boolean;
  isABTarget?: boolean;
  onExplainScore?: () => void;
  isExplaining?: boolean;
  explanation?: any;
  onApplyRewrite?: () => void;
  isApplyingRewrite?: boolean;
  onSplitClick?: (adId: number) => void;
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
              : <XCircle size={16} style={{ color: "#94a3b8" }} />
            }
          </div>

          {/* Ad content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>#{ad.id}</span>
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
                <p className="font-mono text-xs mt-2" style={{ color: "#94a3b8" }}>{ad.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={onCopy} className="flex items-center gap-1.5 font-mono text-xs transition-colors"
                style={{ color: copied ? "#34d399" : "#94a3b8" }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={onTogglePreview} className="flex items-center gap-1.5 font-mono text-xs transition-colors"
                style={{ color: showPreview ? "#22d3ee" : "#94a3b8" }}>
                <Smartphone size={11} />
                {showPreview ? "Hide Preview" : "Ad Preview"}
              </button>
              {ad.status === "approved" && onABTestClick && (
                <button onClick={() => onABTestClick(ad.id)} className="flex items-center gap-1.5 font-mono text-xs transition-colors"
                  style={{
                    color: isABPrimary ? "#f59e0b" : isABTarget ? "#22d3ee" : "#94a3b8",
                  }}>
                  <BarChart3 size={11} />
                  {isABPrimary ? "A/B Base" : isABSelecting ? "Compare Here" : "A/B Test"}
                </button>
              )}
              {ad.status === "approved" && onSplitClick && (
                <button onClick={() => onSplitClick(ad.id)} className="flex items-center gap-1.5 font-mono text-xs transition-colors"
                  style={{ color: "#94a3b8" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                  <Users size={11} />
                  Split Audience
                </button>
              )}
              <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                {ad.promptTokens + ad.completionTokens} tokens · ${ad.estimatedCostUsd.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Score ring + expand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {evaluation && (
              <button
                onClick={onExplainScore}
                className="group relative cursor-pointer"
                title="Explain this score"
                disabled={isExplaining}
              >
                <ScoreRing score={evaluation.weightedScore} size={52} />
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#22d3ee" }}>
                  <HelpCircle size={12} />
                </div>
                {isExplaining && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(2,11,24,0.65)" }}>
                    <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                      style={{ borderColor: "rgba(34,211,238,0.4)", borderTopColor: "#22d3ee" }} />
                  </div>
                )}
              </button>
            )}
            <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#94a3b8", background: "rgba(34,211,238,0.04)" }}>
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
                      <span className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>{DIM_LABELS[key]}</span>
                      <span className="font-mono text-xs font-bold" style={{ color: DIM_COLORS[key] }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 0.8 }} className="h-full rounded-full"
                        style={{ background: DIM_COLORS[key] }} />
                    </div>
                    {rationale && (
                      <p className="font-mono text-xs mt-1 leading-relaxed" style={{ color: "#94a3b8" }}>{rationale}</p>
                    )}
                  </div>
                ))}
              </div>

              {explanation && (
                <div className="md:col-span-2 mt-1 rounded-r-lg pl-4 py-4 pr-4"
                  style={{ background: "rgba(0,0,0,0.6)", borderLeft: "2px solid #06b6d4" }}>
                  <div className="italic text-base mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>
                    "{explanation.verdict}"
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-mono text-xs mb-2" style={{ color: "#4ade80" }}>✓ WHAT WORKED</div>
                      <ul className="space-y-1.5">
                        {(explanation.strengths || []).map((item: string, idx: number) => (
                          <li key={`s-${idx}`} className="text-[12px] leading-relaxed" style={{ color: "rgba(226,232,240,0.85)" }}>
                            • {renderHighlightedPhrase(item, "#67e8f9")}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-mono text-xs mb-2" style={{ color: "#f87171" }}>✗ WHAT FAILED</div>
                      <ul className="space-y-1.5">
                        {(explanation.weaknesses || []).map((item: string, idx: number) => (
                          <li key={`w-${idx}`} className="text-[12px] leading-relaxed" style={{ color: "rgba(226,232,240,0.85)" }}>
                            • {renderHighlightedPhrase(item, "#fca5a5")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg p-3"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <div className="font-mono text-xs mb-1" style={{ color: "#fbbf24" }}>
                      WEAKEST LINK: {(explanation.lowestDimension || "Unknown").toUpperCase()}
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "rgba(226,232,240,0.8)" }}>
                      {explanation.lowestDimensionExplanation}
                    </p>
                  </div>

                  {explanation.rewriteSuggestion && (
                    <div className="mt-4">
                      <div className="font-mono text-xs mb-2" style={{ color: "#f8fafc" }}>
                        ONE CHANGE TO RAISE SCORE BY +{Number(explanation.rewriteSuggestion.expectedScoreGain || 0).toFixed(1)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg p-3"
                          style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.05)" }}>
                          <div className="font-mono text-xs mb-1" style={{ color: "#f87171" }}>
                            BEFORE ({explanation.rewriteSuggestion.field})
                          </div>
                          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(226,232,240,0.85)" }}>
                            {explanation.rewriteSuggestion.original}
                          </p>
                        </div>
                        <div className="rounded-lg p-3"
                          style={{ border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.05)" }}>
                          <div className="font-mono text-xs mb-1" style={{ color: "#34d399" }}>
                            AFTER ({explanation.rewriteSuggestion.field})
                          </div>
                          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(226,232,240,0.9)" }}>
                            {explanation.rewriteSuggestion.rewrite}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onApplyRewrite}
                        disabled={isApplyingRewrite}
                        className="mt-3 px-3 py-1.5 rounded-lg font-mono text-xs transition-all disabled:opacity-40"
                        style={{ border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee", background: "rgba(34,211,238,0.06)" }}>
                        Apply This Rewrite
                      </button>
                    </div>
                  )}
                </div>
              )}

              {evaluation.improvementSuggestion && (
                <div className="md:col-span-2 rounded-lg p-4"
                  style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <div className="section-label mb-1.5" style={{ color: "#f59e0b" }}>Improvement Suggestion</div>
                  <p className="font-mono text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>
                    {evaluation.improvementSuggestion}
                  </p>
                </div>
              )}
              {ad.status === "approved" && (
                <ReadyToLaunchPanel ad={ad} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Meta CTA options ─────────────────────────────────────────────────────────
const META_CTA_OPTIONS: Record<string, string> = {
  "Learn More":    "LEARN_MORE",
  "Sign Up":       "SIGN_UP",
  "Get Quote":     "GET_QUOTE",
  "Contact Us":    "CONTACT_US",
  "Book Now":      "BOOK_NOW",
  "Shop Now":      "SHOP_NOW",
  "Download":      "DOWNLOAD",
  "Subscribe":     "SUBSCRIBE",
  "Get Offer":     "GET_OFFER",
  "Apply Now":     "APPLY_NOW",
};

const LINKEDIN_CTA_OPTIONS = ["Learn More", "Sign Up", "Register", "Download", "Apply Now"] as const;
const TIKTOK_CTA_OPTIONS = ["Learn More", "Sign Up", "Apply Now", "Download", "Book Now", "Shop Now"] as const;

function truncateAtWordBoundary(text: string, limit: number): string {
  const normalized = (text || "").trim();
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  if (limit <= 3) return ".".repeat(limit);

  const candidate = normalized.slice(0, limit - 3);
  const lastSpace = candidate.lastIndexOf(" ");
  const safeCut = lastSpace > 0 ? candidate.slice(0, lastSpace) : candidate;
  return `${safeCut.trim()}...`;
}

function getFirstSentence(text: string): string {
  const normalized = (text || "").trim();
  if (!normalized) return "";
  const match = normalized.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : normalized).trim();
}

function countColor(value: string, limit: number | null): string {
  if (!limit) return "#94a3b8";
  const ratio = value.length / limit;
  if (ratio >= 1) return "#f87171";
  if (ratio >= 0.8) return "#f59e0b";
  return "#94a3b8";
}

function ReadyToLaunchPanel({ ad }: { ad: any }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyField = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const primaryText = ad.primaryText || "";
  const headline = truncateAtWordBoundary(ad.headline || "", 27);
  const description = truncateAtWordBoundary(ad.description || "", 30);
  const ctaButton = ad.ctaButton || "Learn More";
  const metaCta = META_CTA_OPTIONS[ctaButton] || "LEARN_MORE";

  const adsManagerUrl = `https://www.facebook.com/adsmanager/manage/campaigns?act=&objective=OUTCOME_AWARENESS`;

  const googleHeadline1 = truncateAtWordBoundary(ad.headline || "", 30);
  const googleHeadline2 = truncateAtWordBoundary(ad.description || ad.primaryText || "", 30);
  const googleDescription = truncateAtWordBoundary(`${ad.primaryText || ""} ${ad.description || ""}`.trim(), 90);
  const googleFinalUrl = "https://www.your-landing-page.com";

  const linkedInIntro = truncateAtWordBoundary(primaryText, 150);
  const linkedInHeadline = truncateAtWordBoundary(ad.headline || "", 70);
  const linkedInDescription = truncateAtWordBoundary(ad.description || primaryText, 100);
  const linkedInCta = LINKEDIN_CTA_OPTIONS.includes(ctaButton as any)
    ? ctaButton
    : ctaButton === "Book Now"
      ? "Register"
      : ctaButton === "Try Free" || ctaButton === "Get Started"
        ? "Sign Up"
        : ctaButton === "Download"
          ? "Download"
          : ctaButton === "Apply Now"
            ? "Apply Now"
            : "Learn More";

  const tikTokAdText = truncateAtWordBoundary(primaryText, 100);
  const tikTokCta = TIKTOK_CTA_OPTIONS.includes(ctaButton as any)
    ? ctaButton
    : ctaButton === "Try Free" || ctaButton === "Get Started"
      ? "Sign Up"
      : ctaButton === "Download"
        ? "Download"
        : ctaButton === "Apply Now"
          ? "Apply Now"
          : "Learn More";
  const tikTokHook = truncateAtWordBoundary(getFirstSentence(primaryText), 100);

  const platformFields = {
    meta: [
      { key: "meta_headline", label: "Headline", value: headline, limit: 27, note: `Meta ads headline (max 27)` },
      { key: "meta_primary", label: "Primary Text", value: primaryText, limit: 125, note: `Meta recommends <=125 chars` },
      { key: "meta_desc", label: "Description", value: description, limit: 30, note: `Meta description (max 30)` },
      { key: "meta_cta", label: "CTA Type", value: metaCta, limit: null, note: `Meta API value for "${ctaButton}"` },
    ],
    google: [
      { key: "google_h1", label: "Headline 1", value: googleHeadline1, limit: 30, note: "Max 30 chars" },
      { key: "google_h2", label: "Headline 2", value: googleHeadline2, limit: 30, note: "Max 30 chars" },
      { key: "google_desc", label: "Description", value: googleDescription, limit: 90, note: "Max 90 chars" },
      { key: "google_url", label: "Final URL", value: googleFinalUrl, limit: null, note: "Destination URL placeholder" },
    ],
    linkedin: [
      { key: "linkedin_intro", label: "Introductory Text", value: linkedInIntro, limit: 150, note: "Max 150 chars" },
      { key: "linkedin_headline", label: "Headline", value: linkedInHeadline, limit: 70, note: "Max 70 chars" },
      { key: "linkedin_desc", label: "Description", value: linkedInDescription, limit: 100, note: "Max 100 chars" },
      { key: "linkedin_cta", label: "CTA", value: linkedInCta, limit: null, note: "Allowed: Learn More, Sign Up, Register, Download, Apply Now" },
    ],
    tiktok: [
      { key: "tiktok_text", label: "Ad Text", value: tikTokAdText, limit: 100, note: "Max 100 chars" },
      { key: "tiktok_cta", label: "CTA Text", value: tikTokCta, limit: null, note: "TikTok CTA option" },
      { key: "tiktok_hook", label: "Hook (First 3s)", value: tikTokHook, limit: 100, note: "Extracted from first sentence of primary text" },
    ],
  } as const;

  const renderLimitsTooltip = (platform: "meta" | "google" | "linkedin" | "tiktok") => {
    const lines: Record<typeof platform, string[]> = {
      meta: [
        "Headline: 27 chars",
        "Primary Text: recommended <=125 chars",
        "Description: 30 chars",
        "CTA Type: Meta API enum value",
      ],
      google: [
        "Headline 1: 30 chars",
        "Headline 2: 30 chars",
        "Description: 90 chars",
        "Final URL: destination placeholder",
      ],
      linkedin: [
        "Introductory text: 150 chars",
        "Headline: 70 chars",
        "Description: 100 chars",
        "CTA: Learn More / Sign Up / Register / Download / Apply Now",
      ],
      tiktok: [
        "Ad text: 100 chars",
        "CTA text: TikTok CTA list",
        "Hook: first sentence from primary text",
      ],
    };

    return (
      <UiTooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded"
            style={{ color: "rgba(100,116,139,0.6)", border: "1px solid rgba(34,211,238,0.15)" }}>
            <Info size={10} />
            Platform Limits
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}
          className="max-w-xs font-mono text-xs"
          style={{ background: "rgba(2,11,24,0.98)", color: "rgba(226,232,240,0.9)", border: "1px solid rgba(34,211,238,0.2)" }}>
          <div className="space-y-1">
            {lines[platform].map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </TooltipContent>
      </UiTooltip>
    );
  };

  const renderFields = (platform: "meta" | "google" | "linkedin" | "tiktok") => (
    <div className="space-y-3">
      {platformFields[platform].map((field) => (
        <div key={field.key} className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>
                {field.label}
              </span>
              {field.limit && (
                <span className="font-mono text-[8px]" style={{ color: countColor(field.value, field.limit) }}>
                  {field.value.length}/{field.limit}
                </span>
              )}
              <span className="font-mono text-[8px]" style={{ color: "#94a3b8" }}>{field.note}</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed break-words" style={{ color: "rgba(226,232,240,0.8)" }}>
              {field.value}
            </p>
          </div>
          <button
            onClick={() => copyField(field.label, field.value)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-all"
            style={{
              background: copiedField === field.label ? "rgba(52,211,153,0.15)" : "rgba(34,211,238,0.06)",
              border: `1px solid ${copiedField === field.label ? "rgba(52,211,153,0.3)" : "rgba(34,211,238,0.15)"}`,
              color: copiedField === field.label ? "#34d399" : "rgba(100,116,139,0.6)",
            }}>
            {copiedField === field.label ? <ClipboardCheck size={10} /> : <Copy size={10} />}
            {copiedField === field.label ? "Copied" : "Copy"}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="md:col-span-2 rounded-lg overflow-hidden"
      style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.2)" }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(52,211,153,0.12)", background: "rgba(52,211,153,0.06)" }}>
        <Rocket size={12} style={{ color: "#34d399" }} />
        <span className="font-mono text-xs font-bold tracking-widest uppercase" style={{ color: "#34d399" }}>Ready to Launch</span>
        <span className="font-mono text-xs ml-auto" style={{ color: "rgba(52,211,153,0.5)" }}>Platform-ready creative pack</span>
      </div>
      <div className="p-4">
        <Tabs defaultValue="meta">
          <TabsList className="h-8 p-1" style={{ background: "rgba(34,211,238,0.08)" }}>
            <TabsTrigger value="meta" className="h-6 text-xs font-mono">Meta</TabsTrigger>
            <TabsTrigger value="google" className="h-6 text-xs font-mono">Google Ads</TabsTrigger>
            <TabsTrigger value="linkedin" className="h-6 text-xs font-mono">LinkedIn</TabsTrigger>
            <TabsTrigger value="tiktok" className="h-6 text-xs font-mono">TikTok</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>
                Facebook / Instagram
              </span>
              {renderLimitsTooltip("meta")}
            </div>
            {renderFields("meta")}
            <div className="pt-2" style={{ borderTop: "1px solid rgba(52,211,153,0.1)" }}>
              <a
                href={adsManagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all"
                style={{
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.3)",
                  color: "#34d399",
                }}>
                <ExternalLink size={11} />
                Open Meta Ads Manager
              </a>
            </div>
          </TabsContent>

          <TabsContent value="google" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>
                Google Ads Responsive Search
              </span>
              {renderLimitsTooltip("google")}
            </div>
            {renderFields("google")}
          </TabsContent>

          <TabsContent value="linkedin" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>
                LinkedIn Sponsored Content
              </span>
              {renderLimitsTooltip("linkedin")}
            </div>
            {renderFields("linkedin")}
          </TabsContent>

          <TabsContent value="tiktok" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>
                TikTok In-Feed
              </span>
              {renderLimitsTooltip("tiktok")}
            </div>
            {renderFields("tiktok")}
          </TabsContent>
        </Tabs>
        <p className="font-mono text-xs mt-3" style={{ color: "#94a3b8" }}>
          Copy each field directly into your chosen platform workflow.
        </p>
      </div>
    </div>
  );
}

function AdCardWrapper({
  ad,
  isExpanded,
  onToggle,
  onABTestClick,
  isABSelecting,
  isABPrimary,
  isABTarget,
  onSplitClick,
}: {
  ad: any;
  isExpanded: boolean;
  onToggle: () => void;
  onABTestClick?: (adId: number) => void;
  isABSelecting?: boolean;
  isABPrimary?: boolean;
  isABTarget?: boolean;
  onSplitClick?: (adId: number) => void;
}) {
  const { data, refetch } = trpc.ads.get.useQuery({ id: ad.id }, { enabled: isExpanded });
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scoreExplanation, setScoreExplanation] = useState<any | null>(null);
  const explainScoreMutation = trpc.ads.explainScore.useMutation({
    onSuccess: (result) => setScoreExplanation(result),
    onError: (err) => toast.error(err.message),
  });
  const applyRewriteMutation = trpc.ads.applyRewrite.useMutation({
    onSuccess: async (result) => {
      await refetch();
      toast.success(
        `Rewrite applied — score improved from ${result.oldScore.toFixed(1)} to ${result.newScore.toFixed(1)} (${result.improvement >= 0 ? "+" : ""}${result.improvement.toFixed(1)})`
      );
    },
    onError: (err) => toast.error(err.message),
  });
  const onCopy = useCallback(() => {
    const text = [ad.headline, "", ad.primaryText, ad.description, "", ad.ctaButton].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Ad copy copied.");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [ad]);
  const onExplainScore = () => {
    explainScoreMutation.mutate({ adId: ad.id });
  };
  const onApplyRewrite = () => {
    if (!scoreExplanation?.rewriteSuggestion) return;
    applyRewriteMutation.mutate({
      adId: ad.id,
      field: scoreExplanation.rewriteSuggestion.field,
      newValue: scoreExplanation.rewriteSuggestion.rewrite,
    });
  };
  return <AdCard ad={ad} evaluation={data?.evaluation || null} isExpanded={isExpanded} onToggle={onToggle}
    onCopy={onCopy} copied={copied} showPreview={showPreview} onTogglePreview={() => setShowPreview(p => !p)}
    onABTestClick={onABTestClick}
    isABSelecting={isABSelecting}
    isABPrimary={isABPrimary}
    isABTarget={isABTarget}
    onExplainScore={onExplainScore}
    isExplaining={explainScoreMutation.isPending}
    explanation={scoreExplanation}
    onApplyRewrite={onApplyRewrite}
    isApplyingRewrite={applyRewriteMutation.isPending}
    onSplitClick={onSplitClick}
  />;
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
  const [generationMode, setGenerationMode] = useState<"standard" | "creative_spark">("standard");
  const [logStep, setLogStep] = useState(0);
  const [maxIterations, setMaxIterations] = useState(3);
  const [showWeightTuner, setShowWeightTuner] = useState(false);
  const [abPrimaryAdId, setAbPrimaryAdId] = useState<number | null>(null);
  const [abResult, setAbResult] = useState<any | null>(null);
  const [abOpen, setAbOpen] = useState(false);
  const [generatingAngleIdx, setGeneratingAngleIdx] = useState<number | null>(null);

  // ── Audience Split ──────────────────────────────────────────────────────────
  const [splitSourceAdId, setSplitSourceAdId] = useState<number | null>(null);
  const [splitSourceHeadline, setSplitSourceHeadline] = useState<string>("");
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitVariants, setSplitVariants] = useState<Array<{
    persona: string; personaId: string; headline: string; primaryText: string;
    description: string; ctaButton: string; personaRationale: string;
    score: number; confidenceScore: number;
  }>>([]);

  const splitByAudienceMutation = trpc.ads.splitByAudience.useMutation({
    onSuccess: (variants) => {
      setSplitVariants(variants);
    },
    onError: (err) => toast.error(err.message),
  });

  const approveVariantMutation = trpc.ads.approveAudienceVariant.useMutation({
    onSuccess: (result) => {
      toast.success(`Variant approved and added to campaign. Score: ${result.score.toFixed(1)}/10`);
      setSplitOpen(false);
      setSplitVariants([]);
      setSplitSourceAdId(null);
      refetchAds();
      refetchAnalytics();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSplitClick = (adId: number) => {
    const ad = ads?.find((a: any) => a.id === adId);
    setSplitSourceAdId(adId);
    setSplitSourceHeadline(ad?.headline || `#${adId}`);
    setSplitVariants([]);
    setSplitOpen(true);
    splitByAudienceMutation.mutate({ adId, campaignId });
  };

  // ── Autopilot ────────────────────────────────────────────────────────────────
  const [autopilotFreq, setAutopilotFreq] = useState(24);
  const [showAutopilot, setShowAutopilot] = useState(true);
  const [optimisticAutopilotEnabled, setOptimisticAutopilotEnabled] = useState(false);
  const [autopilotNow, setAutopilotNow] = useState(Date.now());
  const [autopilotRunLog, setAutopilotRunLog] = useState<Array<{
    at: Date;
    generated: number;
    approved: number;
    winnerScore: number;
  }>>([]);

  const { data: autopilotStatus, refetch: refetchAutopilot } = trpc.campaigns.getAutopilotStatus.useQuery(
    { campaignId },
    { enabled: !!campaignId }
  );

  useEffect(() => {
    if (autopilotStatus) {
      setOptimisticAutopilotEnabled(autopilotStatus.enabled);
      setAutopilotFreq(autopilotStatus.frequencyHours || 24);
    }
  }, [autopilotStatus?.enabled, autopilotStatus?.frequencyHours]);

  useEffect(() => {
    const timer = setInterval(() => setAutopilotNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const toggleAutopilotMutation = trpc.campaigns.toggleAutopilot.useMutation({
    onSuccess: (_, vars) => {
      refetchAutopilot();
      toast.success(vars.enabled ? "Autopilot activated!" : "Autopilot paused.");
    },
    onError: (err, vars) => {
      setOptimisticAutopilotEnabled(!vars.enabled);
      toast.error(err.message);
    },
  });

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

  const simulateABTestMutation = trpc.ads.simulateABTest.useMutation({
    onSuccess: (result) => {
      setAbResult(result);
      setAbOpen(true);
      setAbPrimaryAdId(null);
      toast.success(`A/B simulation complete — winner: ${result.winner.label === "A" ? `#${result.adA.id}` : result.winner.label === "B" ? `#${result.adB.id}` : "Tie"}`);
    },
    onError: (err) => {
      toast.error(err.message);
      setAbPrimaryAdId(null);
    },
  });

  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [batchSize, setBatchSize] = useState<5 | 10 | 25 | 50>(10);
  const [bulkResult, setBulkResult] = useState<{ winnerId: number; winnerScore: number; totalAdsGenerated: number; approvedCount: number; remediatedCount?: number } | null>(null);
  const [intelligenceBrief, setIntelligenceBrief] = useState<{
    brief: string;
    generatedAt: Date | string;
    topTone: string;
    topFormat: string;
    avgScore: number;
  } | null>(null);
  const [showIntelligenceBrief, setShowIntelligenceBrief] = useState(false);

  const intelligenceBriefMutation = trpc.ads.generateIntelligenceBrief.useMutation({
    onSuccess: (result) => {
      setIntelligenceBrief(result);
      setShowIntelligenceBrief(true);
      toast.success("Campaign intelligence brief generated.");
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
      });
      toast.success(
        `Bulk complete — ${result.approvedCount}/${result.totalAdsGenerated} approved. Winner: ${result.winnerScore.toFixed(1)}/10`,
        { duration: 6000 }
      );
      if (result.qualityRatchetApplied) toast.info("Quality threshold raised — the bar just got higher.");
    },
    onError: (err) => { setIsBulkGenerating(false); setIsGenerating(false); setLogStep(0); toast.error(err.message); },
  });

  const generateAndEvaluateMutation = trpc.ads.generateAndEvaluate.useMutation({
    onSuccess: () => {
      refetchAds();
      refetchAnalytics();
      setGeneratingAngleIdx(null);
      toast.success("Ad generated from angle!");
    },
    onError: () => {
      setGeneratingAngleIdx(null);
      toast.error("Generation failed");
    },
  });

  const runAutopilotNowMutation = trpc.ads.bulkGenerate.useMutation({
    onSuccess: (result) => {
      setAutopilotRunLog((prev) => [
        {
          at: new Date(),
          generated: result.totalAdsGenerated,
          approved: result.approvedCount,
          winnerScore: result.winnerScore,
        },
        ...prev.slice(0, 2),
      ]);
      refetchAds();
      refetchAnalytics();
      refetchAutopilot();
      toast.success(`Autopilot run complete — ${result.approvedCount}/${result.totalAdsGenerated} approved.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleBulkGenerate = () => {
    setIsBulkGenerating(true);
    setIsGenerating(false);
    setLogStep(0);
    setBulkResult(null);
    setShowIntelligenceBrief(false);
    const n = batchSize;
    const batchGroups = Math.ceil(n / 10);
    const BULK_LOG = [
      { type: "sys",  msg: `Initializing batch pipeline — ${n} ads across ${batchGroups} batch${batchGroups > 1 ? "es" : ""}...` },
      { type: "ai",   msg: `Generating ad copy with variety matrix (${n} unique tone/format/hook combos)...` },
      { type: "eval", msg: `LLM-as-Judge evaluating all ${n} ads across 5 quality dimensions...` },
      { type: "sys",  msg: "Running self-healing remediation on below-threshold ads (up to 3 rounds)..." },
      { type: "eval", msg: "Applying quality ratchet — raising bar if winner is exceptional..." },
      { type: "pass", msg: `Batch complete — surfacing winner and approved ads.` },
    ];
    const interval = Math.max(800, Math.min(2000, (n * 120)));
    BULK_LOG.forEach((_, i) => { setTimeout(() => setLogStep(i + 1), i * interval); });
    bulkGenerateMutation.mutate({ campaignId, count: n });
  };

  const handleGenerate = (mode: "standard" | "creative_spark" = "standard") => {
    setGenerationMode(mode);
    setIsGenerating(true);
    setLogStep(0);
  };

  const handleToggleAutopilot = (enabled: boolean) => {
    setOptimisticAutopilotEnabled(enabled);
    toggleAutopilotMutation.mutate({
      campaignId,
      enabled,
      frequencyHours: autopilotFreq,
    });
  };

  const formatRelativeTime = (value?: string | Date | null) => {
    if (!value) return "Never";
    const date = new Date(value);
    const diffMs = autopilotNow - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hour${diffH === 1 ? "" : "s"} ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
  };

  const formatNextRunCountdown = (nextRunAt?: string | Date | null) => {
    if (!nextRunAt) return "Queued";
    const diffMs = new Date(nextRunAt).getTime() - autopilotNow;
    if (diffMs <= 0) return "Due now";
    const totalMin = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleABTestClick = (adId: number) => {
    if (!abPrimaryAdId) {
      setAbPrimaryAdId(adId);
      toast.info(`Selected ad #${adId} as baseline. Choose another approved ad.`);
      return;
    }

    if (abPrimaryAdId === adId) {
      setAbPrimaryAdId(null);
      toast.info("A/B selection cleared.");
      return;
    }

    simulateABTestMutation.mutate({ adAId: abPrimaryAdId, adBId: adId });
  };

  const handleGenerateBrief = () => {
    intelligenceBriefMutation.mutate({ campaignId });
  };

  const handleCopyBrief = () => {
    if (!intelligenceBrief?.brief) return;
    navigator.clipboard.writeText(intelligenceBrief.brief).then(() => {
      toast.success("Intelligence brief copied.");
    });
  };

  const expandedAngles = useMemo<Array<{
    angleName: string;
    tone: string;
    format: string;
    emotionalHook: string;
    audienceFraming: string;
    exampleHeadline: string;
    exampleCopy: string;
  }>>(() => {
    const tone = campaign?.tone || "confident";
    const audience = campaign?.audienceSegment || "high-intent learners";
    const product = campaign?.product || "your offer";

    return [
      {
        angleName: "Outcome Acceleration",
        tone,
        format: "Benefit-first",
        emotionalHook: "Future confidence",
        audienceFraming: audience,
        exampleHeadline: `Get ahead faster with ${product}`,
        exampleCopy: `Build momentum now and see measurable progress sooner with a focused ${product} plan.`,
      },
      {
        angleName: "Pain-to-Relief",
        tone: "empathetic",
        format: "Problem-solution",
        emotionalHook: "Stress relief",
        audienceFraming: audience,
        exampleHeadline: "Turn overwhelm into a clear plan",
        exampleCopy: `If things feel stuck, we make the next step simple and practical so results feel achievable again.`,
      },
      {
        angleName: "Authority Proof",
        tone: "credible",
        format: "Proof-led",
        emotionalHook: "Trust and certainty",
        audienceFraming: audience,
        exampleHeadline: "Guidance backed by proven outcomes",
        exampleCopy: `Lean on a proven framework that combines expert support and a repeatable path to better performance.`,
      },
      {
        angleName: "Urgent Opportunity",
        tone: "motivational",
        format: "Deadline push",
        emotionalHook: "Fear of missing out",
        audienceFraming: audience,
        exampleHeadline: "Act now to stay on track",
        exampleCopy: `A small move today can create outsized gains by the next key milestone - start while timing is on your side.`,
      },
    ];
  }, [campaign?.audienceSegment, campaign?.product, campaign?.tone]);

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
            <span className="font-mono text-xs tracking-widest" style={{ color: "#94a3b8" }}>LOADING</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const qualityTrend = analytics?.qualityTrend || [];
  const avgScores = analytics?.avgScores;
  const approvedAds = (ads || []).filter((ad: any) => ad.status === "approved" && ad.isPublishable);
  const approvedAdCount = approvedAds.length;
  const winnerIsA = abResult?.winner?.label === "A";
  const winnerIsB = abResult?.winner?.label === "B";
  const radarABData = abResult ? [
    { dim: "Clarity", adA: abResult.dimensions.find((d: any) => d.key === "clarity")?.a || 0, adB: abResult.dimensions.find((d: any) => d.key === "clarity")?.b || 0 },
    { dim: "Value Prop", adA: abResult.dimensions.find((d: any) => d.key === "valueProp")?.a || 0, adB: abResult.dimensions.find((d: any) => d.key === "valueProp")?.b || 0 },
    { dim: "CTA", adA: abResult.dimensions.find((d: any) => d.key === "cta")?.a || 0, adB: abResult.dimensions.find((d: any) => d.key === "cta")?.b || 0 },
    { dim: "Brand Voice", adA: abResult.dimensions.find((d: any) => d.key === "brandVoice")?.a || 0, adB: abResult.dimensions.find((d: any) => d.key === "brandVoice")?.b || 0 },
    { dim: "Emotional", adA: abResult.dimensions.find((d: any) => d.key === "emotionalResonance")?.a || 0, adB: abResult.dimensions.find((d: any) => d.key === "emotionalResonance")?.b || 0 },
  ] : [];

  const buildApprovedAdsExport = () => approvedAds.map((ad: any) => ({
    id: ad.id,
    score: typeof ad.qualityScore === "number" ? Number(ad.qualityScore.toFixed(1)) : null,
    primaryText: ad.primaryText || "",
    headline: ad.headline || "",
    description: ad.description || "",
    ctaButton: ad.ctaButton || "",
    platform: "meta",
  }));

  const getExportBaseFileName = () => {
    const safeCampaignName = (campaign.name || "campaign")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    return `ads_export_${safeCampaignName}_${date}`;
  };

  const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string | number | null) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const handleCopyAllApprovedAds = () => {
    if (approvedAdCount === 0) {
      toast.info("No approved ads to copy.");
      return;
    }
    const payload = buildApprovedAdsExport();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      toast.success(`Copied ${approvedAdCount} approved ads to clipboard`);
    });
  };

  const handleDownloadApprovedJson = () => {
    if (approvedAdCount === 0) {
      toast.info("No approved ads to download.");
      return;
    }
    const payload = buildApprovedAdsExport();
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `${getExportBaseFileName()}.json`,
      "application/json;charset=utf-8"
    );
  };

  const handleDownloadApprovedCsv = () => {
    if (approvedAdCount === 0) {
      toast.info("No approved ads to download.");
      return;
    }
    const payload = buildApprovedAdsExport();
    const headers = ["id", "score", "primaryText", "headline", "description", "ctaButton", "platform"];
    const rows = payload.map((item) =>
      headers.map((header) => escapeCsvValue((item as Record<string, string | number | null>)[header])).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    downloadTextFile(csv, `${getExportBaseFileName()}.csv`, "text/csv;charset=utf-8");
  };

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
            <button
              onClick={() => { setShowThresholdEditor(true); setThresholdInput(campaign.currentQualityThreshold.toFixed(1)); }}
              className="tag-ops tag-teal cursor-pointer hover:opacity-80 transition-opacity"
              style={{ border: "1px dashed rgba(52,211,153,0.5)", background: "rgba(52,211,153,0.06)" }}
              title="Click to adjust quality threshold">
              ⚙ Threshold: {campaign.currentQualityThreshold.toFixed(1)}/10
            </button>
            {showThresholdEditor && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(2,11,24,0.8)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <span className="font-mono text-xs text-emerald-400">SET:</span>
                <input
                  type="range" min="1.0" max="9.9" step="0.1"
                  value={thresholdInput || campaign.currentQualityThreshold}
                  onChange={e => setThresholdInput(e.target.value)}
                  className="w-24 accent-emerald-400"
                />
                <span className="font-mono text-[11px] text-emerald-300 w-8">{parseFloat(thresholdInput || String(campaign.currentQualityThreshold)).toFixed(1)}</span>
                <button
                  onClick={() => updateThresholdMutation.mutate({ campaignId, threshold: parseFloat(thresholdInput) })}
                  disabled={updateThresholdMutation.isPending}
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                  style={{ background: "rgba(52,211,153,0.2)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                  {updateThresholdMutation.isPending ? "..." : "Apply"}
                </button>
                <button onClick={() => setShowThresholdEditor(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
              </div>
            )}
            <span className="tag-ops tag-dim">{campaign.totalAdsGenerated} ads generated</span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
              style={{ border: "1px solid rgba(34,211,238,0.14)", background: optimisticAutopilotEnabled ? "rgba(52,211,153,0.06)" : "rgba(2,11,24,0.45)" }}>
              <motion.span
                animate={optimisticAutopilotEnabled ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.5 }}
                transition={optimisticAutopilotEnabled ? { repeat: Infinity, duration: 1.8 } : { duration: 0.2 }}
                className="font-mono text-xs tracking-widest"
                style={{ color: optimisticAutopilotEnabled ? "#34d399" : "rgba(148,163,184,0.7)" }}
              >
                AUTOPILOT
              </motion.span>
              <Switch
                checked={optimisticAutopilotEnabled}
                onCheckedChange={handleToggleAutopilot}
                className="data-[state=checked]:bg-emerald-500/80 data-[state=unchecked]:bg-slate-600/60 [&[data-state=checked]>span]:shadow-[0_0_8px_#22d3ee]"
              />
              <span className="font-mono text-xs"
                style={{ color: optimisticAutopilotEnabled ? "#34d399" : "rgba(148,163,184,0.55)" }}>
                {optimisticAutopilotEnabled ? "ACTIVE — runs every 24h" : "OFF"}
              </span>
            </div>
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
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>{label}</span>
              </div>
              <div className="font-display font-bold text-2xl" style={{ color: "#f8fafc", letterSpacing: "-0.03em" }}>{value}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Sticky Action Bar ── */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-6 py-4 rounded-2xl"
          style={{
            background: "rgba(2,8,20,0.92)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(34,211,238,0.15)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: "0 0 6px #22d3ee" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "rgba(34,211,238,0.7)" }}>
              Quick Actions
            </span>
          </div>
          <button
            onClick={() => document.getElementById("generation-engine-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Zap size={15} />
            Generate Ad
          </button>
          <button
            onClick={() => document.getElementById("generation-engine-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Layers size={15} />
            Batch Generate
          </button>
          <button
            onClick={() => toggleAutopilotMutation.mutate({ campaignId, enabled: !optimisticAutopilotEnabled })}
            className={optimisticAutopilotEnabled ? "btn-primary flex items-center gap-2 text-sm" : "btn-secondary flex items-center gap-2 text-sm"}
            disabled={toggleAutopilotMutation.isPending}
          >
            <Cpu size={15} />
            {optimisticAutopilotEnabled ? "Autopilot ON" : "Autopilot OFF"}
          </button>
        </div>

        {/* ── Autopilot Status ── */}
        {optimisticAutopilotEnabled && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
            className="ops-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4"
              style={{ borderBottom: showAutopilot ? "1px solid rgba(34,211,238,0.07)" : "none" }}
              onClick={() => setShowAutopilot(v => !v)}
            >
              <div className="flex items-center gap-3">
                <Bot size={14} style={{ color: "#34d399" }} />
                <div className="text-left">
                  <div className="font-mono font-semibold text-sm tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                    Autopilot Status
                  </div>
                  <div className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                    ACTIVE — runs every {autopilotStatus?.frequencyHours || 24}h
                  </div>
                </div>
              </div>
              <ChevronDown size={13} style={{ color: "#94a3b8", transform: showAutopilot ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            <AnimatePresence>
              {showAutopilot && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="rounded-lg p-3" style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                        <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: "#94a3b8" }}>NEXT RUN IN</div>
                        <div className="font-mono text-[12px] font-bold" style={{ color: "#22d3ee" }}>{formatNextRunCountdown(autopilotStatus?.nextRunAt)}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                        <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: "#94a3b8" }}>LAST RUN</div>
                        <div className="font-mono text-[12px] font-bold" style={{ color: "#e2e8f0" }}>{formatRelativeTime(autopilotStatus?.lastRunAt)}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                        <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: "#94a3b8" }}>TOTAL RUNS</div>
                        <div className="font-mono text-[12px] font-bold" style={{ color: "#34d399" }}>{autopilotStatus?.totalRuns || 0}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                        <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: "#94a3b8" }}>ADS GENERATED</div>
                        <div className="font-mono text-[12px] font-bold" style={{ color: "#f59e0b" }}>{(autopilotStatus?.totalRuns || 0) * 10}</div>
                      </div>
                    </div>

                    <div className="rounded-lg p-3" style={{ background: "rgba(2,11,24,0.6)", border: "1px solid rgba(34,211,238,0.08)" }}>
                      <div className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>
                        Recent Autopilot Runs
                      </div>
                      <div className="space-y-1.5">
                        {(autopilotRunLog.length > 0
                          ? autopilotRunLog
                          : Array.from({ length: Math.min(3, autopilotStatus?.totalRuns || 0) }).map((_, idx) => ({
                              at: autopilotStatus?.lastRunAt ? new Date(autopilotStatus.lastRunAt) : new Date(),
                              generated: 10,
                              approved: 0,
                              winnerScore: 0,
                            }))
                        ).slice(0, 3).map((entry, idx) => (
                          <div key={`run-${idx}`} className="flex items-center justify-between font-mono text-xs">
                            <span style={{ color: "rgba(148,163,184,0.7)" }}>{formatRelativeTime(entry.at)}</span>
                            <span style={{ color: "rgba(148,163,184,0.7)" }}>
                              {entry.generated} ads · {entry.approved} approved
                            </span>
                            <span style={{ color: "#22d3ee" }}>
                              {entry.winnerScore > 0 ? `winner ${entry.winnerScore.toFixed(1)}/10` : "completed"}
                            </span>
                          </div>
                        ))}
                        {(autopilotStatus?.totalRuns || 0) === 0 && autopilotRunLog.length === 0 && (
                          <div className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                            No runs yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => runAutopilotNowMutation.mutate({ campaignId, count: 10 })}
                      disabled={runAutopilotNowMutation.isPending}
                      className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Bot size={11} />
                      {runAutopilotNowMutation.isPending ? "Running..." : "Run Now"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Generation Engine ── */}
        <motion.div id="generation-engine-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="ops-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
            <div className="flex items-center gap-3">
              <Zap size={14} style={{ color: "#22d3ee" }} />
              <div>
                <div className="font-mono font-semibold text-sm tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
                  Generation Engine
                </div>
                <div className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                  generate → evaluate → self-heal → approve
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>Max iter:</span>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setMaxIterations(n)}
                  className="w-7 h-7 font-mono text-[11px] font-bold rounded transition-all"
                  style={{
                    background: maxIterations === n ? "rgba(34,211,238,0.1)" : "transparent",
                    color: maxIterations === n ? "#22d3ee" : "#94a3b8",
                    border: `1px solid ${maxIterations === n ? "rgba(34,211,238,0.3)" : "rgba(34,211,238,0.08)"}`,
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {isBulkGenerating ? (
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot" style={{ background: "#f87171" }} />
                  <div className="terminal-dot" style={{ background: "#f59e0b" }} />
                  <div className="terminal-dot" style={{ background: "#34d399" }} />
                  <span className="font-mono text-xs ml-2" style={{ color: "rgba(34,211,238,0.7)" }}>
                    adengine — bulk × 5 pipeline
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
            ) : isGenerating ? (
              <GenerationTheater
                campaignId={campaignId}
                mode={generationMode}
                maxIterations={maxIterations}
                isActive={isGenerating}
                onComplete={(result) => {
                  setIsGenerating(false);
                  setLogStep(0);
                  refetchAds();
                  refetchAnalytics();
                  if (result.isApproved) {
                    toast.success(`Ad approved. Score: ${result.finalScore.toFixed(1)}/10 in ${result.iterations} iteration(s)`);
                  } else {
                    toast.warning(`Below threshold. Best score: ${result.finalScore.toFixed(1)}/10`);
                  }
                }}
              />
            ) : (
              <div className="space-y-3">
                {/* Bulk × 5 result banner */}
                {bulkResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
                    <Trophy size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold" style={{ color: "#f59e0b" }}>BULK COMPLETE</span>
                      <span className="font-mono text-xs ml-2" style={{ color: "rgba(148,163,184,0.7)" }}>
                        {bulkResult.approvedCount}/{bulkResult.totalAdsGenerated} approved · Winner: {bulkResult.winnerScore.toFixed(1)}/10
                      </span>
                    </div>
                    <button onClick={handleGenerateBrief}
                      disabled={intelligenceBriefMutation.isPending}
                      className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs transition-all disabled:opacity-40"
                      style={{ border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
                      <Brain size={11} />
                      Intelligence Brief
                    </button>
                    <button onClick={() => setBulkResult(null)}
                      className="font-mono text-xs" style={{ color: "#94a3b8" }}>✕</button>
                    </div>

                    {intelligenceBriefMutation.isPending && (
                      <div className="px-4 py-3 rounded-lg font-mono text-xs"
                        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                        Analyzing campaign patterns...
                      </div>
                    )}

                    <AnimatePresence>
                      {showIntelligenceBrief && intelligenceBrief && (
                        <motion.div
                          initial={{ opacity: 0, x: 20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="rounded-lg p-5"
                          style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.3)" }}>
                          <div className="flex items-start gap-3 mb-4">
                            <Brain size={14} style={{ color: "#f59e0b", marginTop: 1 }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs tracking-widest uppercase" style={{ color: "#fbbf24" }}>
                                CAMPAIGN INTELLIGENCE BRIEF
                              </div>
                              <div className="font-mono text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>
                                Generated {new Date(intelligenceBrief.generatedAt).toLocaleString()} · Top tone: {intelligenceBrief.topTone} · Top format: {intelligenceBrief.topFormat} · Avg score: {intelligenceBrief.avgScore.toFixed(2)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={handleGenerateBrief}
                                disabled={intelligenceBriefMutation.isPending}
                                className="flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-all disabled:opacity-40"
                                style={{ border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", background: "rgba(245,158,11,0.07)" }}>
                                <Brain size={10} />
                                Regenerate Brief
                              </button>
                              <button onClick={handleCopyBrief}
                                className="flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-all"
                                style={{ border: "1px solid rgba(34,211,238,0.2)", color: "rgba(148,163,184,0.8)", background: "rgba(34,211,238,0.05)" }}>
                                <Copy size={10} />
                                Copy Brief
                              </button>
                            </div>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none font-sans"
                            style={{ color: "rgba(226,232,240,0.9)" }}>
                            <Streamdown>{intelligenceBrief.brief}</Streamdown>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                {/* ⚡ BATCH GENERATION ENGINE — up to 50 ads */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(34,211,238,0.03) 100%)" }}>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
                    <div className="flex items-center gap-2">
                      <Layers size={12} style={{ color: "#f59e0b" }} />
                      <span className="font-mono font-bold text-xs tracking-widest uppercase" style={{ color: "#f59e0b" }}>⚡ Batch Generation Engine</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>VARIETY MATRIX ACTIVE</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {/* Batch size selector */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>Batch Size</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([5, 10, 25, 50] as const).map(n => (
                          <button key={n} onClick={() => setBatchSize(n)}
                            className="py-1.5 rounded-lg font-mono font-bold text-[11px] tracking-wider transition-all"
                            style={{
                              background: batchSize === n ? "rgba(245,158,11,0.2)" : "rgba(2,11,24,0.6)",
                              border: batchSize === n ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(100,116,139,0.15)",
                              color: batchSize === n ? "#f59e0b" : "rgba(148,163,184,0.6)",
                            }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Batch info row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                          {batchSize} unique tone/format/hook combos
                        </span>
                        {batchSize >= 25 && (
                          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                            SELF-HEAL ENABLED
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                        ~{batchSize <= 5 ? "30s" : batchSize <= 10 ? "60s" : batchSize <= 25 ? "2-3min" : "4-6min"}
                      </span>
                    </div>
                    {/* Generate button */}
                    <button onClick={handleBulkGenerate} disabled={isBulkGenerating}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono font-bold text-[11px] tracking-widest uppercase transition-all disabled:opacity-50"
                      style={{
                        background: isBulkGenerating ? "rgba(245,158,11,0.06)" : "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(34,211,238,0.1) 100%)",
                        border: "1px solid rgba(245,158,11,0.35)",
                        color: "#f59e0b",
                      }}
                      onMouseEnter={e => { if (!isBulkGenerating) e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)"; }}>
                      <Layers size={13} />
                      {isBulkGenerating ? `Generating ${batchSize} Ads...` : `Generate ${batchSize} Ads — Race to Best`}
                    </button>
                  </div>
                </div>

                {/* Smart Prompt Expansion */}
                <div className="mt-4 rounded-lg p-4"
                  style={{ background: "rgba(2,11,24,0.55)", border: "1px solid rgba(34,211,238,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-mono text-xs tracking-widest uppercase" style={{ color: "#22d3ee" }}>
                      Smart Prompt Expansion
                    </div>
                    <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                      Generate from strategic angles
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {expandedAngles.map((angle, i) => (
                      <div key={`${angle.angleName}-${i}`} className="rounded-lg p-3"
                        style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                        <div className="font-mono text-xs font-bold mb-2" style={{ color: "#e2e8f0" }}>
                          {angle.angleName}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="tag-ops tag-teal">{angle.tone}</span>
                          <span className="tag-ops tag-dim">{angle.format}</span>
                          <span className="tag-ops tag-gold">{angle.emotionalHook}</span>
                        </div>
                        <div className="font-mono text-xs mb-2" style={{ color: "#94a3b8" }}>
                          Audience: {angle.audienceFraming}
                        </div>
                        <div className="rounded p-2 space-y-1 mb-3"
                          style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.06)" }}>
                          <div className="font-display text-sm" style={{ color: "#f8fafc" }}>{angle.exampleHeadline}</div>
                          <p className="font-mono text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.75)" }}>
                            {angle.exampleCopy}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setGeneratingAngleIdx(i);
                            toast.info(`Generating ad in "${angle.angleName}" angle - ${angle.tone} tone, ${angle.format} format`);
                            generateAndEvaluateMutation.mutate({
                              campaignId,
                              mode: "standard",
                              maxIterations: 3,
                            });
                          }}
                          disabled={generatingAngleIdx === i}
                          className="font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          style={{
                            border: "1px solid rgba(34,211,238,0.4)",
                            background: "rgba(34,211,238,0.06)",
                            color: "#22d3ee",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(34,211,238,0.12)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(34,211,238,0.06)")}
                        >
                          {generatingAngleIdx === i ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            "Generate ->"
                          )}
                        </button>
                      </div>
                    ))}
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
              <span className="font-mono font-semibold text-sm tracking-widest uppercase" style={{ color: "#e2e8f0" }}>
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
                    <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>{weights[d.key]}%</span>
                  </div>
                ))}
              </div>
              {showWeightTuner
                ? <ChevronUp size={14} style={{ color: "#94a3b8" }} />
                : <ChevronDown size={14} style={{ color: "#94a3b8" }} />
              }
            </div>
          </button>

          <AnimatePresence>
            {showWeightTuner && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
                <div className="px-6 py-5 space-y-4">
                  <p className="font-mono text-xs" style={{ color: "#94a3b8" }}>
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
                <XAxis dataKey="index" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ background: "rgba(2,11,24,0.95)", border: "1px solid rgba(34,211,238,0.15)", color: "#e2e8f0", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  formatter={(val: number) => [val.toFixed(2), "Score"]} />
                <ReferenceLine y={campaign.currentQualityThreshold} stroke="#34d399" strokeDasharray="4 4" strokeWidth={1} />
                <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2} dot={{ fill: "#22d3ee", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded" style={{ background: "#22d3ee" }} />
                <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>Quality Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded" style={{ background: "#34d399", opacity: 0.6 }} />
                <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>Threshold</span>
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
                      <span className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>{DIM_LABELS[key]}</span>
                      <span className="font-mono text-xs font-bold" style={{ color: DIM_COLORS[key] }}>{(val as number).toFixed(1)}</span>
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAllApprovedAds}
                disabled={approvedAdCount === 0}
                className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs transition-all disabled:opacity-40"
                style={{ border: "1px solid rgba(34,211,238,0.15)", color: "rgba(100,116,139,0.65)", background: "rgba(34,211,238,0.04)" }}>
                <Copy size={11} />
                {`Copy All Approved (${approvedAdCount})`}
              </button>
              <button
                onClick={handleDownloadApprovedJson}
                disabled={approvedAdCount === 0}
                className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs transition-all disabled:opacity-40"
                style={{ border: "1px solid rgba(34,211,238,0.15)", color: "rgba(100,116,139,0.65)", background: "rgba(34,211,238,0.04)" }}>
                <Download size={11} />
                Download JSON
              </button>
              <button
                onClick={handleDownloadApprovedCsv}
                disabled={approvedAdCount === 0}
                className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs transition-all disabled:opacity-40"
                style={{ border: "1px solid rgba(34,211,238,0.15)", color: "rgba(100,116,139,0.65)", background: "rgba(34,211,238,0.04)" }}>
                <Download size={11} />
                Download CSV
              </button>
            </div>
            <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>
              {ads?.length || 0} total · {ads?.filter((a: any) => a.status === "approved").length || 0} approved
            </span>
          </div>
          {(abPrimaryAdId || simulateABTestMutation.isPending) && (
            <div className="mb-4 px-4 py-3 rounded-lg font-mono text-xs flex items-center gap-2"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)", color: "rgba(245,158,11,0.95)" }}>
              <BarChart3 size={12} />
              {simulateABTestMutation.isPending
                ? "Running A/B simulation..."
                : `A/B base set to #${abPrimaryAdId}. Click A/B Test on another approved ad to compare.`}
            </div>
          )}

          {ads && ads.length > 0 ? (
            <div className="space-y-3">
              {ads.map(ad => (
                <AdCardWrapper key={ad.id} ad={ad}
                  isExpanded={expandedAdId === ad.id}
                  onToggle={() => setExpandedAdId(expandedAdId === ad.id ? null : ad.id)}
                  onABTestClick={handleABTestClick}
                  isABSelecting={!!abPrimaryAdId}
                  isABPrimary={abPrimaryAdId === ad.id}
                  isABTarget={!!abPrimaryAdId && abPrimaryAdId !== ad.id && ad.status === "approved"}
                  onSplitClick={handleSplitClick}
                />
              ))}
            </div>
          ) : (
            <div className="ops-card bracket py-16 text-center">
              <Zap size={24} style={{ color: "rgba(34,211,238,0.2)", margin: "0 auto 1rem" }} />
              <div className="section-label mb-2 text-center">No Ads Generated</div>
              <p className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                Use the generation engine above to create your first ad.
              </p>
            </div>
          )}
        </motion.div>

        <Dialog open={abOpen} onOpenChange={setAbOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden"
            style={{ background: "rgba(2,11,24,0.98)", border: "1px solid rgba(34,211,238,0.12)" }}>
            <div className="p-6 space-y-5">
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight" style={{ color: "#f8fafc" }}>
                  A/B Test Simulator
                </DialogTitle>
                <DialogDescription className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>
                  Predictive performance model based on evaluation dimensions and cost profile.
                </DialogDescription>
              </DialogHeader>

              {abResult && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs uppercase tracking-widest px-3 py-1 rounded"
                      style={{
                        color: "#f59e0b",
                        border: "1px solid rgba(245,158,11,0.35)",
                        background: "rgba(245,158,11,0.08)",
                      }}>
                      {abResult.winner.label === "tie" ? "Tie" : `Winner: Ad #${abResult.winner.adId}`}
                    </div>
                    <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
                      Confidence: <span style={{ color: "#f59e0b" }}>
                        <AnimatedMetricValue value={abResult.winner.confidencePct} decimals={0} suffix="%" />
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[abResult.adA, abResult.adB].map((ad: any, idx: number) => {
                      const isWinner = idx === 0 ? winnerIsA : winnerIsB;
                      const isLoser = abResult.winner.label !== "tie" && !isWinner;
                      return (
                        <div key={ad.id} className="rounded-lg p-4"
                          style={{
                            background: isWinner ? "rgba(245,158,11,0.08)" : "rgba(2,11,24,0.7)",
                            border: isWinner ? "1px solid rgba(245,158,11,0.32)" : "1px solid rgba(34,211,238,0.08)",
                            opacity: isLoser ? 0.65 : 1,
                          }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>Ad #{ad.id}</span>
                            {isWinner && <span className="tag-ops tag-gold">WINNER</span>}
                          </div>
                          <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(226,232,240,0.85)" }}>{ad.primaryText}</p>
                          <div className="font-display font-bold text-sm" style={{ color: "#f8fafc" }}>{ad.headline}</div>
                          {ad.description && <p className="font-mono text-xs mt-1" style={{ color: "rgba(100,116,139,0.55)" }}>{ad.description}</p>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Predicted CTR",
                        a: abResult.metrics.adA.ctr * 100,
                        b: abResult.metrics.adB.ctr * 100,
                        suffix: "%",
                        decimals: 2,
                      },
                      {
                        label: "Pred. Conversion",
                        a: abResult.metrics.adA.conversionRate * 100,
                        b: abResult.metrics.adB.conversionRate * 100,
                        suffix: "%",
                        decimals: 2,
                      },
                      {
                        label: "Estimated CPC",
                        a: abResult.metrics.adA.estimatedCpc ?? 0,
                        b: abResult.metrics.adB.estimatedCpc ?? 0,
                        prefix: "$",
                        decimals: 4,
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg p-4"
                        style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                        <div className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>
                          {metric.label}
                        </div>
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span style={{ color: winnerIsA ? "#f59e0b" : "rgba(226,232,240,0.82)" }}>
                            <AnimatedMetricValue value={metric.a} decimals={metric.decimals} suffix={metric.suffix || ""} prefix={metric.prefix || ""} />
                          </span>
                          <span style={{ color: "#94a3b8" }}>vs</span>
                          <span style={{ color: winnerIsB ? "#f59e0b" : "rgba(226,232,240,0.82)" }}>
                            <AnimatedMetricValue value={metric.b} decimals={metric.decimals} suffix={metric.suffix || ""} prefix={metric.prefix || ""} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4"
                      style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                      <div className="section-label mb-3">Radar Overlay</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarABData}>
                          <PolarGrid stroke="rgba(34,211,238,0.08)" />
                          <PolarAngleAxis dataKey="dim" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                          <Radar dataKey="adA" name={`Ad #${abResult.adA.id}`} stroke={winnerIsA ? "#f59e0b" : "#22d3ee"} fill={winnerIsA ? "#f59e0b" : "#22d3ee"} fillOpacity={0.1} />
                          <Radar dataKey="adB" name={`Ad #${abResult.adB.id}`} stroke={winnerIsB ? "#f59e0b" : "#a78bfa"} fill={winnerIsB ? "#f59e0b" : "#a78bfa"} fillOpacity={0.08} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg p-4"
                      style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                      <div className="section-label mb-3">Dimension Comparison</div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>Dimension</TableHead>
                            <TableHead className="font-mono text-xs text-right" style={{ color: "rgba(100,116,139,0.6)" }}>Ad A</TableHead>
                            <TableHead className="font-mono text-xs text-right" style={{ color: "rgba(100,116,139,0.6)" }}>Ad B</TableHead>
                            <TableHead className="font-mono text-xs text-right" style={{ color: "rgba(100,116,139,0.6)" }}>Leader</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {abResult.dimensions.map((dim: any) => (
                            <TableRow key={dim.key} className="border-white/5 hover:bg-white/[0.01]">
                              <TableCell className="font-mono text-xs" style={{ color: "rgba(226,232,240,0.8)" }}>{dim.label}</TableCell>
                              <TableCell className="font-mono text-xs text-right" style={{ color: "rgba(226,232,240,0.8)" }}>{dim.a.toFixed(2)}</TableCell>
                              <TableCell className="font-mono text-xs text-right" style={{ color: "rgba(226,232,240,0.8)" }}>{dim.b.toFixed(2)}</TableCell>
                              <TableCell className="font-mono text-xs text-right"
                                style={{ color: dim.leader === "tie" ? "rgba(100,116,139,0.6)" : "#f59e0b" }}>
                                {dim.leader === "tie" ? "Tie" : dim.leader === "A" ? `Ad #${abResult.adA.id}` : `Ad #${abResult.adB.id}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Audience Split Modal ── */}
        <Dialog open={splitOpen} onOpenChange={(open) => { setSplitOpen(open); if (!open) { setSplitVariants([]); setSplitSourceAdId(null); } }}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden"
            style={{ background: "rgba(2,11,24,0.98)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div className="p-6 space-y-5">
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight flex items-center gap-2" style={{ color: "#f8fafc" }}>
                  <Users size={16} style={{ color: "#a78bfa" }} />
                  AUDIENCE SPLIT
                </DialogTitle>
                <DialogDescription className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>
                  5 variants rewritten in parallel for each audience persona — "{splitSourceHeadline}"
                </DialogDescription>
              </DialogHeader>

              {splitByAudienceMutation.isPending && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "rgba(167,139,250,0.2)", borderTopColor: "#a78bfa" }} />
                  <span className="font-mono text-[11px] tracking-widest" style={{ color: "rgba(167,139,250,0.7)" }}>
                    Generating 5 audience variants in parallel...
                  </span>
                </div>
              )}

              {splitVariants.length > 0 && (() => {
                const PERSONA_COLORS: Record<string, string> = {
                  anxious_parent:    "#f87171",
                  budget_parent:     "#60a5fa",
                  high_achiever:     "#f59e0b",
                  skeptical_parent:  "#94a3b8",
                  lastminute_parent: "#fb923c",
                };
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {splitVariants.map((variant) => {
                      const color = PERSONA_COLORS[variant.personaId] || "#a78bfa";
                      const scoreColor = variant.score >= 8 ? "#34d399" : variant.score >= 7 ? "#22d3ee" : "#f87171";
                      return (
                        <div key={variant.personaId}
                          className="rounded-lg p-4 flex flex-col gap-3 transition-all cursor-default"
                          style={{
                            background: "rgba(2,11,24,0.7)",
                            border: `1px solid ${color}22`,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}66`)}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = `${color}22`)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold tracking-widest px-2 py-0.5 rounded"
                              style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}>
                              {variant.persona.toUpperCase()}
                            </span>
                            <span className="font-mono text-[11px] font-bold" style={{ color: scoreColor }}>
                              {variant.score.toFixed(1)}/10
                            </span>
                          </div>

                          <div>
                            <div className="font-display font-bold text-sm mb-1" style={{ color: "#f8fafc" }}>
                              {variant.headline}
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.75)" }}>
                              {variant.primaryText}
                            </p>
                          </div>

                          <p className="font-mono text-xs italic" style={{ color: "#22d3ee" }}>
                            {variant.personaRationale}
                          </p>

                          <button
                            onClick={() => {
                              if (!splitSourceAdId) return;
                              approveVariantMutation.mutate({
                                campaignId,
                                parentAdId: splitSourceAdId,
                                headline: variant.headline,
                                primaryText: variant.primaryText,
                                description: variant.description,
                                ctaButton: variant.ctaButton,
                                persona: variant.persona,
                              });
                            }}
                            disabled={approveVariantMutation.isPending}
                            className="mt-auto w-full py-2 rounded font-mono font-bold text-xs tracking-widest uppercase transition-all disabled:opacity-40"
                            style={{
                              background: `${color}12`,
                              border: `1px solid ${color}44`,
                              color,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = `${color}22`)}
                            onMouseLeave={e => (e.currentTarget.style.background = `${color}12`)}
                          >
                            Approve &amp; Save
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
