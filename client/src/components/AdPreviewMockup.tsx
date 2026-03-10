import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp, Send } from "lucide-react";

type Platform = "facebook" | "instagram";

interface AdPreviewMockupProps {
  primaryText: string;
  headline: string;
  description?: string;
  ctaButton: string;
  imagePrompt?: string;
}

// Deterministic gradient from headline text (no random on re-render)
function getAdGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1},60%,18%) 0%, hsl(${hue2},55%,12%) 100%)`;
}

function FacebookPreview({ primaryText, headline, description, ctaButton, imagePrompt }: AdPreviewMockupProps) {
  const gradient = getAdGradient(headline);
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* FB Top bar */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#22d3ee,#3b82f6)" }}>VT</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[11px] leading-tight" style={{ color: "#111" }}>Varsity Tutors</div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: "#6b7280" }}>Sponsored</span>
            <span style={{ color: "#6b7280", fontSize: 8 }}>·</span>
            <svg width="9" height="9" viewBox="0 0 16 16" fill="#6b7280"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5A6.5 6.5 0 118 1.5a6.5 6.5 0 010 13z"/><path d="M8 3.5a.75.75 0 01.75.75v4.25l2.5 1.5a.75.75 0 01-.75 1.3l-3-1.75A.75.75 0 017.25 9V4.25A.75.75 0 018 3.5z"/></svg>
          </div>
        </div>
        <MoreHorizontal size={16} style={{ color: "#6b7280" }} />
      </div>

      {/* Primary text */}
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-[11px] leading-relaxed" style={{ color: "#111", lineHeight: 1.5 }}>
          {primaryText.length > 120 ? primaryText.slice(0, 120) + "…" : primaryText}
        </p>
      </div>

      {/* Ad image placeholder */}
      <div className="w-full relative overflow-hidden" style={{ aspectRatio: "1.91/1", background: gradient }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {imagePrompt && (
            <p className="text-[9px] leading-relaxed opacity-60 max-w-[80%]" style={{ color: "#fff", fontStyle: "italic" }}>
              {imagePrompt.length > 80 ? imagePrompt.slice(0, 80) + "…" : imagePrompt}
            </p>
          )}
          <div className="mt-2 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
            AI Image Prompt
          </div>
        </div>
      </div>

      {/* CTA bar */}
      <div className="flex items-center justify-between px-3 py-2.5"
        style={{ background: "#f0f2f5", borderTop: "1px solid #e5e7eb" }}>
        <div className="flex-1 min-w-0 pr-3">
          <div className="font-bold text-[11px] truncate" style={{ color: "#111" }}>{headline}</div>
          {description && (
            <div className="text-[9px] truncate" style={{ color: "#6b7280" }}>{description}</div>
          )}
        </div>
        <button className="flex-shrink-0 px-3 py-1.5 rounded text-[10px] font-bold"
          style={{ background: "#e4e6eb", color: "#050505" }}>
          {ctaButton}
        </button>
      </div>

      {/* Reactions row */}
      <div className="px-3 pb-2.5 pt-1.5" style={{ borderTop: "1px solid #e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">
            {["👍","❤️","😮"].map((e, i) => (
              <span key={i} className="text-[12px]">{e}</span>
            ))}
            <span className="text-[9px] ml-1" style={{ color: "#6b7280" }}>1.2K</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px]" style={{ color: "#6b7280" }}>48 comments</span>
            <span className="text-[9px]" style={{ color: "#6b7280" }}>12 shares</span>
          </div>
        </div>
        <div className="flex items-center justify-around mt-1.5 pt-1.5" style={{ borderTop: "1px solid #e5e7eb" }}>
          {[
            { icon: ThumbsUp, label: "Like" },
            { icon: MessageCircle, label: "Comment" },
            { icon: Share2, label: "Share" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-semibold"
              style={{ color: "#6b7280" }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ primaryText, headline, description, ctaButton, imagePrompt }: AdPreviewMockupProps) {
  const gradient = getAdGradient(headline + "ig");
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ background: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
      {/* IG Top bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)" }}>VT</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[11px]" style={{ color: "#111" }}>varsitytutors</div>
          <div className="text-[9px]" style={{ color: "#8e8e8e" }}>Sponsored</div>
        </div>
        <MoreHorizontal size={15} style={{ color: "#111" }} />
      </div>

      {/* Square image */}
      <div className="w-full relative overflow-hidden" style={{ aspectRatio: "1/1", background: gradient }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {imagePrompt && (
            <p className="text-[9px] leading-relaxed opacity-60 max-w-[80%]" style={{ color: "#fff", fontStyle: "italic" }}>
              {imagePrompt.length > 80 ? imagePrompt.slice(0, 80) + "…" : imagePrompt}
            </p>
          )}
          <div className="mt-2 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
            AI Image Prompt
          </div>
        </div>
      </div>

      {/* Action icons */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart size={20} style={{ color: "#111" }} />
          <MessageCircle size={20} style={{ color: "#111" }} />
          <Send size={20} style={{ color: "#111" }} />
        </div>
        <Bookmark size={20} style={{ color: "#111" }} />
      </div>

      {/* Likes */}
      <div className="px-3 pb-1">
        <span className="font-semibold text-[11px]" style={{ color: "#111" }}>1,247 likes</span>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <span className="font-semibold text-[11px]" style={{ color: "#111" }}>varsitytutors </span>
        <span className="text-[11px]" style={{ color: "#111" }}>
          {primaryText.length > 100 ? primaryText.slice(0, 100) + "…" : primaryText}
        </span>
      </div>

      {/* CTA */}
      <div className="mx-3 mb-3 rounded-lg overflow-hidden" style={{ border: "1px solid #dbdbdb" }}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ background: "#fafafa" }}>
          <div className="min-w-0 flex-1 pr-2">
            <div className="font-semibold text-[11px] truncate" style={{ color: "#111" }}>{headline}</div>
            {description && <div className="text-[9px] truncate" style={{ color: "#8e8e8e" }}>{description}</div>}
          </div>
          <button className="flex-shrink-0 px-3 py-1 rounded-md text-[10px] font-bold text-white"
            style={{ background: "#0095f6" }}>
            {ctaButton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdPreviewMockup({ primaryText, headline, description, ctaButton, imagePrompt }: AdPreviewMockupProps) {
  const [platform, setPlatform] = useState<Platform>("facebook");

  return (
    <div className="space-y-3">
      {/* Platform toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)" }}>
        {(["facebook", "instagram"] as Platform[]).map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            className="px-3 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all capitalize"
            style={{
              background: platform === p ? "rgba(34,211,238,0.1)" : "transparent",
              color: platform === p ? "#22d3ee" : "rgba(100,116,139,0.5)",
              border: platform === p ? "1px solid rgba(34,211,238,0.2)" : "1px solid transparent",
            }}>
            {p}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto" style={{ width: 280 }}>
        {/* Phone shell */}
        <div className="relative rounded-[32px] p-3 shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #1a1a2e, #0f0f1a)",
            border: "2px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl"
            style={{ background: "#0f0f1a", zIndex: 10 }} />

          {/* Screen */}
          <div className="rounded-[24px] overflow-hidden relative" style={{ background: "#f0f2f5", minHeight: 400 }}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5"
              style={{ background: platform === "instagram" ? "#fff" : "#fff", borderBottom: "none" }}>
              <span className="font-mono text-[8px] font-bold" style={{ color: "#111" }}>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5 items-end">
                  {[3,5,7,9].map((h,i) => (
                    <div key={i} className="w-0.5 rounded-sm" style={{ height: h, background: "#111" }} />
                  ))}
                </div>
                <svg width="12" height="9" viewBox="0 0 24 18" fill="none">
                  <path d="M12 3.5C8.5 3.5 5.3 5 3 7.5L1 5.5C3.8 2.5 7.7 0.5 12 0.5s8.2 2 11 5L21 7.5C18.7 5 15.5 3.5 12 3.5z" fill="#111"/>
                  <path d="M12 8.5c-2.2 0-4.2.9-5.7 2.3L4.5 9C6.5 7.1 9.1 6 12 6s5.5 1.1 7.5 3L17.7 10.8C16.2 9.4 14.2 8.5 12 8.5z" fill="#111"/>
                  <circle cx="12" cy="15" r="2.5" fill="#111"/>
                </svg>
                <svg width="20" height="10" viewBox="0 0 40 20" fill="none">
                  <rect x="1" y="1" width="34" height="18" rx="4" stroke="#111" strokeWidth="2"/>
                  <rect x="3" y="3" width="28" height="14" rx="2" fill="#111"/>
                  <rect x="35" y="6" width="4" height="8" rx="2" fill="#111"/>
                </svg>
              </div>
            </div>

            {/* App header */}
            <div className="px-3 py-2 flex items-center justify-between"
              style={{ background: platform === "instagram" ? "#fff" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
              {platform === "facebook" ? (
                <>
                  <span className="font-bold text-[14px]" style={{ color: "#1877f2" }}>facebook</span>
                  <div className="flex gap-2">
                    {["+","🔍","💬"].map((icon, i) => (
                      <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: "#e4e6eb" }}>{icon}</div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <span className="font-bold text-[13px] italic" style={{ color: "#111", fontFamily: "Georgia, serif" }}>Instagram</span>
                  <div className="flex gap-2">
                    {["♡","✈️"].map((icon, i) => (
                      <span key={i} className="text-[14px]">{icon}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Feed content */}
            <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
              <AnimatePresence mode="wait">
                <motion.div key={platform} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                  {platform === "facebook" ? (
                    <FacebookPreview primaryText={primaryText} headline={headline} description={description}
                      ctaButton={ctaButton} imagePrompt={imagePrompt} />
                  ) : (
                    <InstagramPreview primaryText={primaryText} headline={headline} description={description}
                      ctaButton={ctaButton} imagePrompt={imagePrompt} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Phone bottom bar */}
        <div className="flex justify-center mt-2">
          <div className="w-20 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>
      </div>

      {/* Caption */}
      <p className="font-mono text-[9px] text-center" style={{ color: "rgba(100,116,139,0.35)" }}>
        Ad preview — visual is AI-generated placeholder
      </p>
    </div>
  );
}
