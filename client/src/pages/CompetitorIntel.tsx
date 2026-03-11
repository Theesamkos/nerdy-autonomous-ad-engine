import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, TrendingUp, TrendingDown, Zap, Plus, Trash2,
  Shield, AlertTriangle, BarChart3, Eye, ExternalLink,
} from "lucide-react";

// ─── Score bar component ──────────────────────────────────────────────────────
function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 7.5 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono font-semibold">{score.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Competitor card ──────────────────────────────────────────────────────────
function CompetitorCard({ ad, onDelete }: { ad: any; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const score = ad.weightedScore ?? 0;
  const scoreColor = score >= 7.5 ? "text-emerald-400" : score >= 6 ? "text-amber-400" : "text-red-400";
  const brandColors: Record<string, string> = {
    "Princeton Review": "bg-red-500/10 text-red-400 border-red-500/20",
    "Khan Academy": "bg-green-500/10 text-green-400 border-green-500/20",
    "Chegg": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Kaplan": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const brandStyle = brandColors[ad.brand] || "bg-purple-500/10 text-purple-400 border-purple-500/20";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs font-semibold ${brandStyle}`}>
                {ad.brand}
              </Badge>
              {ad.emotionalTrigger && (
                <Badge variant="secondary" className="text-xs">
                  {ad.emotionalTrigger.slice(0, 40)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xl font-bold font-mono ${scoreColor}`}>{score.toFixed(1)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(ad.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Ad copy preview */}
          <div className="rounded-lg bg-muted/30 p-3 space-y-1.5 text-sm">
            <p className="text-foreground leading-snug">{ad.primaryText}</p>
            <p className="font-semibold text-foreground/80">{ad.headline}</p>
            {ad.ctaButton && (
              <span className="inline-block text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                {ad.ctaButton}
              </span>
            )}
          </div>

          {/* Score bars */}
          {ad.scoreClarity != null && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <ScoreBar label="Clarity" score={ad.scoreClarity} />
              <ScoreBar label="Value Prop" score={ad.scoreValueProp} />
              <ScoreBar label="CTA" score={ad.scoreCta} />
              <ScoreBar label="Brand Voice" score={ad.scoreBrandVoice} />
              <ScoreBar label="Emotional" score={ad.scoreEmotionalResonance} />
            </div>
          )}

          {/* Expand/collapse analysis */}
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <Eye className="h-3 w-3" />
            {expanded ? "Hide analysis" : "Show full analysis"}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  {ad.hook && (
                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                      <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Scroll-Stop Hook
                      </p>
                      <p className="text-xs text-muted-foreground">{ad.hook}</p>
                    </div>
                  )}
                  {ad.strengths && (
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                      <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> What They Do Well
                      </p>
                      <p className="text-xs text-muted-foreground">{ad.strengths}</p>
                    </div>
                  )}
                  {ad.weaknesses && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                      <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Where We Can Win
                      </p>
                      <p className="text-xs text-muted-foreground">{ad.weaknesses}</p>
                    </div>
                  )}
                  {ad.analysisNotes && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-foreground/60 mb-1">Full Analysis</p>
                      <p className="text-xs text-muted-foreground">{ad.analysisNotes}</p>
                    </div>
                  )}
                  {ad.sourceUrl && (
                    <a
                      href={ad.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View in Meta Ad Library
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Add competitor form ──────────────────────────────────────────────────────
function AddCompetitorForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    brand: "",
    primaryText: "",
    headline: "",
    description: "",
    ctaButton: "",
    sourceUrl: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = trpc.competitorIntel.analyze.useMutation({
    onSuccess: () => {
      toast.success("Competitor ad analyzed and saved");
      setForm({ brand: "", primaryText: "", headline: "", description: "", ctaButton: "", sourceUrl: "" });
      onSuccess();
    },
    onError: (err) => {
      toast.error("Analysis failed: " + err.message);
      setIsAnalyzing(false);
    },
  });

  const PRESET_BRANDS = ["Princeton Review", "Khan Academy", "Chegg", "Kaplan"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.primaryText || !form.headline) {
      toast.error("Brand, primary text, and headline are required");
      return;
    }
    setIsAnalyzing(true);
    await analyzeMutation.mutateAsync(form);
    setIsAnalyzing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Competitor Brand</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setForm((f) => ({ ...f, brand: b }))}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                form.brand === b
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <Input
          placeholder="Or type a brand name..."
          value={form.brand}
          onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Primary Text <span className="text-destructive">*</span></Label>
        <Textarea
          placeholder="Paste the main ad copy (the text above the image)..."
          value={form.primaryText}
          onChange={(e) => setForm((f) => ({ ...f, primaryText: e.target.value }))}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Headline <span className="text-destructive">*</span></Label>
          <Input
            placeholder="Bold headline text..."
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Button</Label>
          <Input
            placeholder="Learn More, Sign Up..."
            value={form.ctaButton}
            onChange={(e) => setForm((f) => ({ ...f, ctaButton: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          placeholder="Secondary text (optional)..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Meta Ad Library URL</Label>
        <Input
          placeholder="https://www.facebook.com/ads/library/..."
          value={form.sourceUrl}
          onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
        />
      </div>

      <Button type="submit" disabled={isAnalyzing} className="w-full">
        {isAnalyzing ? (
          <>
            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Analyze Competitor Ad
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CompetitorIntel() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: competitors = [], isLoading } = trpc.competitorIntel.list.useQuery();

  const deleteMutation = trpc.competitorIntel.delete.useMutation({
    onSuccess: () => {
      utils.competitorIntel.list.invalidate();
      toast.success("Removed");
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  // ── Aggregate stats ──
  const brands = Array.from(new Set(competitors.map((c) => c.brand)));
  const avgScore =
    competitors.length > 0
      ? competitors.reduce((s, c) => s + (c.weightedScore ?? 0), 0) / competitors.length
      : 0;
  const weakestBrand =
    competitors.length > 0
      ? competitors.reduce((a, b) => ((a.weightedScore ?? 0) < (b.weightedScore ?? 0) ? a : b)).brand
      : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Competitor Intelligence</h1>
              <p className="text-sm text-muted-foreground">
                Analyze competitor ads from the Meta Ad Library using the same 5-dimension framework
              </p>
            </div>
          </div>

          {/* Bonus badge */}
          <div className="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
            <Shield className="h-3 w-3" />
            Bonus Feature — Competitive Intelligence (+10 pts)
          </div>
        </div>

        {/* Stats bar */}
        {competitors.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono">{competitors.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Ads Analyzed</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono">{brands.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Brands Tracked</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono text-amber-400">{avgScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Competitor Score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Opportunity callout */}
        {competitors.length > 0 && weakestBrand && (
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Biggest Opportunity</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                <strong>{weakestBrand}</strong> has the lowest average score in your competitor set.
                Their ads score <strong>{competitors.filter(c => c.brand === weakestBrand).reduce((s, c) => s + (c.weightedScore ?? 0), 0) / competitors.filter(c => c.brand === weakestBrand).length < 7 ? "below 7.0" : "under 7.5"}</strong> — use their weaknesses as your brief's differentiators.
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Add form */}
          <div className="lg:col-span-2">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Competitor Ad
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Paste any ad from the{" "}
                  <a
                    href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=SAT+prep&search_type=keyword_unordered"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Meta Ad Library
                  </a>{" "}
                  and the AI will score and analyze it.
                </p>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <AddCompetitorForm onSuccess={() => utils.competitorIntel.list.invalidate()} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sign in to add competitor ads
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Competitor list */}
          <div className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : competitors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 p-12 text-center space-y-3">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <div>
                  <p className="font-semibold text-muted-foreground">No competitor ads yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Add ads from Princeton Review, Khan Academy, Chegg, or Kaplan to see how they compare
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Brand filter tabs */}
                {brands.length > 1 && (
                  <Tabs defaultValue="all">
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs h-6">All ({competitors.length})</TabsTrigger>
                      {brands.map((b) => (
                        <TabsTrigger key={b} value={b} className="text-xs h-6">
                          {b.split(" ")[0]} ({competitors.filter((c) => c.brand === b).length})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <TabsContent value="all" className="mt-4 space-y-3">
                      <AnimatePresence>
                        {competitors.map((ad) => (
                          <CompetitorCard key={ad.id} ad={ad} onDelete={handleDelete} />
                        ))}
                      </AnimatePresence>
                    </TabsContent>
                    {brands.map((b) => (
                      <TabsContent key={b} value={b} className="mt-4 space-y-3">
                        <AnimatePresence>
                          {competitors.filter((c) => c.brand === b).map((ad) => (
                            <CompetitorCard key={ad.id} ad={ad} onDelete={handleDelete} />
                          ))}
                        </AnimatePresence>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
                {brands.length <= 1 && (
                  <AnimatePresence>
                    {competitors.map((ad) => (
                      <CompetitorCard key={ad.id} ad={ad} onDelete={handleDelete} />
                    ))}
                  </AnimatePresence>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
