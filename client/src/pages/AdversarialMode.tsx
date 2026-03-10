import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, TrendingDown, Minus, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

export default function AdversarialMode() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [competitorText, setCompetitorText] = useState("");
  const [competitorSource, setCompetitorSource] = useState("");
  const [rounds, setRounds] = useState(2);
  const [result, setResult] = useState<any>(null);
  const [showOurAd, setShowOurAd] = useState(false);
  const [isBattling, setIsBattling] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: sessions, refetch } = trpc.adversarial.getSessions.useQuery({ campaignId }, { enabled: !!campaignId });

  const battleMutation = trpc.adversarial.runBattle.useMutation({
    onSuccess: (data) => {
      setIsBattling(false);
      setBattleLog([]);
      setResult(data);
      refetch();
      const icon = data.winStatus === "winning" ? "🏆" : data.winStatus === "losing" ? "😤" : "🤝";
      toast.success(`${icon} Battle complete! ${data.winStatus === "winning" ? "We won!" : data.winStatus === "losing" ? "Competitor wins this round." : "It's a tie!"}`);
    },
    onError: (err) => {
      setIsBattling(false);
      setBattleLog([]);
      toast.error(err.message);
    },
  });

  const handleBattle = () => {
    if (!competitorText.trim()) return;
    setIsBattling(true);
    setBattleLog([
      "⚔️ Analyzing competitor ad...",
      "🧠 Identifying weaknesses...",
      "✍️ Crafting superior counter-ads...",
    ]);
    setTimeout(() => setBattleLog(prev => [...prev, "📊 Evaluating both sides..."]), 3000);
    setTimeout(() => setBattleLog(prev => [...prev, "🏆 Determining winner..."]), 6000);
    battleMutation.mutate({ campaignId, competitorAdText: competitorText, competitorSource, rounds });
  };

  const WIN_CONFIG = {
    winning: { icon: Trophy, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "WE WIN" },
    losing: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "COMPETITOR WINS" },
    tied: { icon: Minus, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "TIE" },
    pending: { icon: Swords, color: "text-muted-foreground", bg: "bg-muted/30 border-border", label: "PENDING" },
  };

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center glow-pink">
            <Swords className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Ad-versarial Mode</h1>
            <p className="text-sm text-muted-foreground">Pit your AI ads against real competitor ads from Meta Ad Library</p>
          </div>
        </div>

        {/* Input */}
        <div className="p-5 rounded-xl bg-card border border-border/50 space-y-4">
          <h2 className="font-display font-semibold text-foreground">Enter Competitor Ad</h2>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Competitor Ad Copy</Label>
            <Textarea
              placeholder="Paste the competitor's ad text here. Copy it directly from Meta Ad Library or any other source..."
              value={competitorText}
              onChange={e => setCompetitorText(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Source <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Princeton Review, Khan Academy..."
                value={competitorSource}
                onChange={e => setCompetitorSource(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Battle Rounds</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRounds(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      rounds === n ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {n} {n === 1 ? "round" : "rounds"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isBattling ? (
            <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/30">
              {battleLog.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground font-mono"
                >
                  {i === battleLog.length - 1 ? (
                    <div className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <span className="text-green-400 flex-shrink-0">✓</span>
                  )}
                  {log}
                </motion.div>
              ))}
            </div>
          ) : (
            <Button
              onClick={handleBattle}
              disabled={!competitorText.trim()}
              className="w-full gap-2 bg-pink-600 hover:bg-pink-700 text-white glow-pink"
            >
              <Swords className="w-4 h-4" />
              Start Battle
            </Button>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Winner banner */}
              {(() => {
                const cfg = WIN_CONFIG[result.winStatus as keyof typeof WIN_CONFIG];
                const Icon = cfg.icon;
                return (
                  <div className={`p-5 rounded-xl border ${cfg.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-8 h-8 ${cfg.color}`} />
                      <div>
                        <div className={`font-display text-2xl font-bold ${cfg.color}`}>{cfg.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Our best: <span className={`font-bold ${cfg.color}`}>{result.ourBestScore.toFixed(1)}</span>
                          {" vs "}
                          Competitor: <span className="font-bold text-muted-foreground">{result.competitorScore.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-display text-4xl font-bold ${cfg.color}`}>
                        {(result.ourBestScore - result.competitorScore).toFixed(1) > "0" ? "+" : ""}{(result.ourBestScore - result.competitorScore).toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">score delta</div>
                    </div>
                  </div>
                );
              })()}

              {/* Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Our best ad */}
                {result.bestAd && (
                  <div className="p-4 rounded-xl bg-card border border-green-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold text-green-400 uppercase tracking-wider">Our Best Ad</div>
                      <div className="font-display font-bold text-green-400">{result.ourBestScore.toFixed(1)}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                      <p className="text-sm text-foreground leading-relaxed">{result.bestAd.primaryText}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold text-sm">{result.bestAd.headline}</span>
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">{result.bestAd.ctaButton}</span>
                      </div>
                    </div>
                    {result.bestEval && (
                      <ResponsiveContainer width="100%" height={140} className="mt-3">
                        <RadarChart data={[
                          { dim: "Clarity", score: result.bestEval.scoreClarity },
                          { dim: "Value Prop", score: result.bestEval.scoreValueProp },
                          { dim: "CTA", score: result.bestEval.scoreCta },
                          { dim: "Brand Voice", score: result.bestEval.scoreBrandVoice },
                          { dim: "Emotional", score: result.bestEval.scoreEmotionalResonance },
                        ]}>
                          <PolarGrid stroke="oklch(0.2 0.015 260)" />
                          <PolarAngleAxis dataKey="dim" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                          <Radar dataKey="score" stroke="oklch(0.72 0.2 145)" fill="oklch(0.72 0.2 145)" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Competitor ad */}
                <div className="p-4 rounded-xl bg-card border border-red-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                      Competitor {result.competitorSource ? `(${result.competitorSource})` : ""}
                    </div>
                    <div className="font-display font-bold text-red-400">{result.competitorScore.toFixed(1)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <p className="text-sm text-foreground leading-relaxed">{competitorText}</p>
                  </div>
                  {result.competitorEval && (
                    <ResponsiveContainer width="100%" height={140} className="mt-3">
                      <RadarChart data={[
                        { dim: "Clarity", score: result.competitorEval.scoreClarity },
                        { dim: "Value Prop", score: result.competitorEval.scoreValueProp },
                        { dim: "CTA", score: result.competitorEval.scoreCta },
                        { dim: "Brand Voice", score: result.competitorEval.scoreBrandVoice },
                        { dim: "Emotional", score: result.competitorEval.scoreEmotionalResonance },
                      ]}>
                        <PolarGrid stroke="oklch(0.2 0.015 260)" />
                        <PolarAngleAxis dataKey="dim" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                        <Radar dataKey="score" stroke="oklch(0.55 0.22 25)" fill="oklch(0.55 0.22 25)" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past sessions */}
        {sessions && sessions.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-foreground mb-3">Battle History</h2>
            <div className="space-y-2">
              {sessions.map(session => {
                const cfg = WIN_CONFIG[session.winStatus];
                const Icon = cfg.icon;
                return (
                  <div key={session.id} className={`p-3 rounded-xl border ${cfg.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <div>
                        <div className="text-sm text-foreground truncate max-w-xs">{session.competitorAdText.slice(0, 60)}...</div>
                        {session.competitorSource && <div className="text-xs text-muted-foreground">{session.competitorSource}</div>}
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
