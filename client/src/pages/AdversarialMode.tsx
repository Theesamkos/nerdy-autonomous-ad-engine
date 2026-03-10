import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, ChevronDown, ChevronUp, ArrowLeft, Trophy, Shield } from "lucide-react";
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
      toast.success("Battle complete. Our: " + result.ourBestScore.toFixed(1) + " vs Theirs: " + result.competitorScore.toFixed(1));
      refetch();
    },
    onError: (err) => { setIsBattling(false); toast.error(err.message); },
  });

  const wins = sessions ? sessions.filter(s => s.winStatus === "winning").length : 0;
  const winRate = sessions && sessions.length > 0 ? Math.round(wins / sessions.length * 100) : 0;

  return (
    <AppLayout campaignId={campaignId} campaignName={campaign?.name}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Link href={"/campaigns/" + campaignId}>
              <button className="btn-ops btn-ops-ghost px-3 py-2 text-xs">
                <ArrowLeft className="w-3 h-3" />
              </button>
            </Link>
            <div>
              <div className="section-label mb-1">Ad-versarial Mode</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Competitive Intelligence</h1>
            </div>
          </div>
          <p className="font-mono text-[10px] text-[#383838] max-w-xl">
            Pit your AI-generated ads against real competitor ads. The engine analyzes both, scores them across 5 dimensions, and iteratively improves your ad until it wins.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Swords, label: "Total Battles", value: sessions?.length || 0, color: "#c8a84b" },
            { icon: Trophy, label: "Win Rate", value: winRate + "%", color: "#4ade80" },
            { icon: Shield, label: "Campaign", value: (campaign?.name || "---").slice(0, 16), color: "#60a5fa" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[rgba(8,24,48,0.6)] px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3 h-3" style={{ color }} />
                <div className="section-label">{label}</div>
              </div>
              <div className="font-mono text-xl font-black text-white">{value}</div>
            </div>
          ))}
        </div>

        <div>
          <button onClick={() => setShowNewForm(!showNewForm)} className="btn-ops btn-ops-primary w-full justify-center">
            <Plus className="w-3 h-3" /> New Battle
          </button>
          <AnimatePresence>
            {showNewForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border border-[#1a1a1a] border-t-0 p-5 bg-[rgba(8,24,48,0.6)] space-y-4">
                  <div className="section-label">Competitor Intelligence</div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest uppercase text-[#555] mb-2">Competitor Brand</label>
                    <input type="text" placeholder="e.g. Princeton Review, Khan Academy"
                      value={form.competitorBrand} onChange={e => setForm(f => ({ ...f, competitorBrand: e.target.value }))}
                      className="ops-input w-full" />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest uppercase text-[#555] mb-2">Competitor Ad Copy</label>
                    <textarea placeholder="Paste the full competitor ad text here..."
                      value={form.competitorAdText} onChange={e => setForm(f => ({ ...f, competitorAdText: e.target.value }))}
                      className="ops-input w-full min-h-[120px] resize-none" />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest uppercase text-[#555] mb-2">Battle Rounds</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => setForm(f => ({ ...f, rounds: n }))}
                          className={"flex-1 py-2 font-mono text-[10px] uppercase tracking-wider border transition-all " + (form.rounds === n ? "border-[#c8a84b]/40 text-[#c8a84b] bg-[#c8a84b]/08" : "border-[#1a1a1a] text-[#555] hover:border-[#333]")}>
                          {n} {n === 1 ? "Round" : "Rounds"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNewForm(false)} className="btn-ops btn-ops-ghost flex-1 justify-center">Cancel</button>
                    <button
                      onClick={() => { setIsBattling(true); runBattle.mutate({ campaignId, competitorAdText: form.competitorAdText, competitorSource: form.competitorBrand, rounds: form.rounds }); }}
                      disabled={!form.competitorAdText || !form.competitorBrand || isBattling}
                      className="btn-ops btn-ops-primary flex-1 justify-center disabled:opacity-30"
                    >
                      {isBattling
                        ? <><div className="w-2.5 h-2.5 border border-[#c8a84b]/30 border-t-[#c8a84b] rounded-full animate-spin" /> Running...</>
                        : <><Swords className="w-3 h-3" /> Run Battle</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="space-y-px">
            {sessions.map((session, i) => {
              const isExpanded = expandedId === session.id;
              const winning = session.winStatus === "winning";
              return (
                <motion.div key={session.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={"border overflow-hidden " + (winning ? "border-[#c8a84b]/20" : "border-[#1a1a1a]")}>
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={"w-1 min-h-[32px] flex-shrink-0 " + (winning ? "bg-[#c8a84b]" : "bg-[#1a1a1a]")} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[10px] font-bold text-white">{session.competitorSource || "Competitor"}</span>
                          <span className={"font-mono text-[8px] px-2 py-0.5 uppercase tracking-wider border " + (session.winStatus === "winning" ? "text-[#c8a84b] border-[#c8a84b]/20" : session.winStatus === "losing" ? "text-[#f87171] border-[#f87171]/20" : "text-[#555] border-[#1a1a1a]")}>
                            {session.winStatus}
                          </span>
                        </div>
                        <p className="font-mono text-[9px] text-[#383838] truncate">{(session.competitorAdText || "").slice(0, 80)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-[8px] text-[#555] mb-0.5">Rounds</div>
                        <div className="font-mono text-sm font-black text-white">{session.roundsCompleted}</div>
                      </div>
                      <button onClick={() => setExpandedId(isExpanded ? null : session.id)} className="text-[#333] hover:text-[#c8a84b] transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="border-t border-[#0f0f0f] overflow-hidden">
                        <div className="p-5 space-y-4">
                          <div>
                            <div className="section-label mb-3">Competitor Ad</div>
                            <div className="border border-[#1a1a1a] p-3 bg-[rgba(2,11,24,0.8)]">
                              <p className="font-mono text-[10px] text-[#555] leading-relaxed">{session.competitorAdText}</p>
                            </div>
                          </div>
                          {session.bestOurAdId && (
                            <div>
                              <div className="section-label mb-2">Best Ad ID</div>
                              <div className="font-mono text-[10px] text-[#c8a84b]">Ad #{session.bestOurAdId}</div>
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
          <div className="bracket border border-dashed border-[#1a1a1a] p-12 text-center">
            <Swords className="w-6 h-6 text-[#2a2a2a] mx-auto mb-4" />
            <div className="section-label mb-2 text-center">No Battles Yet</div>
            <p className="font-mono text-[10px] text-[#383838]">Create a new battle above to pit your AI-generated ads against a competitor.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
