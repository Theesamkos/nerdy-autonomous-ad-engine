import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, Zap, TrendingUp, Target, Clock, ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to continue</h2>
            <p className="text-muted-foreground mb-6">Access your campaigns and start generating ads.</p>
            <a href={getLoginUrl()}>
              <Button className="glow-blue">Sign In</Button>
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalAds = campaigns?.reduce((s, c) => s + c.totalAdsGenerated, 0) || 0;
  const totalCost = campaigns?.reduce((s, c) => s + c.totalCostUsd, 0) || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Your autonomous ad generation hub</p>
          </div>
          <Link href="/campaigns/new">
            <Button className="gap-2 glow-blue">
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, label: "Campaigns", value: campaigns?.length || 0, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
            { icon: Zap, label: "Ads Generated", value: totalAds, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { icon: TrendingUp, label: "Active", value: activeCampaigns, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
            { icon: BarChart3, label: "Total Cost", value: `$${totalCost.toFixed(4)}`, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${bg} bg-card`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            </motion.div>
          ))}
        </div>

        {/* Campaigns */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 shimmer rounded-xl" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div>
            <h2 className="font-display font-semibold text-foreground mb-4">Your Campaigns</h2>
            <div className="space-y-3">
              {campaigns.map((campaign, i) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/campaigns/${campaign.id}`} className="no-underline">
                    <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${campaign.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {campaign.audienceSegment} · {campaign.campaignGoal}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                          <div className="hidden sm:block text-center">
                            <div className="text-sm font-semibold text-foreground">{campaign.totalAdsGenerated}</div>
                            <div className="text-[10px] text-muted-foreground">ads</div>
                          </div>
                          <div className="hidden md:block text-center">
                            <div className="text-sm font-semibold text-primary">{campaign.currentQualityThreshold.toFixed(1)}</div>
                            <div className="text-[10px] text-muted-foreground">threshold</div>
                          </div>
                          <div className="hidden md:block text-center">
                            <div className="text-xs text-muted-foreground">${campaign.totalCostUsd.toFixed(4)}</div>
                            <div className="text-[10px] text-muted-foreground">spent</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 glow-blue">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first campaign to start generating high-converting ads with autonomous AI.
            </p>
            <Link href="/campaigns/new">
              <Button className="gap-2 glow-blue">
                <Plus className="w-4 h-4" />
                Create First Campaign
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
