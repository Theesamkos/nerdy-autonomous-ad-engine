import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Zap, Swords, Sparkles, BarChart3, Target,
  LogOut, LogIn, ChevronRight, ChevronLeft, Menu, Plus, Brain, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
  campaignId?: number;
  campaignName?: string;
}

// Top-level navigation — always available
const TOP_NAV = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard",        sub: "Mission Control" },
  { href: "/campaigns/new",    icon: Plus,            label: "New Campaign",     sub: "Launch Pipeline" },
  { href: "/competitor-intel", icon: Target,          label: "Competitor Intel", sub: "Meta Ad Library" },
];

export default function AppLayout({ children, campaignId, campaignName }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: campaigns } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  // Determine if we're inside a campaign context
  const inCampaign = !!campaignId;

  // Campaign-scoped sub-nav — only shown when inside a campaign
  const CAMPAIGN_NAV = campaignId
    ? [
        { href: `/campaigns/${campaignId}`,               icon: Zap,      label: "Generator",      sub: "Ad Pipeline" },
        { href: `/campaigns/${campaignId}/adversarial`,   icon: Swords,   label: "Ad-versarial",   sub: "Competitor Mode" },
        { href: `/campaigns/${campaignId}/spark`,         icon: Sparkles, label: "Creative Spark", sub: "Idea Generator" },
        { href: `/campaigns/${campaignId}/performance`,   icon: BarChart3, label: "Performance",   sub: "Analytics" },
      ]
    : [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(34,211,238,0.08)" }}>
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.04))",
                border: "1px solid rgba(34,211,238,0.28)",
                boxShadow: "0 0 16px rgba(34,211,238,0.12)",
              }}
            >
              <Brain size={16} style={{ color: "#22d3ee" }} />
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-tight" style={{ color: "#f8fafc", lineHeight: 1.2 }}>AdEngine</div>
              <div className="font-mono" style={{ color: "rgba(34,211,238,0.5)", fontSize: "0.58rem", letterSpacing: "0.12em" }}>v3 · AUTONOMOUS</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Status */}
      <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(34,211,238,0.05)" }}>
        <div className="flex items-center justify-between">
          <span className="status-live">Engine Online</span>
          <span className="font-mono" style={{ fontSize: "0.58rem", color: "rgba(34,211,238,0.35)", letterSpacing: "0.1em" }}>SYS:OK</span>
        </div>
      </div>

      {/* ── CAMPAIGN CONTEXT NAV ── */}
      {inCampaign ? (
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Back to Dashboard */}
          <div className="px-3 pt-4 pb-2">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group"
                style={{ border: "1px solid rgba(34,211,238,0.08)" }}
              >
                <ArrowLeft size={12} style={{ color: "rgba(34,211,238,0.45)" }} />
                <span className="font-mono" style={{ fontSize: "0.6rem", color: "rgba(34,211,238,0.45)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  All Campaigns
                </span>
              </div>
            </Link>
          </div>

          {/* Active Campaign Name */}
          {campaignName && (
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(34,211,238,0.05)" }}>
              <div className="font-mono" style={{ fontSize: "0.56rem", color: "rgba(34,211,238,0.35)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "4px" }}>
                Active Campaign
              </div>
              <div className="font-mono font-semibold truncate" style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>
                {campaignName}
              </div>
            </div>
          )}

          {/* Campaign Sub-Nav */}
          <nav className="px-3 py-4 space-y-0.5">
            <div className="px-2 mb-3" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.3)" }}>
              Campaign Tools
            </div>
            {CAMPAIGN_NAV.map(item => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
                    style={{
                      background: active ? "rgba(34,211,238,0.07)" : "transparent",
                      border: active ? "1px solid rgba(34,211,238,0.16)" : "1px solid transparent",
                      boxShadow: active ? "inset 2px 0 0 rgba(34,211,238,0.55)" : "none",
                    }}
                  >
                    <item.icon size={14} style={{ color: active ? "#22d3ee" : "rgba(100,116,139,0.7)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono truncate" style={{ color: active ? "#e2e8f0" : "rgba(100,116,139,0.8)", fontSize: "0.68rem", letterSpacing: "0.04em", fontWeight: active ? 600 : 400 }}>
                        {item.label}
                      </div>
                      <div className="font-mono truncate" style={{ fontSize: "0.56rem", color: active ? "rgba(34,211,238,0.45)" : "rgba(71,85,105,0.7)", letterSpacing: "0.06em" }}>
                        {item.sub}
                      </div>
                    </div>
                    {active && <ChevronRight size={11} style={{ color: "rgba(34,211,238,0.4)", flexShrink: 0 }} />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : (
        /* ── TOP-LEVEL NAV ── */
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Main Nav */}
          <nav className="px-3 py-4 space-y-0.5">
            <div className="px-2 mb-3" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.3)" }}>
              Navigation
            </div>
            {TOP_NAV.map(item => {
              const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
                    style={{
                      background: active ? "rgba(34,211,238,0.07)" : "transparent",
                      border: active ? "1px solid rgba(34,211,238,0.16)" : "1px solid transparent",
                      boxShadow: active ? "inset 2px 0 0 rgba(34,211,238,0.55)" : "none",
                    }}
                  >
                    <item.icon size={14} style={{ color: active ? "#22d3ee" : "rgba(100,116,139,0.7)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono truncate" style={{ color: active ? "#e2e8f0" : "rgba(100,116,139,0.8)", fontSize: "0.68rem", letterSpacing: "0.04em", fontWeight: active ? 600 : 400 }}>
                        {item.label}
                      </div>
                      <div className="font-mono truncate" style={{ fontSize: "0.56rem", color: active ? "rgba(34,211,238,0.45)" : "rgba(71,85,105,0.7)", letterSpacing: "0.06em" }}>
                        {item.sub}
                      </div>
                    </div>
                    {active && <ChevronRight size={11} style={{ color: "rgba(34,211,238,0.4)", flexShrink: 0 }} />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Recent Campaigns */}
          {campaigns && campaigns.length > 0 && (
            <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(34,211,238,0.05)" }}>
              <div className="px-2 mb-2" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.56rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.3)" }}>
                Recent Campaigns
              </div>
              <div className="space-y-0.5">
                {campaigns.slice(0, 6).map(c => {
                  const active = location === `/campaigns/${c.id}`;
                  return (
                    <Link key={c.id} href={`/campaigns/${c.id}`} onClick={() => setMobileOpen(false)}>
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all"
                        style={{ background: active ? "rgba(34,211,238,0.05)" : "transparent" }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active ? "#22d3ee" : "rgba(71,85,105,0.5)" }} />
                        <span className="font-mono truncate flex-1" style={{ fontSize: "0.62rem", color: active ? "#e2e8f0" : "rgba(100,116,139,0.6)" }}>
                          {c.name}
                        </span>
                        {active && <ChevronRight size={10} style={{ color: "rgba(34,211,238,0.35)", flexShrink: 0 }} />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: "1px solid rgba(34,211,238,0.06)" }}>
        {isAuthenticated && user ? (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
              style={{ background: "linear-gradient(135deg, #22d3ee, #0891b2)", color: "#020b18" }}
            >
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono truncate" style={{ color: "#e2e8f0", fontSize: "0.68rem", fontWeight: 500 }}>
                {user.name || "Operator"}
              </div>
              <div className="font-mono" style={{ fontSize: "0.56rem", color: "rgba(34,211,238,0.45)", letterSpacing: "0.08em" }}>
                CLEARANCE: FULL
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded transition-colors"
              style={{ color: "rgba(100,116,139,0.5)" }}
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <a href={getLoginUrl()}>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
              style={{ border: "1px dashed rgba(34,211,238,0.2)" }}
            >
              <LogIn size={13} style={{ color: "rgba(34,211,238,0.5)" }} />
              <span className="font-mono" style={{ fontSize: "0.62rem", color: "rgba(34,211,238,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sign In</span>
            </div>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "#020b18" }}>
      {/* Global space background — fixed behind everything */}
      <div className="space-bg">
        <div className="space-bg-image" />
        <div className="space-bg-overlay" />
        <div className="space-bg-scanlines" />
        <div className="space-bg-glow-top" />
        <div className="space-bg-glow-bottom" />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 overflow-y-auto"
        style={{
          width: "220px",
          minWidth: "220px",
          background: "rgba(2,11,24,0.92)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(34,211,238,0.09)",
          flexShrink: 0,
          zIndex: 20,
        }}
      >
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
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(2,11,24,0.75)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden overflow-y-auto"
              style={{
                width: "220px",
                background: "rgba(2,11,24,0.97)",
                backdropFilter: "blur(24px)",
                borderRight: "1px solid rgba(34,211,238,0.12)",
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile Header */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3"
          style={{
            background: "rgba(2,11,24,0.92)",
            borderBottom: "1px solid rgba(34,211,238,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: "rgba(34,211,238,0.6)" }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Brain size={16} style={{ color: "#22d3ee" }} />
            <span className="font-display font-bold text-sm" style={{ color: "#f8fafc" }}>AdEngine</span>
            {campaignName && (
              <>
                <ChevronRight size={12} style={{ color: "rgba(34,211,238,0.3)" }} />
                <span className="font-mono text-xs truncate max-w-[120px]" style={{ color: "rgba(34,211,238,0.6)" }}>{campaignName}</span>
              </>
            )}
          </div>
          <div className="ml-auto">
            <span className="status-live">Online</span>
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
