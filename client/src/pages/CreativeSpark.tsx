import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bookmark, BookmarkCheck, Zap, Flame } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

const WILD_COLORS = [
  "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  "from-orange-500/20 to-red-500/20 border-orange-500/30",
  "from-green-500/20 to-teal-500/20 border-green-500/30",
  "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
  "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
  "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
  "from-red-500/20 to-pink-500/20 border-red-500/30",
];

function WildFactorBadge({ factor }: { factor: number }) {
  const flames = Math.ceil(factor / 2);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Flame
          key={i}
          className={`w-3.5 h-3.5 transition-all ${i < flames ? "text-orange-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{factor}/10</span>
    </div>
  );
}

export default function CreativeSpark() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [count, setCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: ideas, refetch } = trpc.creativeSpark.getIdeas.useQuery({ campaignId }, { enabled: !!campaignId });

  const generateMutation = trpc.creativeSpark.generate.useMutation({
    onSuccess: () => {
      setIsGenerating(false);
      refetch();
      toast.success("🌟 Creative sparks generated!");
    },
    onError: (err) => {
      setIsGenerating(false);
      toast.error(err.message);
    },
  });

  const toggleSaveMutation = trpc.creativeSpark.toggleSave.useMutation({
    onSuccess: () => refetch(),
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate({ campaignId, count });
  };

  const savedIdeas = ideas?.filter(i => i.isSaved) || [];
  const unsavedIdeas = ideas?.filter(i => !i.isSaved) || [];

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center glow-cyan">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Creative Spark</h1>
            <p className="text-sm text-muted-foreground">Unconstrained AI generates wild, out-of-the-box ad concepts</p>
          </div>
        </div>

        {/* Generate controls */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display font-semibold text-foreground">Ignite the Spark</h2>
              <p className="text-xs text-muted-foreground mt-0.5">The AI goes fully unconstrained — expect the unexpected</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Ideas to generate:</span>
              {[3, 6, 9].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`w-8 h-8 rounded-lg font-mono font-bold transition-all ${
                    count === n ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {isGenerating ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-muted-foreground font-mono">
                Unleashing the creative AI... breaking all the rules...
                <span className="typing-cursor" />
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerate} className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white glow-cyan">
              <Sparkles className="w-4 h-4" />
              Generate {count} Wild Ideas
            </Button>
          )}
        </div>

        {/* Saved ideas */}
        {savedIdeas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookmarkCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-foreground">Saved Ideas ({savedIdeas.length})</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedIdeas.map((idea, i) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  colorClass={WILD_COLORS[i % WILD_COLORS.length]}
                  onToggleSave={() => toggleSaveMutation.mutate({ ideaId: idea.id, isSaved: !idea.isSaved })}
                />
              ))}
            </div>
          </div>
        )}

        {/* All ideas */}
        {unsavedIdeas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display font-semibold text-foreground">
                {savedIdeas.length > 0 ? "More Ideas" : "Generated Ideas"} ({unsavedIdeas.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {unsavedIdeas.map((idea, i) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    colorClass={WILD_COLORS[(i + savedIdeas.length) % WILD_COLORS.length]}
                    onToggleSave={() => toggleSaveMutation.mutate({ ideaId: idea.id, isSaved: !idea.isSaved })}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!ideas || ideas.length === 0) && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 glow-cyan">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">No sparks yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Hit "Generate Wild Ideas" and watch the AI break every creative rule to produce something unforgettable.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function IdeaCard({ idea, colorClass, onToggleSave }: { idea: any; colorClass: string; onToggleSave: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`p-4 rounded-xl border bg-gradient-to-br ${colorClass} relative group`}
    >
      {/* Save button */}
      <button
        onClick={onToggleSave}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
      >
        {idea.isSaved ? (
          <BookmarkCheck className="w-4 h-4 text-cyan-400" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>

      {/* Angle badge */}
      {idea.angle && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/40 text-xs text-muted-foreground mb-3">
          <Zap className="w-3 h-3" />
          {idea.angle}
        </div>
      )}

      {/* Concept */}
      <h3 className="font-display font-bold text-foreground text-sm leading-snug mb-2">{idea.concept}</h3>

      {/* Hook */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 italic">"{idea.hook}"</p>

      {/* Wild factor */}
      <WildFactorBadge factor={idea.wildFactor} />
    </motion.div>
  );
}
