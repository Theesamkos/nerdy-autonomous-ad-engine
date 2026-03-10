import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Zap, Swords, Sparkles, BarChart3,
  LogOut, LogIn, ChevronRight, Menu, Plus
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
  campaignId?: number;
  campaignName?: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", code: "01" },
  { href: "/campaigns/new", icon: Plus, label: "New Campaign", code: "02" },
  { href: "/adversarial", icon: Swords, label: "Ad-versarial", code: "03" },
  { href: "/creative-spark", icon: Sparkles, label: "Creative Spark", code: "04" },
];

export default function AppLayout({ children, campaignId, campaignName }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: campaigns } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#0f0f0f]">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-7 h-7 border border-[#c8a84b]/40 flex items-center justify-center group-hover:border-[#c8a84b] transition-colors">
              <div className="w-3 h-3 bg-[#c8a84b]/70 group-hover:bg-[#c8a84b] transition-colors" />
            </div>
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-white">AdEngine</div>
              <div className="font-mono text-[8px] text-[#2a2a2a] tracking-widest">v3 SYSTEM</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Status */}
      <div className="px-5 py-3 border-b border-[#0a0a0a]">
        <div className="status-live">PIPELINE ACTIVE</div>
      </div>

      {/* Main Nav */}
      <nav className="px-3 py-4 space-y-0.5">
        <div className="section-label px-2 mb-3">Navigation</div>
        {NAV_ITEMS.map(item => {
          const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all group
                ${active
                  ? "bg-[#c8a84b]/08 border-l-2 border-[#c8a84b]"
                  : "border-l-2 border-transparent hover:border-[#222] hover:bg-[#0a0a0a]"
                }
              `}>
                <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-[#c8a84b]" : "text-[#444] group-hover:text-[#666]"}`} />
                <span className={`font-mono text-[10px] tracking-[0.08em] uppercase flex-1 ${active ? "text-[#c8a84b]" : "text-[#555] group-hover:text-[#888]"}`}>
                  {item.label}
                </span>
                <span className={`font-mono text-[8px] ${active ? "text-[#c8a84b]/50" : "text-[#2a2a2a]"}`}>{item.code}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Campaign Tools */}
      {campaignId && (
        <div className="px-3 py-4 border-t border-[#0a0a0a]">
          <div className="section-label px-2 mb-2">Campaign Tools</div>
          {campaignName && (
            <div className="px-2 mb-3">
              <div className="font-mono text-[9px] text-[#c8a84b]/60 truncate">{campaignName}</div>
            </div>
          )}
          <div className="space-y-0.5">
            {[
              { href: `/campaigns/${campaignId}`, icon: Zap, label: "Generator" },
              { href: `/campaigns/${campaignId}/performance`, icon: BarChart3, label: "Performance" },
            ].map(item => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className={`
                    flex items-center gap-2 px-3 py-2 cursor-pointer transition-all group
                    ${active ? "bg-[#c8a84b]/06 border-l border-[#c8a84b]/30" : "hover:bg-[#0a0a0a]"}
                  `}>
                    <item.icon className={`w-3 h-3 flex-shrink-0 ${active ? "text-[#c8a84b]" : "text-[#444] group-hover:text-[#666]"}`} />
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${active ? "text-[#c8a84b]" : "text-[#444] group-hover:text-[#666]"}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <div className="px-3 py-4 border-t border-[#0a0a0a] flex-1 overflow-y-auto">
          <div className="section-label px-2 mb-3">Recent Campaigns</div>
          <div className="space-y-0.5">
            {campaigns.slice(0, 6).map(c => {
              const active = campaignId === c.id;
              return (
                <Link key={c.id} href={`/campaigns/${c.id}`} onClick={() => setMobileOpen(false)}>
                  <div className={`
                    flex items-center gap-2 px-3 py-2 cursor-pointer transition-all group
                    ${active ? "bg-[#c8a84b]/06" : "hover:bg-[#0a0a0a]"}
                  `}>
                    <div className={`w-1.5 h-1.5 flex-shrink-0 ${active ? "bg-[#c8a84b]" : "bg-[#222] group-hover:bg-[#333]"}`} />
                    <span className={`font-mono text-[9px] truncate flex-1 ${active ? "text-[#c8a84b]" : "text-[#444] group-hover:text-[#666]"}`}>
                      {c.name}
                    </span>
                    {active && <ChevronRight className="w-3 h-3 text-[#c8a84b]/50 flex-shrink-0" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <div className="px-4 py-4 border-t border-[#0f0f0f]">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#c8a84b]/10 border border-[#c8a84b]/20 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] font-bold text-[#c8a84b]">
                {(user.name || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] text-[#888] truncate">{user.name || "Operator"}</div>
              <div className="font-mono text-[8px] text-[#2a2a2a] truncate">{user.email || ""}</div>
            </div>
            <button
              onClick={() => logout()}
              className="w-6 h-6 flex items-center justify-center hover:bg-[#111] transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-3 h-3 text-[#333] hover:text-[#c8a84b]" />
            </button>
          </div>
        ) : (
          <a href={getLoginUrl()}>
            <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#c8a84b]/20 hover:border-[#c8a84b]/40 transition-colors cursor-pointer">
              <LogIn className="w-3 h-3 text-[#c8a84b]/50" />
              <span className="font-mono text-[9px] text-[#c8a84b]/50 uppercase tracking-wider">Sign In</span>
            </div>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 bg-[#030303] border-r border-[#0f0f0f] overflow-y-auto">
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
              className="fixed inset-0 bg-black/80 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -208 }}
              animate={{ x: 0 }}
              exit={{ x: -208 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-52 bg-[#030303] border-r border-[#0f0f0f] z-50 lg:hidden overflow-y-auto"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#0f0f0f] bg-[#030303]">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#111] transition-colors"
          >
            <Menu className="w-4 h-4 text-[#555]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-[#c8a84b]/30 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#c8a84b]/60" />
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-white">
              {campaignName || "AdEngine"}
            </span>
          </div>
          <div className="w-8" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
