import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, LayoutDashboard, Plus, Swords, Sparkles, BarChart3,
  LogOut, LogIn, ChevronRight, Menu, X, Bot
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/campaigns/new", icon: Plus, label: "New Campaign" },
];

const CAMPAIGN_TOOLS = [
  { suffix: "", icon: Zap, label: "Generate Ads" },
  { suffix: "/adversarial", icon: Swords, label: "Ad-versarial" },
  { suffix: "/spark", icon: Sparkles, label: "Creative Spark" },
  { suffix: "/performance", icon: BarChart3, label: "Performance" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  campaignId?: number;
  campaignName?: string;
}

export default function AppLayout({ children, campaignId, campaignName }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: campaigns } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-blue">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-foreground leading-none">AdEngine</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">by Nerdy × AI</div>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <div className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="no-underline">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              location === href
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* Campaign Tools (when in a campaign) */}
      {campaignId && (
        <div className="px-3 pb-4">
          <div className="px-3 mb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Campaign Tools</div>
            {campaignName && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">{campaignName}</div>
            )}
          </div>
          {CAMPAIGN_TOOLS.map(({ suffix, icon: Icon, label }) => {
            const href = `/campaigns/${campaignId}${suffix}`;
            return (
              <Link key={href} href={href} className="no-underline">
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location === href
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recent Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <div className="px-3 pb-4 flex-1 overflow-y-auto">
          <div className="px-3 mb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Recent Campaigns</div>
          </div>
          {campaigns.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="no-underline">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                location.startsWith(`/campaigns/${c.id}`)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                <span className="truncate">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* User section */}
      <div className="mt-auto px-3 py-4 border-t border-border/50">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{user.name?.[0]?.toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{user.name || "User"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email || ""}</div>
            </div>
            <button
              onClick={() => logout()}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <a href={getLoginUrl()} className="no-underline">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
              <LogIn className="w-4 h-4" />
              Sign In
            </div>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm">AdEngine</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
