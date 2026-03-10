import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Plus, Zap, BarChart3, CheckCircle, Activity, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "ACTIVE",    color: "#4ade80", bg: "rgba(74,222,128,0.08)"  },
  paused:    { label: "PAUSED",    color: "#c8a84b", bg: "rgba(200,168,75,0.08)"  },
  completed: { label: "COMPLETE",  color: "#60a5fa", bg: "rgba(96,165,250,0.08)"  },
  draft:     { label: "DRAFT",     color: "#555555", bg: "rgba(85,85,85,0.08)"    },
};

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border border-[#c8a84b]/30 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#c8a84b] animate-pulse" />
            </div>
            <div className="font-mono text-[10px] text-[#383838] tracking-widest uppercase">Initializing System</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="bracket border border-[#1a1a1a] p-12 text-center max-w-sm">
            <div className="w-10 h-10 border border-[#c8a84b]/30 flex items-center justify-center mx-auto mb-6">
              <div className="w-4 h-4 bg-[#c8a84b]/30" />
            </div>
            <div className="font-mono text-[9px] text-[#383838] tracking-widest uppercase mb-3">Access Required</div>
            <h2 className="text-xl font-bold text-white mb-3">Restricted System</h2>
            <p className="text-[#555] text-sm mb-6">Authentication required to access the AdEngine pipeline.</p>
            <a href={getLoginUrl()}>
              <button className="btn-ops btn-ops-primary w-full justify-center">
                Request Access <ArrowRight className="w-3 h-3" />
              </button>
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalAds = campaigns?.reduce((sum, c) => sum + (c.totalAdsGenerated || 0), 0) || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-10"
        >
          <div>
            <div className="section-label mb-2">Command Center</div>
            <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
          </div>
          <Link href="/campaigns/new">
            <button className="btn-ops btn-ops-primary">
              <Plus className="w-3 h-3" /> New Campaign
            </button>
          </Link>
        </motion.div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#0f0f0f] mb-8">
          {[
            { label: "Campaigns", value: campaigns?.length || 0, icon: Activity, color: "#c8a84b" },
            { label: "Active", value: activeCampaigns, icon: Zap, color: "#4ade80" },
            { label: "Total Ads", value: totalAds, icon: BarChart3, color: "#60a5fa" },
            { label: "Cost", value: "$" + ((campaigns?.reduce((s, c) => s + c.totalCostUsd, 0) || 0).toFixed(3)), icon: CheckCircle, color: "#a78bfa" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#060606] px-6 py-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <div className="section-label">{stat.label}</div>
              </div>
              <div className="font-mono text-3xl font-black text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Campaigns List */}
        <div>
          <div className="flex items-center gap-4 mb-5">
            <div className="section-label">All Campaigns</div>
            <div className="flex-1 h-px bg-[#0f0f0f]" />
            <div className="font-mono text-[9px] text-[#2a2a2a]">{campaigns?.length || 0} TOTAL</div>
          </div>

          {!campaigns || campaigns.length === 0 ? (
            <div className="bracket border border-dashed border-[#1a1a1a] p-16 text-center">
              <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center mx-auto mb-5">
                <Zap className="w-5 h-5 text-[#2a2a2a]" />
              </div>
              <div className="section-label mb-3 text-center">No Campaigns</div>
              <p className="text-[#444] text-sm mb-6 max-w-xs mx-auto">
                Create your first campaign to begin autonomous ad generation.
              </p>
              <Link href="/campaigns/new">
                <button className="btn-ops btn-ops-outline">
                  <Plus className="w-3 h-3" /> Create Campaign
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-px">
              {campaigns.map((campaign, i) => {
                const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                const approvalRate = 0;

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/campaigns/${campaign.id}`}>
                      <div className="group flex items-center gap-5 px-5 py-4 bg-[#060606] hover:bg-[#0a0a0a] border-l-2 border-transparent hover:border-[#c8a84b]/30 transition-all cursor-pointer">
                        <div className="flex-shrink-0">
                          <div
                            className="w-2 h-2"
                            style={{ background: statusCfg.color, boxShadow: `0 0 6px ${statusCfg.color}` }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-white text-sm truncate">{campaign.name}</span>
                            <span
                              className="tag-ops font-mono text-[8px] flex-shrink-0"
                              style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30`, background: statusCfg.bg }}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                          {campaign.product && (
                            <div className="font-mono text-[9px] text-[#383838] truncate">{campaign.product}</div>
                          )}
                        </div>

                        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-mono text-xs font-bold text-white">{campaign.totalAdsGenerated || 0}</div>
                            <div className="section-label">Ads</div>
                          </div>
                          <div className="text-right">
                            <div
                              className="font-mono text-xs font-bold"
                              style={{ color: approvalRate > 60 ? "#4ade80" : approvalRate > 30 ? "#c8a84b" : "#f87171" }}
                            >
                              {approvalRate}%
                            </div>
                            <div className="section-label">Approved</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs font-bold text-white">
                              {campaign.currentQualityThreshold?.toFixed(1) || "7.0"}
                            </div>
                            <div className="section-label">Threshold</div>
                          </div>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-[#2a2a2a] group-hover:text-[#c8a84b] transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
