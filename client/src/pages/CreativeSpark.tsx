import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, RefreshCw, Bookmark, BookmarkCheck, Zap, Flame } from "lucide-react";
import { useState } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";

const ACCENT_COLORS = ["#c8a84b", "#f97316", "#a78bfa", "#22d3ee", "#4ade80", "#f43f5e", "#818cf8", "#fb923c", "#34d399"];

export default function CreativeSpark() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [count, setCount] = useState(6);

  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });
  const { data: ideas, refetch } = trpc.creativeSpark.getIdeas.useQuery({ campaignId }, { enabled: !!campaignId });

  const generate = trpc.creativeSpark.generate.useMutation({
    onSuccess: () => { refetch(); toast.success("Creative sparks generated."); },
    onError: (err) => toast.error(err.message),
  });

  const toggleSave = trpc.creativeSpark.toggleSave.useMutation({
    onSuccess: () => refetch(),
  });

  const savedIdeas = ideas?.filter(i => i.isSaved) || [];
  const unsavedIdeas = ideas?.filter(i => !i.isSaved) || [];

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
              <div className="section-label mb-1">Creative Spark</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Unconstrained Ideation</h1>
            </div>
          </div>
          <p className="font-mono text-[10px] text-[#383838] max-w-xl">
            The engine removes all guardrails and generates wild, unexpected, boundary-pushing ad concepts. These are not polished ads — they are sparks. Raw creative fuel.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="border border-[#1a1a1a] p-5 bg-[#060606] space-y-4">
          <div className="section-label">Generation Parameters</div>
          <div>
            <label className="block font-mono text-[9px] tracking-widest uppercase text-[#555] mb-3">Number of Sparks</label>
            <div className="flex gap-2">
              {[3, 6, 9].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className={"flex-1 py-2.5 font-mono text-[10px] uppercase tracking-wider border transition-all " + (count === n ? "border-[#c8a84b]/40 text-[#c8a84b] bg-[#c8a84b]/05" : "border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-[#888]")}>
                  {n} Ideas
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => generate.mutate({ campaignId, count })} disabled={generate.isPending}
            className="btn-ops btn-ops-primary w-full justify-center">
            {generate.isPending
              ? <><div className="w-2.5 h-2.5 border border-[#c8a84b]/30 border-t-[#c8a84b] rounded-full animate-spin" /> Igniting Sparks...</>
              : <><Sparkles className="w-3 h-3" /> Generate Creative Sparks</>
            }
          </button>
        </div>

        {/* Saved ideas */}
        {savedIdeas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookmarkCheck className="w-3 h-3 text-[#c8a84b]" />
              <div className="section-label">Saved Sparks ({savedIdeas.length})</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#0f0f0f]">
              {savedIdeas.map((idea, i) => (
                <SparkCard key={idea.id} idea={idea} index={i} color={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                  onToggleSave={() => toggleSave.mutate({ ideaId: idea.id, isSaved: !idea.isSaved })} />
              ))}
            </div>
          </div>
        )}

        {/* All ideas */}
        {unsavedIdeas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#383838]" />
                <div className="section-label">{savedIdeas.length > 0 ? "More Sparks" : "Generated Sparks"} ({unsavedIdeas.length})</div>
              </div>
              <button onClick={() => generate.mutate({ campaignId, count })} disabled={generate.isPending}
                className="btn-ops btn-ops-ghost text-xs">
                <RefreshCw className={"w-3 h-3 " + (generate.isPending ? "animate-spin" : "")} /> Regenerate
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#0f0f0f]">
              <AnimatePresence>
                {unsavedIdeas.map((idea, i) => (
                  <SparkCard key={idea.id} idea={idea} index={i + savedIdeas.length} color={ACCENT_COLORS[(i + savedIdeas.length) % ACCENT_COLORS.length]}
                    onToggleSave={() => toggleSave.mutate({ ideaId: idea.id, isSaved: !idea.isSaved })} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!ideas || ideas.length === 0) && !generate.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bracket border border-dashed border-[#1a1a1a] p-16 text-center">
            <div className="flex justify-center gap-3 mb-6">
              {ACCENT_COLORS.slice(0, 4).map((color, i) => (
                <Sparkles key={i} className="w-5 h-5" style={{ color, opacity: 0.3 }} />
              ))}
            </div>
            <div className="section-label mb-2 text-center">No Sparks Yet</div>
            <p className="font-mono text-[10px] text-[#383838] max-w-xs mx-auto">
              Hit "Generate Creative Sparks" to ignite the unconstrained ideation engine. Expect the unexpected.
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        <AnimatePresence>
          {generate.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="border border-[#1a1a1a] p-8 text-center space-y-4">
              <div className="flex justify-center gap-2">
                {ACCENT_COLORS.slice(0, 4).map((color, i) => (
                  <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                    <Sparkles className="w-4 h-4" style={{ color }} />
                  </motion.div>
                ))}
              </div>
              <div className="font-mono text-[10px] text-[#555]">Igniting unconstrained ideation engine...</div>
              <div className="font-mono text-[9px] text-[#333]">Removing guardrails. Thinking without limits.</div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}

function SparkCard({ idea, index, color, onToggleSave }: { idea: any; index: number; color: string; onToggleSave: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04 }}
      className="bg-[#060606] p-5 group relative"
      style={{ borderTop: "2px solid " + color + "30" }}
    >
      {/* Index + save */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" style={{ color }} />
          <span className="font-mono text-[8px] tracking-widest uppercase text-[#333]">Spark {String(index + 1).padStart(2, "0")}</span>
        </div>
        <button onClick={onToggleSave} className="text-[#333] hover:text-[#c8a84b] transition-colors">
          {idea.isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-[#c8a84b]" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Angle badge */}
      {idea.angle && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 mb-3 border text-[8px] font-mono uppercase tracking-wider" style={{ borderColor: color + "30", color }}>
          {idea.angle}
        </div>
      )}

      {/* Concept */}
      <h3 className="font-black text-sm text-white leading-tight tracking-tight mb-3">
        {idea.concept}
      </h3>

      {/* Hook */}
      <p className="font-mono text-[10px] text-[#555] leading-relaxed italic mb-4">
        "{idea.hook}"
      </p>

      {/* Wild factor */}
      <div className="flex items-center gap-2">
        <div className="font-mono text-[8px] text-[#333] tracking-widest uppercase">Wildness</div>
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 10 }).map((_, j) => (
            <div key={j} className="flex-1 h-1" style={{ background: j < (idea.wildFactor || 0) ? color : "#111" }} />
          ))}
        </div>
        <div className="font-mono text-[8px] font-bold" style={{ color }}>
          {idea.wildFactor}/10
        </div>
      </div>
    </motion.div>
  );
}
