import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Target, Users, Megaphone, Palette } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GOALS = [
  { value: "awareness", label: "Awareness", desc: "Build brand recognition" },
  { value: "conversion", label: "Conversion", desc: "Drive sign-ups & sales" },
  { value: "retargeting", label: "Retargeting", desc: "Re-engage warm audiences" },
] as const;

const TONES = [
  { value: "empowering", label: "Empowering", emoji: "💪" },
  { value: "urgent", label: "Urgent", emoji: "⚡" },
  { value: "friendly", label: "Friendly", emoji: "😊" },
  { value: "professional", label: "Professional", emoji: "🎯" },
  { value: "playful", label: "Playful", emoji: "✨" },
] as const;

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
        toast.success("Campaign created! Let's generate some ads.");
        navigate(`/campaigns/${campaign.id}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <h2 className="font-display text-2xl font-bold text-foreground">Sign in to create campaigns</h2>
          <a href={getLoginUrl()}><Button className="glow-blue">Sign In</Button></a>
        </div>
      </AppLayout>
    );
  }

  const STEPS = [
    { num: 1, label: "Basics", icon: Target },
    { num: 2, label: "Audience", icon: Users },
    { num: 3, label: "Voice", icon: Palette },
  ];

  return (
    <AppLayout>
      <div className="min-h-full p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">New Campaign</h1>
          <p className="text-muted-foreground text-sm mt-1">Set up your ad generation brief</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map(({ num, label, icon: Icon }, i) => (
            <div key={num} className="flex items-center gap-2">
              <button
                onClick={() => num < step && setStep(num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  step === num
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : step > num
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/50 cursor-default"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > num ? "bg-green-500/20 text-green-400" : step === num ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {step > num ? "✓" : num}
                </div>
                <span className="hidden sm:block">{label}</span>
              </button>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Basics */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Campaign Name</Label>
              <Input
                placeholder="e.g. SAT Prep Q1 2025 — Parents"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Product / Service</Label>
              <Textarea
                placeholder="e.g. 1-on-1 SAT tutoring with expert tutors. Personalized study plans, live sessions, score guarantees."
                value={form.product}
                onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[100px]"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-foreground font-medium">Campaign Goal</Label>
              <div className="grid grid-cols-3 gap-3">
                {GOALS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, campaignGoal: value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.campaignGoal === value
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "bg-card border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.product}
              className="w-full gap-2 glow-blue"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Target Audience</Label>
              <Textarea
                placeholder="e.g. Parents of high school juniors/seniors (ages 35-55), anxious about college admissions, household income $75k+, have tried other test prep, comparing options."
                value={form.audienceSegment}
                onChange={e => setForm(f => ({ ...f, audienceSegment: e.target.value }))}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">Be specific — the AI uses this to craft resonant messaging.</p>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">💡 Pro Tips</div>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Include demographics (age, income, education)</li>
                <li>• Describe their pain points and fears</li>
                <li>• Mention competing solutions they've tried</li>
                <li>• Note what motivates their decisions</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!form.audienceSegment}
                className="flex-1 gap-2 glow-blue"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Voice */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Brand Tone</Label>
              <div className="grid grid-cols-5 gap-2">
                {TONES.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, tone: value }))}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      form.tone === value
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "bg-card border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <div className="text-xl mb-1">{emoji}</div>
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Brand Voice Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                placeholder="e.g. We never use fear-based messaging. We celebrate student wins. We're the expert friend, not the corporate tutor. Avoid jargon. Use 'your child' not 'students'."
                value={form.brandVoiceNotes}
                onChange={e => setForm(f => ({ ...f, brandVoiceNotes: e.target.value }))}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[100px]"
              />
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Campaign Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{form.name}</span></div>
                <div><span className="text-muted-foreground">Goal:</span> <span className="text-foreground capitalize">{form.campaignGoal}</span></div>
                <div><span className="text-muted-foreground">Tone:</span> <span className="text-foreground capitalize">{form.tone}</span></div>
                <div><span className="text-muted-foreground">Threshold:</span> <span className="text-primary">7.0 / 10</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button
                onClick={() => createCampaign.mutate(form)}
                disabled={createCampaign.isPending}
                className="flex-1 gap-2 glow-blue"
              >
                {createCampaign.isPending ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Creating...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Launch Campaign</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
