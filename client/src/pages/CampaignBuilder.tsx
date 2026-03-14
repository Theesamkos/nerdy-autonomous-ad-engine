import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, ArrowLeft, Target, Users, Palette,
  CheckCircle2, Brain
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GOALS = [
  { value: "awareness",   label: "Awareness",   desc: "Build brand recognition and reach new audiences" },
  { value: "conversion",  label: "Conversion",  desc: "Drive sign-ups, purchases, and direct action" },
  { value: "retargeting", label: "Retargeting", desc: "Re-engage warm audiences who already know you" },
] as const;

const TONES = [
  { value: "empowering",   label: "Empowering",   desc: "Inspire and uplift your audience" },
  { value: "urgent",       label: "Urgent",       desc: "Create FOMO and act-now energy" },
  { value: "friendly",     label: "Friendly",     desc: "Warm, approachable, conversational" },
  { value: "professional", label: "Professional", desc: "Expert, authoritative, credible" },
  { value: "playful",      label: "Playful",      desc: "Fun, light, personality-forward" },
] as const;

const STEPS = [
  { num: 1, label: "Campaign Brief",  icon: Target,  code: "01" },
  { num: 2, label: "Target Audience", icon: Users,   code: "02" },
  { num: 3, label: "Brand Voice",     icon: Palette, code: "03" },
];

export default function CampaignBuilder() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    audienceSegment: "",
    product: "",
    campaignGoal: "conversion" as "awareness" | "conversion" | "retargeting",
    tone: "empowering" as "empowering" | "urgent" | "friendly" | "professional" | "playful",
    brandVoiceNotes: "",
  });

  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: (campaign) => {
      if (campaign) {
        toast.success("Campaign initialized. Entering generation pipeline.");
        navigate(`/campaigns/${campaign.id}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="ops-card bracket p-10 text-center max-w-sm w-full">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)" }}>
              <Brain size={20} style={{ color: "#22d3ee" }} />
            </div>
            <h2 className="font-display font-bold text-lg mb-2" style={{ color: "#f8fafc" }}>Access Required</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(148,163,184,0.5)" }}>Sign in to create campaigns.</p>
            <a href={getLoginUrl()}>
              <button className="btn-primary mx-auto flex items-center gap-2">
                <Zap size={13} /> Request Access
              </button>
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-label">Campaign Setup</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight" style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}>
            New Campaign
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(148,163,184,0.5)" }}>
            Configure your autonomous ad generation pipeline.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="ops-card overflow-hidden mb-8">
          <div className="flex">
            {STEPS.map(({ num, label, icon: Icon, code }, i) => {
              const done = step > num;
              const active = step === num;
              return (
                <button
                  key={num}
                  onClick={() => done && setStep(num)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3.5 transition-all ${
                    active ? "cursor-default" : done ? "cursor-pointer hover:bg-white/[0.02]" : "cursor-default opacity-35"
                  } ${i > 0 ? "border-l" : ""}`}
                  style={{
                    background: active ? "rgba(34,211,238,0.05)" : "transparent",
                    borderColor: "rgba(34,211,238,0.07)",
                  }}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: done ? "rgba(52,211,153,0.1)" : active ? "rgba(34,211,238,0.1)" : "rgba(30,58,92,0.3)",
                      border: `1px solid ${done ? "rgba(52,211,153,0.3)" : active ? "rgba(34,211,238,0.3)" : "rgba(34,211,238,0.08)"}`,
                    }}>
                    {done
                      ? <CheckCircle2 size={12} style={{ color: "#34d399" }} />
                      : <Icon size={12} style={{ color: active ? "#22d3ee" : "#94a3b8" }} />
                    }
                  </div>
                  <div className="text-left min-w-0 hidden sm:block">
                    <div className="font-mono text-xs tracking-widest uppercase"
                      style={{ color: done ? "#34d399" : active ? "#22d3ee" : "#94a3b8" }}>
                      {code}
                    </div>
                    <div className="font-mono text-[11px] truncate"
                      style={{ color: done ? "rgba(148,163,184,0.6)" : active ? "#e2e8f0" : "#94a3b8" }}>
                      {label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">

          {/* Step 1: Brief */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="space-y-6">

              <div>
                <label className="ops-label">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. SAT Prep Q1 2025 — Parents"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="ops-input"
                />
              </div>

              <div>
                <label className="ops-label">Product / Service</label>
                <textarea
                  placeholder="e.g. 1-on-1 SAT tutoring with expert tutors. Personalized study plans, live sessions, score guarantees."
                  value={form.product}
                  onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  className="ops-input min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="ops-label mb-3">Campaign Goal</label>
                <div className="grid grid-cols-3 gap-3">
                  {GOALS.map(({ value, label, desc }) => (
                    <button key={value} onClick={() => setForm(f => ({ ...f, campaignGoal: value }))}
                      className="p-4 rounded-lg text-left transition-all"
                      style={{
                        background: form.campaignGoal === value ? "rgba(34,211,238,0.07)" : "rgba(8,24,48,0.5)",
                        border: `1px solid ${form.campaignGoal === value ? "rgba(34,211,238,0.25)" : "rgba(34,211,238,0.06)"}`,
                        boxShadow: form.campaignGoal === value ? "inset 0 -2px 0 rgba(34,211,238,0.4)" : "none",
                      }}>
                      <div className="font-mono text-xs font-bold uppercase tracking-wider mb-1"
                        style={{ color: form.campaignGoal === value ? "#22d3ee" : "#94a3b8" }}>
                        {label}
                      </div>
                      <div className="font-mono text-xs leading-relaxed"
                        style={{ color: "#94a3b8" }}>
                        {desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!form.name || !form.product}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                Continue to Audience <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="space-y-6">

              <div>
                <label className="ops-label">Target Audience</label>
                <textarea
                  placeholder="e.g. Parents of high school juniors/seniors (ages 35-55), anxious about college admissions, household income $75k+, have tried other test prep, comparing options."
                  value={form.audienceSegment}
                  onChange={e => setForm(f => ({ ...f, audienceSegment: e.target.value }))}
                  className="ops-input min-h-[120px] resize-none"
                />
                <p className="font-mono text-xs mt-2" style={{ color: "#94a3b8" }}>
                  Be specific. The AI uses this to craft resonant, targeted messaging.
                </p>
              </div>

              <div className="ops-card bracket p-5">
                <div className="section-label mb-3">Intelligence Tips</div>
                <div className="space-y-2.5">
                  {[
                    "Include demographics: age, income, education level",
                    "Describe their pain points, fears, and frustrations",
                    "Mention competing solutions they have already tried",
                    "Note what motivates their final decision to buy",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "rgba(34,211,238,0.4)" }} />
                      <span className="font-mono text-xs" style={{ color: "rgba(100,116,139,0.55)" }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => setStep(3)} disabled={!form.audienceSegment}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                  Continue to Voice <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Voice */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="ops-card p-8 space-y-6">

              <div>
                <label className="ops-label mb-3">Brand Tone</label>
                <div className="space-y-2">
                  {TONES.map(({ value, label, desc }) => (
                    <button key={value} onClick={() => setForm(f => ({ ...f, tone: value }))}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-left transition-all"
                      style={{
                        background: form.tone === value ? "rgba(34,211,238,0.06)" : "rgba(8,24,48,0.4)",
                        border: `1px solid ${form.tone === value ? "rgba(34,211,238,0.22)" : "rgba(34,211,238,0.06)"}`,
                        borderLeft: `3px solid ${form.tone === value ? "#22d3ee" : "transparent"}`,
                      }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: form.tone === value ? "#22d3ee" : "rgba(100,116,139,0.3)" }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: form.tone === value ? "#22d3ee" : "rgba(148,163,184,0.6)" }}>
                          {label}
                        </div>
                        <div className="font-mono text-xs" style={{ color: "#94a3b8" }}>{desc}</div>
                      </div>
                      {form.tone === value && <CheckCircle2 size={13} style={{ color: "#22d3ee", flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="ops-label">
                  Brand Voice Notes <span className="normal-case font-normal" style={{ color: "#94a3b8" }}>(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. We never use fear-based messaging. We celebrate student wins. We're the expert friend, not the corporate tutor."
                  value={form.brandVoiceNotes}
                  onChange={e => setForm(f => ({ ...f, brandVoiceNotes: e.target.value }))}
                  className="ops-input min-h-[90px] resize-none"
                />
              </div>

              {/* Summary */}
              <div className="ops-card bracket p-5">
                <div className="section-label mb-4">Campaign Summary</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Name",      value: form.name },
                    { label: "Goal",      value: form.campaignGoal },
                    { label: "Tone",      value: form.tone },
                    { label: "Threshold", value: "7.0 / 10.0" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="section-label mb-1">{label}</div>
                      <div className="font-mono text-[11px] capitalize" style={{ color: "#e2e8f0" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => createCampaign.mutate(form)} disabled={createCampaign.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {createCampaign.isPending ? (
                    <>
                      <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                        style={{ borderColor: "rgba(34,211,238,0.3)", borderTopColor: "#22d3ee" }} />
                      Initializing...
                    </>
                  ) : (
                    <><Zap size={13} /> Launch Campaign</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
