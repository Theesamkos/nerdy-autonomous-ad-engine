import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, ArrowLeft, Target, Users, Palette, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GOALS = [
  { value: "awareness", label: "Awareness", desc: "Build brand recognition and reach new audiences" },
  { value: "conversion", label: "Conversion", desc: "Drive sign-ups, purchases, and direct action" },
  { value: "retargeting", label: "Retargeting", desc: "Re-engage warm audiences who already know you" },
] as const;

const TONES = [
  { value: "empowering", label: "Empowering", desc: "Inspire and uplift" },
  { value: "urgent", label: "Urgent", desc: "Create FOMO and act-now energy" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { value: "professional", label: "Professional", desc: "Expert, authoritative, credible" },
  { value: "playful", label: "Playful", desc: "Fun, light, personality-forward" },
] as const;

const STEPS = [
  { num: 1, label: "Campaign Brief", icon: Target, code: "01" },
  { num: 2, label: "Target Audience", icon: Users, code: "02" },
  { num: 3, label: "Brand Voice", icon: Palette, code: "03" },
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
        <div className="flex items-center justify-center h-full">
          <div className="bracket border border-[#1a1a1a] p-12 text-center max-w-sm">
            <div className="section-label mb-3">Access Required</div>
            <h2 className="text-xl font-bold text-white mb-3">Sign in to continue</h2>
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

  return (
    <AppLayout>
      <div className="min-h-full p-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="section-label mb-2">Campaign Setup</div>
          <h1 className="text-3xl font-black text-white tracking-tight">New Campaign</h1>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-10 border border-[#0f0f0f]">
          {STEPS.map(({ num, label, icon: Icon, code }, i) => {
            const done = step > num;
            const active = step === num;
            return (
              <div key={num} className="flex-1 flex items-center">
                <button
                  onClick={() => done && setStep(num)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 transition-all ${
                    active ? "bg-[#c8a84b]/06 cursor-default" : done ? "hover:bg-[#0a0a0a] cursor-pointer" : "cursor-default opacity-40"
                  } ${i > 0 ? "border-l border-[#0f0f0f]" : ""}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 border ${
                    done ? "border-[#4ade80]/40 bg-[#4ade80]/08" : active ? "border-[#c8a84b]/60 bg-[#c8a84b]/08" : "border-[#1a1a1a]"
                  }`}>
                    {done
                      ? <CheckCircle className="w-3 h-3 text-[#4ade80]" />
                      : <Icon className={`w-3 h-3 ${active ? "text-[#c8a84b]" : "text-[#333]"}`} />
                    }
                  </div>
                  <div className="text-left min-w-0">
                    <div className={`font-mono text-[9px] tracking-widest uppercase ${active ? "text-[#c8a84b]" : done ? "text-[#4ade80]" : "text-[#333]"}`}>
                      {code}
                    </div>
                    <div className={`font-mono text-[10px] truncate ${active ? "text-white" : done ? "text-[#555]" : "text-[#333]"}`}>
                      {label}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Step 1: Brief */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <div>
                <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#555] mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAT Prep Q1 2025 — Parents"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="ops-input w-full"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#555] mb-2">
                  Product / Service
                </label>
                <textarea
                  placeholder="e.g. 1-on-1 SAT tutoring with expert tutors. Personalized study plans, live sessions, score guarantees."
                  value={form.product}
                  onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  className="ops-input w-full min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#555] mb-3">
                  Campaign Goal
                </label>
                <div className="grid grid-cols-3 gap-px bg-[#0f0f0f]">
                  {GOALS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setForm(f => ({ ...f, campaignGoal: value }))}
                      className={`p-4 text-left transition-all ${
                        form.campaignGoal === value
                          ? "bg-[#c8a84b]/08 border-b-2 border-[#c8a84b]"
                          : "bg-[#060606] hover:bg-[#0a0a0a]"
                      }`}
                    >
                      <div className={`font-mono text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        form.campaignGoal === value ? "text-[#c8a84b]" : "text-[#555]"
                      }`}>{label}</div>
                      <div className="font-mono text-[9px] text-[#383838] leading-relaxed">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.product}
                className="btn-ops btn-ops-primary w-full justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue to Audience <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <div>
                <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#555] mb-2">
                  Target Audience
                </label>
                <textarea
                  placeholder="e.g. Parents of high school juniors/seniors (ages 35-55), anxious about college admissions, household income $75k+, have tried other test prep, comparing options."
                  value={form.audienceSegment}
                  onChange={e => setForm(f => ({ ...f, audienceSegment: e.target.value }))}
                  className="ops-input w-full min-h-[120px] resize-none"
                />
                <div className="font-mono text-[9px] text-[#383838] mt-2">
                  Be specific. The AI uses this to craft resonant, targeted messaging.
                </div>
              </div>

              <div className="bracket border border-[#1a1a1a] p-5 bg-[#060606]">
                <div className="section-label mb-3">Intelligence Tips</div>
                <div className="space-y-2">
                  {[
                    "Include demographics: age, income, education level",
                    "Describe their pain points, fears, and frustrations",
                    "Mention competing solutions they have already tried",
                    "Note what motivates their final decision to buy",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-[#c8a84b]/40 mt-1.5 flex-shrink-0" />
                      <span className="font-mono text-[9px] text-[#444]">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ops btn-ops-ghost flex-1 justify-center">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.audienceSegment}
                  className="btn-ops btn-ops-primary flex-1 justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue to Voice <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Voice */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <div>
                <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#555] mb-3">
                  Brand Tone
                </label>
                <div className="grid grid-cols-1 gap-px bg-[#0f0f0f]">
                  {TONES.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setForm(f => ({ ...f, tone: value }))}
                      className={`flex items-center gap-4 px-5 py-3.5 text-left transition-all ${
                        form.tone === value
                          ? "bg-[#c8a84b]/08 border-l-2 border-[#c8a84b]"
                          : "bg-[#060606] border-l-2 border-transparent hover:bg-[#0a0a0a] hover:border-[#222]"
                      }`}
                    >
                      <div className={`w-2 h-2 flex-shrink-0 ${form.tone === value ? "bg-[#c8a84b]" : "bg-[#222]"}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-mono text-[10px] font-bold uppercase tracking-wider ${form.tone === value ? "text-[#c8a84b]" : "text-[#555]"}`}>
                          {label}
                        </div>
                        <div className="font-mono text-[9px] text-[#383838]">{desc}</div>
                      </div>
                      {form.tone === value && <CheckCircle className="w-3 h-3 text-[#c8a84b] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#555] mb-2">
                  Brand Voice Notes <span className="text-[#2a2a2a] normal-case">(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. We never use fear-based messaging. We celebrate student wins. We're the expert friend, not the corporate tutor. Avoid jargon. Use 'your child' not 'students'."
                  value={form.brandVoiceNotes}
                  onChange={e => setForm(f => ({ ...f, brandVoiceNotes: e.target.value }))}
                  className="ops-input w-full min-h-[90px] resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bracket border border-[#1a1a1a] p-5 bg-[#060606]">
                <div className="section-label mb-4">Campaign Summary</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Name", value: form.name },
                    { label: "Goal", value: form.campaignGoal },
                    { label: "Tone", value: form.tone },
                    { label: "Threshold", value: "7.0 / 10.0" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="section-label mb-0.5">{label}</div>
                      <div className="font-mono text-[10px] text-white capitalize">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-ops btn-ops-ghost flex-1 justify-center">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  onClick={() => createCampaign.mutate(form)}
                  disabled={createCampaign.isPending}
                  className="btn-ops btn-ops-primary flex-1 justify-center disabled:opacity-50"
                >
                  {createCampaign.isPending ? (
                    <>
                      <div className="w-3 h-3 border border-[#c8a84b]/30 border-t-[#c8a84b] rounded-full animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <><Zap className="w-3 h-3" /> Launch Campaign</>
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
