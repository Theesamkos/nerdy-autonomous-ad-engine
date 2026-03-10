import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DIMENSION_COLORS: Record<string, string> = {
  Clarity: "#00e5ff",
  "Value Prop": "#a78bfa",
  CTA: "#34d399",
  "Brand Voice": "#fbbf24",
  Emotional: "#f87171",
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = trpc.share.getSharedCampaign.useQuery({ token: token ?? "" }, {
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020b18" }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-sm text-[#00e5ff]/70 tracking-widest">LOADING CAMPAIGN DATA...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020b18" }}>
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="text-5xl font-mono text-[#00e5ff]/30">404</div>
          <h1 className="text-xl font-bold text-white">Share link not found</h1>
          <p className="text-sm text-white/50">This link may have expired or been removed.</p>
          <Link href="/">
            <button className="mt-4 px-6 py-2 border border-[#00e5ff]/40 text-[#00e5ff] font-mono text-sm rounded hover:bg-[#00e5ff]/10 transition-colors">
              ← RETURN HOME
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { campaign, approvedAds, bestAd, bestEval } = data;

  const chartData = bestEval ? [
    { name: "Clarity", score: bestEval.scoreClarity },
    { name: "Value Prop", score: bestEval.scoreValueProp },
    { name: "CTA", score: bestEval.scoreCta },
    { name: "Brand Voice", score: bestEval.scoreBrandVoice },
    { name: "Emotional", score: bestEval.scoreEmotionalResonance },
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: "#020b18" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded border border-[#00e5ff]/60 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#00e5ff] rounded-full" />
            </div>
            <span className="font-mono text-sm text-[#00e5ff] tracking-widest">ADENGINE v3</span>
          </div>
          <span className="font-mono text-xs text-white/30 tracking-wider">SHARED CAMPAIGN REPORT</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Campaign Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#00e5ff]/60 tracking-widest uppercase">Campaign</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono border border-[#00e5ff]/30 text-[#00e5ff]/70 uppercase">{campaign.status}</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/50 font-mono">
            <span>{campaign.product}</span>
            <span>·</span>
            <span className="capitalize">{campaign.campaignGoal}</span>
            <span>·</span>
            <span className="capitalize">{campaign.tone}</span>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "ADS GENERATED", value: campaign.totalAdsGenerated },
            { label: "APPROVED ADS", value: approvedAds.length },
            { label: "QUALITY THRESHOLD", value: campaign.currentQualityThreshold.toFixed(1) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 p-5 text-center" style={{ background: "rgba(10,36,72,0.6)" }}>
              <div className="text-2xl font-bold text-white font-mono">{value}</div>
              <div className="text-xs text-white/40 font-mono tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Best Ad */}
        {bestAd ? (
          <div className="rounded-xl border border-[#00e5ff]/30 p-6 space-y-6" style={{ background: "rgba(0,229,255,0.04)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#00e5ff] tracking-widest">TOP PERFORMING AD</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono border border-emerald-500/40 text-emerald-400">APPROVED</span>
              </div>
              {bestAd.qualityScore && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white/40">SCORE</span>
                  <span className="text-2xl font-bold text-[#00e5ff] font-mono">{bestAd.qualityScore.toFixed(1)}</span>
                  <span className="text-sm text-white/30 font-mono">/10</span>
                </div>
              )}
            </div>

            {/* Ad copy */}
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="font-mono text-xs text-white/30 mb-2 tracking-wider">PRIMARY TEXT</div>
                <p className="text-white/90 leading-relaxed">{bestAd.primaryText}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="font-mono text-xs text-white/30 mb-1 tracking-wider">HEADLINE</div>
                  <p className="text-white font-semibold">{bestAd.headline}</p>
                </div>
                <div className="rounded-lg border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="font-mono text-xs text-white/30 mb-1 tracking-wider">CTA BUTTON</div>
                  <p className="text-[#00e5ff] font-mono font-semibold">{bestAd.ctaButton}</p>
                </div>
              </div>
            </div>

            {/* Score chart */}
            {chartData.length > 0 && (
              <div>
                <div className="font-mono text-xs text-white/30 tracking-wider mb-4">QUALITY DIMENSIONS</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32 }}>
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "monospace" }} />
                      <Tooltip
                        contentStyle={{ background: "#0a2448", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8, fontFamily: "monospace", fontSize: 12 }}
                        labelStyle={{ color: "#00e5ff" }}
                        itemStyle={{ color: "rgba(255,255,255,0.8)" }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={DIMENSION_COLORS[entry.name] ?? "#00e5ff"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 p-8 text-center" style={{ background: "rgba(10,36,72,0.4)" }}>
            <p className="text-white/40 font-mono text-sm">No approved ads yet for this campaign.</p>
          </div>
        )}

        {/* All approved ads list */}
        {approvedAds.length > 1 && (
          <div className="space-y-4">
            <div className="font-mono text-xs text-white/30 tracking-widest">ALL APPROVED ADS ({approvedAds.length})</div>
            <div className="space-y-3">
              {approvedAds.map((ad, i) => (
                <div key={ad.id} className="rounded-lg border border-white/10 p-4 flex items-start gap-4" style={{ background: "rgba(10,36,72,0.4)" }}>
                  <div className="font-mono text-xs text-white/20 w-6 shrink-0 pt-0.5">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">{ad.primaryText}</p>
                    <p className="text-white/40 text-xs mt-1 font-mono">{ad.headline}</p>
                  </div>
                  {ad.qualityScore && (
                    <div className="shrink-0 font-mono text-sm font-bold text-[#00e5ff]">{ad.qualityScore.toFixed(1)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 pt-8 flex items-center justify-between">
          <span className="font-mono text-xs text-white/20">Generated by AdEngine v3 · Autonomous Ad Intelligence</span>
          <Link href="/">
            <button className="px-4 py-2 border border-[#00e5ff]/30 text-[#00e5ff] font-mono text-xs rounded hover:bg-[#00e5ff]/10 transition-colors tracking-wider">
              BUILD YOUR OWN →
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
