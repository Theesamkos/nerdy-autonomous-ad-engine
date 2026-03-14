import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, ChevronDown, ChevronUp, ArrowLeft, Trophy, Shield, Target } from "lucide-react";
import { useState } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";

export default function AdversarialMode() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ competitorAdText: "", competitorBrand: "", rounds: 2 });
  const [isBattling, setIsBattling] = useState(false);

  const { data: sessions, refetch } = trpc.adversarial.getSessions.useQuery({ campaignId }, { enabled: !!campaignId });
  const { data: campaign } = trpc.campaigns.get.useQuery({ id: campaignId }, { enabled: !!campaignId });

  const runBattle = trpc.adversarial.runBattle.useMutation({
    onSuccess: (result) => {
      setIsBattling(false);
      setShowNewForm(false);
      setForm({ competitorAdText: "", competitorBrand: "", rounds: 2 });
      toast.success(`Battle complete. Ours: ${result.ourBestScore.toFixed(1)} vs Theirs: ${result.competitorScore.toFixed(1)}`);
      refetch();
    },
    onError: (err) => { setIsBattling(false); toast.error(err.message); },
  });

  const wins = sessions ? sessions.filter(s => s.winStatus === "winning").length : 0;
  const winRate = sessions && sessions.length > 0 ? Math.round(wins / sessions.length * 100) : 0;

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4 mb-4">
            <Link href={"/campaigns/" + campaignId}>
              <button className="btn-secondary p-2.5 flex-shrink-0"><ArrowLeft size={14} /></button>
            </Link>
            <div>
              <div className="section-label mb-1.5">Ad-versarial Mode</div>
              <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
                Competitive Intelligence
              </h1>
              <p className="font-mono text-xs mt-1.5 max-w-xl" style={{ color: "#94a3b8" }}>
                Pit your AI-generated ads against real competitor ads. The engine analyzes both, scores across 5 dimensions, and iteratively improves until yours wins.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-4">
          {[
            { icon: Swords,  label: "Total Battles", value: sessions?.length || 0,                      color: "#f87171" },
            { icon: Trophy,  label: "Win Rate",       value: winRate + "%",                              color: "#34d399" },
            { icon: Target,  label: "Campaign",       value: (campaign?.name || "---").slice(0, 16),    color: "#22d3ee" },
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

        {/* New Battle */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button onClick={() => setShowNewForm(!showNewForm)}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={14} /> New Battle
          </button>
          <AnimatePresence>
            {showNewForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden">
                <div className="ops-card rounded-t-none p-6 space-y-5"
                  style={{ borderTop: "none", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <div className="section-label">Competitor Intelligence</div>
                  <div>
                    <label className="ops-label">Competitor Brand</label>
                    <input type="text" placeholder="e.g. Princeton Review, Khan Academy"
                      value={form.competitorBrand} onChange={e => setForm(f => ({ ...f, competitorBrand: e.target.value }))}
                      className="ops-input" />
                  </div>
                  <div>
                    <label className="ops-label">Competitor Ad Copy</label>
                    <textarea placeholder="Paste the full competitor ad text here..."
                      value={form.competitorAdText} onChange={e => setForm(f => ({ ...f, competitorAdText: e.target.value }))}
                      className="ops-input min-h-[120px] resize-none" />
                  </div>
                  <div>
                    <label className="ops-label mb-3">Battle Rounds</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => setForm(f => ({ ...f, rounds: n }))}
                          className="flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider rounded-lg transition-all"
                          style={{
                            background: form.rounds === n ? "rgba(34,211,238,0.08)" : "rgba(8,24,48,0.5)",
                            border: `1px solid ${form.rounds === n ? "rgba(34,211,238,0.25)" : "rgba(34,211,238,0.06)"}`,
                            color: form.rounds === n ? "#22d3ee" : "#94a3b8",
                          }}>
                          {n} {n === 1 ? "Round" : "Rounds"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNewForm(false)} className="btn-secondary flex-1 flex items-center justify-center">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setIsBattling(true);
                        runBattle.mutate({ campaignId, competitorAdText: form.competitorAdText, competitorSource: form.competitorBrand, rounds: form.rounds });
                      }}
                      disabled={!form.competitorAdText || !form.competitorBrand || isBattling}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-30">
                      {isBattling
                        ? <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                            style={{ borderColor: "rgba(34,211,238,0.3)", borderTopColor: "#22d3ee" }} /> Running...</>
                        : <><Swords size={13} /> Run Battle</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Battle History */}
        {sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const isExpanded = expandedId === session.id;
              const winning = session.winStatus === "winning";
              return (
                <motion.div key={session.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="ops-card overflow-hidden"
                  style={{ borderColor: winning ? "rgba(52,211,153,0.2)" : undefined }}>
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-1 min-h-[32px] rounded-full flex-shrink-0"
                        style={{ background: winning ? "#34d399" : "rgba(34,211,238,0.1)" }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-display font-semibold text-sm" style={{ color: "#e2e8f0" }}>
                            {session.competitorSource || "Competitor"}
                          </span>
                          <span className={`tag-ops ${session.winStatus === "winning" ? "tag-green" : session.winStatus === "losing" ? "tag-red" : "tag-dim"}`}>
                            {session.winStatus}
                          </span>
                        </div>
                        <p className="font-mono text-xs truncate" style={{ color: "#94a3b8" }}>
                          {(session.competitorAdText || "").slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs mb-0.5" style={{ color: "#94a3b8" }}>Rounds</div>
                        <div className="font-mono font-bold text-sm" style={{ color: "#f8fafc" }}>{session.roundsCompleted}</div>
                      </div>
                      <button onClick={() => setExpandedId(isExpanded ? null : session.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "#94a3b8", background: "rgba(34,211,238,0.04)" }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
                        <div className="p-5 space-y-4">
                          <div>
                            <div className="section-label mb-3">Competitor Ad</div>
                            <div className="rounded-lg p-4"
                              style={{ background: "rgba(2,11,24,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}>
                              <p className="font-mono text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>
                                {session.competitorAdText}
                              </p>
                            </div>
                          </div>
                          {session.bestOurAdId && (
                            <div>
                              <div className="section-label mb-2">Best Ad ID</div>
                              <span className="tag-ops tag-teal">Ad #{session.bestOurAdId}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="ops-card bracket py-16 text-center">
            <Swords size={24} style={{ color: "rgba(34,211,238,0.2)", margin: "0 auto 1rem" }} />
            <div className="section-label mb-2 text-center">No Battles Yet</div>
            <p className="font-mono text-xs" style={{ color: "#94a3b8" }}>
              Create a new battle above to pit your AI-generated ads against a competitor.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
