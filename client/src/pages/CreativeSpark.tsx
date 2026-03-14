import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, RefreshCw, Bookmark, BookmarkCheck, Zap } from "lucide-react";
import { useState } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";

const ACCENT_COLORS = ["#22d3ee", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#818cf8", "#fb923c", "#60a5fa"];

function SparkCard({ idea, index, color, onToggleSave }: { idea: any; index: number; color: string; onToggleSave: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: index * 0.04 }}
      className="ops-card p-5 group relative overflow-hidden"
      style={{ borderTop: `2px solid ${color}35` }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={12} style={{ color }} />
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>
            Spark {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <button onClick={onToggleSave} className="transition-colors"
          style={{ color: idea.isSaved ? color : "#94a3b8" }}>
          {idea.isSaved
            ? <BookmarkCheck size={14} style={{ color }} />
            : <Bookmark size={14} />
          }
        </button>
      </div>

      {/* Angle badge */}
      {idea.angle && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 mb-3 rounded font-mono text-xs uppercase tracking-wider"
          style={{ borderColor: `${color}30`, border: `1px solid ${color}30`, color }}>
          {idea.angle}
        </div>
      )}

      {/* Concept */}
      <h3 className="font-display font-bold text-sm leading-tight tracking-tight mb-3" style={{ color: "#f8fafc" }}>
        {idea.concept}
      </h3>

      {/* Hook */}
      <p className="font-mono text-xs leading-relaxed italic mb-4" style={{ color: "rgba(148,163,184,0.55)" }}>
        "{idea.hook}"
      </p>

      {/* Wildness meter */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#94a3b8" }}>Wildness</span>
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 10 }).map((_, j) => (
            <div key={j} className="flex-1 h-1 rounded-full"
              style={{ background: j < (idea.wildFactor || 0) ? color : "rgba(34,211,238,0.06)" }} />
          ))}
        </div>
        <span className="font-mono text-xs font-bold" style={{ color }}>{idea.wildFactor}/10</span>
      </div>
    </motion.div>
  );
}

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

  const savedIdeas   = ideas?.filter(i => i.isSaved)  || [];
  const unsavedIdeas = ideas?.filter(i => !i.isSaved) || [];

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4 mb-4">
            <Link href={"/campaigns/" + campaignId}>
              <button className="btn-secondary p-2.5 flex-shrink-0"><ArrowLeft size={14} /></button>
            </Link>
            <div>
              <div className="section-label mb-1.5">Creative Spark</div>
              <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
                Unconstrained Ideation
              </h1>
              <p className="font-mono text-xs mt-1.5 max-w-xl" style={{ color: "#94a3b8" }}>
                The engine removes all guardrails and generates wild, unexpected, boundary-pushing ad concepts. Raw creative fuel.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="ops-card p-6 space-y-5">
          <div className="section-label">Generation Parameters</div>
          <div>
            <label className="ops-label mb-3">Number of Sparks</label>
            <div className="flex gap-2">
              {[3, 6, 9].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className="flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider rounded-lg transition-all"
                  style={{
                    background: count === n ? "rgba(34,211,238,0.08)" : "rgba(8,24,48,0.5)",
                    border: `1px solid ${count === n ? "rgba(34,211,238,0.25)" : "rgba(34,211,238,0.06)"}`,
                    color: count === n ? "#22d3ee" : "#94a3b8",
                  }}>
                  {n} Ideas
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => generate.mutate({ campaignId, count })} disabled={generate.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {generate.isPending
              ? <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: "rgba(34,211,238,0.3)", borderTopColor: "#22d3ee" }} /> Igniting Sparks...</>
              : <><Sparkles size={13} /> Generate Creative Sparks</>
            }
          </button>
        </motion.div>

        {/* Saved ideas */}
        {savedIdeas.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <BookmarkCheck size={13} style={{ color: "#f59e0b" }} />
              <div className="section-label">Saved Sparks ({savedIdeas.length})</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedIdeas.map((idea, i) => (
                <SparkCard key={idea.id} idea={idea} index={i} color={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                  onToggleSave={() => toggleSave.mutate({ ideaId: idea.id, isSaved: !idea.isSaved })} />
              ))}
            </div>
          </motion.div>
        )}

        {/* All ideas */}
        {unsavedIdeas.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: "#94a3b8" }} />
                <div className="section-label">
                  {savedIdeas.length > 0 ? "More Sparks" : "Generated Sparks"} ({unsavedIdeas.length})
                </div>
              </div>
              <button onClick={() => generate.mutate({ campaignId, count })} disabled={generate.isPending}
                className="btn-secondary flex items-center gap-2 text-xs">
                <RefreshCw size={11} className={generate.isPending ? "animate-spin" : ""} /> Regenerate
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {unsavedIdeas.map((idea, i) => (
                  <SparkCard key={idea.id} idea={idea} index={i + savedIdeas.length}
                    color={ACCENT_COLORS[(i + savedIdeas.length) % ACCENT_COLORS.length]}
                    onToggleSave={() => toggleSave.mutate({ ideaId: idea.id, isSaved: !idea.isSaved })} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {(!ideas || ideas.length === 0) && !generate.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="ops-card bracket py-16 text-center">
            <div className="flex justify-center gap-3 mb-6">
              {ACCENT_COLORS.slice(0, 4).map((color, i) => (
                <Sparkles key={i} size={18} style={{ color, opacity: 0.3 }} />
              ))}
            </div>
            <div className="section-label mb-2 text-center">No Sparks Yet</div>
            <p className="font-mono text-xs max-w-xs mx-auto" style={{ color: "#94a3b8" }}>
              Hit "Generate Creative Sparks" to ignite the unconstrained ideation engine. Expect the unexpected.
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        <AnimatePresence>
          {generate.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="ops-card p-10 text-center space-y-5">
              <div className="flex justify-center gap-3">
                {ACCENT_COLORS.slice(0, 4).map((color, i) => (
                  <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                    <Sparkles size={16} style={{ color }} />
                  </motion.div>
                ))}
              </div>
              <div className="font-mono text-[11px]" style={{ color: "rgba(148,163,184,0.6)" }}>
                Igniting unconstrained ideation engine...
              </div>
              <div className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                Removing guardrails. Thinking without limits.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
