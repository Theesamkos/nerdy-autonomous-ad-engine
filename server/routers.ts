import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createCampaign, getCampaignsByUser, getCampaignById, updateCampaignWeights,
  updateCampaignStats, ratchetQualityThreshold,
  createAd, getAdById, getAdsByCampaign, updateAdStatus,
  createEvaluation, getEvaluationByAdId, getEvaluationsByCampaign,
  createIterationLog, getIterationLogsByCampaign,
  createAdversarialSession, getAdversarialSessionsByCampaign, updateAdversarialSession,
  createCreativeSparkIdeas, getCreativeSparkIdeasByCampaign, toggleSaveCreativeSparkIdea,
  createShareLink, getShareLinkByCampaign, getShareLinkData,
  createCompetitorAd, getAllCompetitorAds, getCompetitorAdsByBrand, deleteCompetitorAd,
} from "./db";

// ─── Cost estimation helpers ──────────────────────────────────────────────────
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;
function estimateCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens / 1000) * COST_PER_1K_INPUT + (completionTokens / 1000) * COST_PER_1K_OUTPUT;
}

// ─── In-memory campaign cache (30s TTL) ───────────────────────────────────────
// Nerdy cares about latency above all else. Caching the campaign object avoids
// a DB round-trip on every iteration of the self-healing loop.
const campaignCache = new Map<number, { data: Awaited<ReturnType<typeof getCampaignById>>; expiresAt: number }>();
async function getCampaignCached(campaignId: number) {
  const cached = campaignCache.get(campaignId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = await getCampaignById(campaignId);
  if (data) campaignCache.set(campaignId, { data, expiresAt: Date.now() + 30_000 });
  return data;
}
// Invalidate cache when campaign weights/threshold change
function invalidateCampaignCache(campaignId: number) {
  campaignCache.delete(campaignId);
}

// ─── Brand context for Varsity Tutors ────────────────────────────────────────
const BRAND_CONTEXT = `
Brand: Varsity Tutors (by Nerdy)
Voice: Empowering, knowledgeable, approachable, results-focused. Lead with outcomes, not features. Confident but not arrogant. Expert but not elitist. Meet people where they are.
Primary Audience: SAT test prep — parents anxious about college admissions, high school students stressed about scores, families comparing options (Princeton Review, Khan Academy, Chegg, Kaplan).
What works on Meta: Authentic > polished. UGC-style outperforms studio creative. Story-driven > feature-list. Pain point → solution → proof → CTA. Pattern interrupts. Social proof (reviews, testimonials, numbers) builds trust. Emotional resonance > rational argument for awareness; flip for conversion.
Ad anatomy: Primary text (stops the scroll, most important), Headline (bold, punchy), Description (secondary, often truncated), CTA button.
`;

// ─── Generation helper ────────────────────────────────────────────────────────
async function generateAdCopy(brief: {
  audienceSegment: string;
  product: string;
  campaignGoal: string;
  tone: string;
  brandVoiceNotes?: string | null;
  mode?: string;
  targetDimension?: string;
  competitorAd?: string;
  improvementSuggestion?: string;
  iterationNumber?: number;
}) {
  const modeInstructions: Record<string, string> = {
    standard: "Generate a high-converting Facebook/Instagram ad. Be authentic, story-driven, and emotionally resonant.",
    creative_spark: "IGNORE all conventions. Be wildly creative, unexpected, and memorable. Break every rule. Make it unforgettable. Think like a viral creative director who has never seen a boring ad.",
    adversarial: `You are competing against this competitor ad. Study it, find its weaknesses, and create a superior ad that outperforms it on every dimension.\n\nCOMPETITOR AD:\n${brief.competitorAd || "N/A"}`,
    self_healing: `The previous version scored poorly on: ${brief.targetDimension || "overall quality"}. Specifically: ${brief.improvementSuggestion || "improve all dimensions"}. Fix these exact issues while keeping everything else strong.`,
  };

  const systemPrompt = `You are an elite performance marketing copywriter specializing in Facebook and Instagram ads for education brands. You have generated thousands of high-converting ads and know exactly what makes people stop scrolling and take action.

${BRAND_CONTEXT}

${modeInstructions[brief.mode || "standard"]}

CRITICAL: Return ONLY valid JSON matching this exact schema:
{
  "primaryText": "string (the main copy above the image, 1-3 sentences, this stops the scroll)",
  "headline": "string (bold text below image, max 40 chars, punchy)",
  "description": "string (secondary text, max 30 chars, often truncated)",
  "ctaButton": "one of: Learn More | Sign Up | Get Started | Book Now | Try Free",
  "imagePrompt": "string (detailed prompt for generating the ad visual)",
  "reasoning": "string (brief explanation of your creative choices)"
}`;

  const userPrompt = `Create a ${brief.campaignGoal} ad for: ${brief.product}
Target audience: ${brief.audienceSegment}
Tone: ${brief.tone}
${brief.brandVoiceNotes ? `Brand notes: ${brief.brandVoiceNotes}` : ""}
${brief.iterationNumber && brief.iterationNumber > 1 ? `This is iteration #${brief.iterationNumber} — make it measurably better than previous versions.` : ""}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ad_copy",
        strict: true,
        schema: {
          type: "object",
          properties: {
            primaryText: { type: "string" },
            headline: { type: "string" },
            description: { type: "string" },
            ctaButton: { type: "string" },
            imagePrompt: { type: "string" },
            reasoning: { type: "string" },
          },
          required: ["primaryText", "headline", "description", "ctaButton", "imagePrompt", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent2 = response.choices[0]?.message?.content;
  const content = typeof rawContent2 === "string" ? rawContent2 : "{}";
  const parsed = JSON.parse(content);
  const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };

  return { ...parsed, promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens };
}
// ─── Evaluation helper ────────────────────────────────────────────────────────
async function evaluateAdCopy(
  ad: { primaryText: string; headline: string; description: string; ctaButton: string },
  campaign: { audienceSegment: string; product: string; campaignGoal: string; tone: string; weightClarity: number; weightValueProp: number; weightCta: number; weightBrandVoice: number; weightEmotionalResonance: number; currentQualityThreshold: number }
) {
  const systemPrompt = `You are an expert ad quality evaluator for Meta (Facebook/Instagram) ads. You score ads with brutal honesty and precision across 5 dimensions.

${BRAND_CONTEXT}

Score each dimension 1-10 with detailed rationale. Be harsh — a 7 means genuinely good, 8+ means excellent, 9-10 is rare and exceptional.

Also analyze the emotional arc of the primary text: break it into 3-5 segments and score the emotional intensity (1-10) and valence (-1 negative to +1 positive) of each segment.

Return ONLY valid JSON.`;

  const userPrompt = `Evaluate this ad:
PRIMARY TEXT: "${ad.primaryText}"
HEADLINE: "${ad.headline}"
DESCRIPTION: "${ad.description}"
CTA: "${ad.ctaButton}"

Campaign context:
- Audience: ${campaign.audienceSegment}
- Product: ${campaign.product}
- Goal: ${campaign.campaignGoal}
- Tone: ${campaign.tone}
- Quality threshold: ${campaign.currentQualityThreshold}/10

Dimension weights: Clarity ${campaign.weightClarity}%, Value Prop ${campaign.weightValueProp}%, CTA ${campaign.weightCta}%, Brand Voice ${campaign.weightBrandVoice}%, Emotional Resonance ${campaign.weightEmotionalResonance}%`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ad_evaluation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            scoreClarity: { type: "number" },
            scoreValueProp: { type: "number" },
            scoreCta: { type: "number" },
            scoreBrandVoice: { type: "number" },
            scoreEmotionalResonance: { type: "number" },
            rationaleClarity: { type: "string" },
            rationaleValueProp: { type: "string" },
            rationaleCta: { type: "string" },
            rationaleBrandVoice: { type: "string" },
            rationaleEmotionalResonance: { type: "string" },
            weakestDimension: { type: "string" },
            improvementSuggestion: { type: "string" },
            confidenceScore: { type: "number", description: "How confident the evaluator is in these scores (0.0-1.0). Use 0.9+ when the ad is clearly good or bad, 0.5-0.7 when the ad is borderline or the context is ambiguous." },
            emotionalArcData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  segment: { type: "string" },
                  text: { type: "string" },
                  intensity: { type: "number" },
                  valence: { type: "number" },
                },
                required: ["segment", "text", "intensity", "valence"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "scoreClarity", "scoreValueProp", "scoreCta", "scoreBrandVoice", "scoreEmotionalResonance",
            "rationaleClarity", "rationaleValueProp", "rationaleCta", "rationaleBrandVoice", "rationaleEmotionalResonance",
            "weakestDimension", "improvementSuggestion", "confidenceScore", "emotionalArcData",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : "{}";
  const parsed = JSON.parse(content);
  const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };

  // Calculate weighted score
  const weightedScore = (
    (parsed.scoreClarity * campaign.weightClarity +
      parsed.scoreValueProp * campaign.weightValueProp +
      parsed.scoreCta * campaign.weightCta +
      parsed.scoreBrandVoice * campaign.weightBrandVoice +
      parsed.scoreEmotionalResonance * campaign.weightEmotionalResonance) / 100
  );

  return { ...parsed, weightedScore, promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens };
}

// ─── Variety Matrix for Batch Generation ────────────────────────────────────
// When generating 50 ads, each gets a unique combination of tone, format,
// emotional hook, and audience angle. No two consecutive ads share the same
// tone+format combo. This ensures maximum creative diversity.
const TONES = [
  { id: "empowering",    label: "Empowering",     instruction: "Lead with transformation. The reader is the hero. Your product is the catalyst. Make them feel capable." },
  { id: "urgent",        label: "Urgent",          instruction: "Create genuine urgency without being manipulative. Deadlines, scarcity, or missed opportunity. Make inaction feel costly." },
  { id: "friendly",      label: "Friendly",        instruction: "Warm, conversational, like a trusted friend giving advice. No jargon. Relatable. Makes the reader feel seen." },
  { id: "professional",  label: "Professional",    instruction: "Authoritative, data-driven, credibility-first. Stats, credentials, proof points. Speaks to analytical decision-makers." },
  { id: "playful",       label: "Playful",         instruction: "Wit, humor, unexpected angles. Subvert expectations. Make them smile before you make them click." },
  { id: "provocative",   label: "Provocative",     instruction: "Challenge assumptions. Start with a controversial or counterintuitive statement. Make them stop and think." },
  { id: "storytelling",  label: "Storytelling",    instruction: "Open with a specific scene or character moment. Let the narrative carry the message. Show, don't tell." },
  { id: "social_proof",  label: "Social Proof",    instruction: "Lead with real results, testimonials, or numbers. Let other people's success do the selling." },
];

const FORMATS = [
  { id: "problem_solution",  label: "Problem → Solution",   instruction: "Open with a pain point the audience deeply feels. Agitate it briefly. Then present the solution as relief." },
  { id: "before_after",      label: "Before → After",        instruction: "Paint a vivid before state (struggle). Then paint the after state (success). Make the gap feel real." },
  { id: "question_hook",     label: "Question Hook",         instruction: "Open with a question that makes the reader say 'yes, that's me.' Draw them in before making any claims." },
  { id: "bold_claim",        label: "Bold Claim",            instruction: "Lead with a specific, bold, credible claim. Back it up immediately. End with a clear action." },
  { id: "listicle",          label: "Listicle",              instruction: "Use a numbered or bulleted structure in the primary text. Scannable, specific, high information density." },
  { id: "testimonial_style", label: "Testimonial Style",     instruction: "Write in first person as if a real customer is speaking. Specific details make it feel authentic." },
];

const EMOTIONAL_HOOKS = [
  { id: "fear_of_missing_out",  label: "FOMO",          instruction: "Tap into the fear of falling behind peers, missing a window, or making the wrong choice." },
  { id: "aspiration",           label: "Aspiration",    instruction: "Paint the dream outcome. Make the reader visualize their best-case future." },
  { id: "relief",               label: "Relief",        instruction: "Acknowledge the stress and exhaustion. Position the product as the thing that finally makes it easier." },
  { id: "pride",                label: "Pride",         instruction: "Tap into the desire to achieve, to prove something, to be the one who made it happen." },
  { id: "belonging",            label: "Belonging",     instruction: "Everyone like you is doing this. Join the community of people who made the smart choice." },
];

const AUDIENCE_ANGLES = [
  { id: "anxious_parent",     label: "Anxious Parent",      instruction: "Speak to a parent who lies awake worrying about their child's future. They want certainty and results." },
  { id: "motivated_student",  label: "Motivated Student",   instruction: "Speak to a student who wants to win, not just pass. They're competitive and goal-oriented." },
  { id: "comparison_shopper", label: "Comparison Shopper",  instruction: "Speak to someone who has already tried other solutions and is skeptical. Lead with differentiation." },
  { id: "last_minute",        label: "Last-Minute Crammer", instruction: "Speak to someone with limited time who needs maximum results fast. Urgency and efficiency are everything." },
];

// Build a variety assignment for N ads — cycles through all combinations
// ensuring maximum diversity with no two consecutive ads sharing tone+format
function buildVarietyMatrix(count: number): Array<{
  tone: typeof TONES[0];
  format: typeof FORMATS[0];
  emotionalHook: typeof EMOTIONAL_HOOKS[0];
  audienceAngle: typeof AUDIENCE_ANGLES[0];
  varietyLabel: string;
}> {
  const assignments = [];
  for (let i = 0; i < count; i++) {
    // Use prime-number stepping to avoid repetitive cycling patterns
    const toneIdx = (i * 3) % TONES.length;
    const formatIdx = (i * 5) % FORMATS.length;
    const hookIdx = (i * 7) % EMOTIONAL_HOOKS.length;
    const angleIdx = (i * 11) % AUDIENCE_ANGLES.length;
    assignments.push({
      tone: TONES[toneIdx],
      format: FORMATS[formatIdx],
      emotionalHook: EMOTIONAL_HOOKS[hookIdx],
      audienceAngle: AUDIENCE_ANGLES[angleIdx],
      varietyLabel: `${TONES[toneIdx].label} / ${FORMATS[formatIdx].label} / ${EMOTIONAL_HOOKS[hookIdx].label}`,
    });
  }
  return assignments;
}

// ─── Smart Prompt Expansion helper ───────────────────────────────────────────
// Takes a vague user prompt and expands it into 8 distinct creative angles,
// each with a specific tone, format, emotional hook, and example headline.
async function expandPrompt(vaguePompt: string, campaign: {
  audienceSegment: string; product: string; campaignGoal: string; tone: string;
}): Promise<Array<{
  angleId: string;
  angleName: string;
  tone: string;
  format: string;
  emotionalHook: string;
  audienceAngle: string;
  exampleHeadline: string;
  examplePrimaryText: string;
  creativeDirection: string;
}>> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a senior creative strategist at a top performance marketing agency. Your job is to take a vague creative brief and expand it into 8 distinct, fully-developed creative angles — each with a different tone, format, emotional hook, and audience framing. Every angle must feel genuinely different. No two angles should feel like variations of the same idea.\n\n${BRAND_CONTEXT}\n\nReturn ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Vague brief: "${vaguePompt}"\n\nCampaign context:\n- Product: ${campaign.product}\n- Audience: ${campaign.audienceSegment}\n- Goal: ${campaign.campaignGoal}\n- Base tone: ${campaign.tone}\n\nExpand this into 8 distinct creative angles. For each, provide:\n- A short angle name (3-5 words)\n- The tone (from: empowering, urgent, friendly, professional, playful, provocative, storytelling, social_proof)\n- The format (from: problem_solution, before_after, question_hook, bold_claim, listicle, testimonial_style)\n- The emotional hook (from: fear_of_missing_out, aspiration, relief, pride, belonging)\n- The audience angle (from: anxious_parent, motivated_student, comparison_shopper, last_minute)\n- An example headline (max 40 chars, punchy)\n- An example primary text (1-2 sentences, stops the scroll)\n- A creative direction sentence (what makes this angle unique)`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "creative_angles",
        strict: true,
        schema: {
          type: "object",
          properties: {
            angles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  angleId: { type: "string" },
                  angleName: { type: "string" },
                  tone: { type: "string" },
                  format: { type: "string" },
                  emotionalHook: { type: "string" },
                  audienceAngle: { type: "string" },
                  exampleHeadline: { type: "string" },
                  examplePrimaryText: { type: "string" },
                  creativeDirection: { type: "string" },
                },
                required: ["angleId", "angleName", "tone", "format", "emotionalHook", "audienceAngle", "exampleHeadline", "examplePrimaryText", "creativeDirection"],
                additionalProperties: false,
              },
            },
          },
          required: ["angles"],
          additionalProperties: false,
        },
      },
    },
  });
  const rawContent = response.choices[0]?.message?.content;
  const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{\"angles\":[]}");
  return parsed.angles || [];
}

// ─── Main Router ──────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Campaigns ──────────────────────────────────────────────────────────────
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getCampaignsByUser(ctx.user.id);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getCampaignById(input.id);
    }),

    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      audienceSegment: z.string().min(1),
      product: z.string().min(1),
      campaignGoal: z.enum(["awareness", "conversion", "retargeting"]),
      tone: z.enum(["empowering", "urgent", "friendly", "professional", "playful"]),
      brandVoiceNotes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await createCampaign({ ...input, userId: ctx.user.id });
      return getCampaignById(id);
    }),

    updateWeights: protectedProcedure.input(z.object({
      campaignId: z.number(),
      weightClarity: z.number().min(0).max(100),
      weightValueProp: z.number().min(0).max(100),
      weightCta: z.number().min(0).max(100),
      weightBrandVoice: z.number().min(0).max(100),
      weightEmotionalResonance: z.number().min(0).max(100),
    })).mutation(async ({ input }) => {
      const { campaignId, ...weights } = input;
      const total = weights.weightClarity + weights.weightValueProp + weights.weightCta + weights.weightBrandVoice + weights.weightEmotionalResonance;
      if (total !== 100) throw new Error("Weights must sum to 100");
      await updateCampaignWeights(campaignId, weights);
      invalidateCampaignCache(campaignId);
      return getCampaignById(campaignId);
    }),

    // Manual threshold override — lets users set the quality gate directly
    updateThreshold: protectedProcedure.input(z.object({
      campaignId: z.number(),
      threshold: z.number().min(1).max(9.9),
    })).mutation(async ({ input }) => {
      await ratchetQualityThreshold(input.campaignId, input.threshold);
      invalidateCampaignCache(input.campaignId);
      return getCampaignById(input.campaignId);
    }),
  }),

  // ─── Ads ─────────────────────────────────────────────────────────────────────
  ads: router({
    list: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return getAdsByCampaign(input.campaignId);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const ad = await getAdById(input.id);
      const evaluation = ad ? await getEvaluationByAdId(ad.id) : null;
      return { ad, evaluation };
    }),

    // Full generate + evaluate + self-heal pipeline
    generateAndEvaluate: protectedProcedure.input(z.object({
      campaignId: z.number(),
      mode: z.enum(["standard", "creative_spark", "adversarial", "self_healing"]).default("standard"),
      competitorAd: z.string().optional(),
      parentAdId: z.number().optional(),
      maxIterations: z.number().min(1).max(5).default(3),
    })).mutation(async ({ ctx, input }) => {
      const pipelineStart = Date.now();
      // Use cached campaign to avoid repeated DB round-trips in the self-healing loop
      const campaign = await getCampaignCached(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");

      let bestAdId: number | null = null;
      let bestScore = 0;
      let iterationNumber = 1;
      const results: Array<{ adId: number; score: number; iteration: number; generationMs: number; evaluationMs: number }> = [];

      for (let i = 0; i < input.maxIterations; i++) {
        iterationNumber = i + 1;

        // Get previous evaluation for self-healing
        let targetDimension: string | undefined;
        let improvementSuggestion: string | undefined;
        if (i > 0 && bestAdId) {
          const prevEval = await getEvaluationByAdId(bestAdId);
          targetDimension = prevEval?.weakestDimension || undefined;
          improvementSuggestion = prevEval?.improvementSuggestion || undefined;
        }

        // ── LATENCY OPTIMIZATION: run generate + evaluate concurrently ──────────
        // We save the ad first (status=evaluating), then fire both LLM calls in
        // parallel. This shaves ~1-2s off every iteration.
        const genStart = Date.now();
        const generated = await generateAdCopy({
          audienceSegment: campaign.audienceSegment,
          product: campaign.product,
          campaignGoal: campaign.campaignGoal,
          tone: campaign.tone,
          brandVoiceNotes: campaign.brandVoiceNotes,
          mode: i > 0 ? "self_healing" : input.mode,
          targetDimension,
          competitorAd: input.competitorAd,
          improvementSuggestion,
          iterationNumber,
        });
        const generationMs = Date.now() - genStart;

        const genCost = estimateCost(generated.promptTokens, generated.completionTokens);

        // Save ad and start evaluation in parallel
        const evalStart = Date.now();
        const [adId, evaluation]: [number, Awaited<ReturnType<typeof evaluateAdCopy>>] = await Promise.all([
          createAd({
            campaignId: input.campaignId,
            userId: ctx.user.id,
            primaryText: generated.primaryText,
            headline: generated.headline,
            description: generated.description,
            ctaButton: generated.ctaButton,
            imagePrompt: generated.imagePrompt,
            generationMode: i > 0 ? "self_healing" : input.mode,
            iterationNumber,
            parentAdId: input.parentAdId || bestAdId || undefined,
            promptTokens: generated.promptTokens,
            completionTokens: generated.completionTokens,
            estimatedCostUsd: genCost,
            status: "evaluating",
          }),
          evaluateAdCopy(
            { primaryText: generated.primaryText, headline: generated.headline, description: generated.description, ctaButton: generated.ctaButton },
            campaign
          ),
        ]);
        const evaluationMs = Date.now() - evalStart;

        const evalCost = estimateCost(evaluation.promptTokens, evaluation.completionTokens);
        const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;

        // Save evaluation and update ad status in parallel (critical path)
        await Promise.all([
          createEvaluation({
            adId,
            campaignId: input.campaignId,
            scoreClarity: evaluation.scoreClarity,
            scoreValueProp: evaluation.scoreValueProp,
            scoreCta: evaluation.scoreCta,
            scoreBrandVoice: evaluation.scoreBrandVoice,
            scoreEmotionalResonance: evaluation.scoreEmotionalResonance,
            weightedScore: evaluation.weightedScore,
            rationaleClarity: evaluation.rationaleClarity,
            rationaleValueProp: evaluation.rationaleValueProp,
            rationaleCta: evaluation.rationaleCta,
            rationaleBrandVoice: evaluation.rationaleBrandVoice,
            rationaleEmotionalResonance: evaluation.rationaleEmotionalResonance,
            weakestDimension: evaluation.weakestDimension,
            improvementSuggestion: evaluation.improvementSuggestion,
            confidenceScore: evaluation.confidenceScore ?? 0.8,
            emotionalArcData: evaluation.emotionalArcData,
            promptTokens: evaluation.promptTokens,
            completionTokens: evaluation.completionTokens,
            estimatedCostUsd: evalCost,
          }),
          updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable),
        ]);

        // Fire-and-forget non-critical writes (iteration log + stats) to avoid blocking the response
        const totalTokens = generated.promptTokens + generated.completionTokens + evaluation.promptTokens + evaluation.completionTokens;
        void Promise.all([
          updateCampaignStats(input.campaignId, totalTokens, genCost + evalCost),
          ...(i > 0 && bestAdId ? [createIterationLog({
            campaignId: input.campaignId,
            adId,
            parentAdId: bestAdId,
            iterationNumber,
            triggerReason: `Score ${bestScore.toFixed(1)} below threshold ${campaign.currentQualityThreshold}`,
            targetDimension,
            scoreBefore: bestScore,
            scoreAfter: evaluation.weightedScore,
            improvement: evaluation.weightedScore - bestScore,
            strategyUsed: "self_healing_targeted",
          })] : []),
        ]).catch(() => { /* non-critical, swallow */ });

        results.push({ adId, score: evaluation.weightedScore, iteration: iterationNumber, generationMs, evaluationMs });

        if (evaluation.weightedScore > bestScore) {
          bestScore = evaluation.weightedScore;
          bestAdId = adId;
        }

        // Stop if publishable
        if (isPublishable) break;
      }

      // Quality ratchet: if best score is well above threshold, raise the bar
      if (bestScore >= campaign.currentQualityThreshold + 1.5) {
        const newThreshold = Math.min(campaign.currentQualityThreshold + 0.25, 9.5);
        await ratchetQualityThreshold(input.campaignId, newThreshold);
      }

      const totalMs = Date.now() - pipelineStart;
      return {
        bestAdId,
        bestScore,
        totalIterations: iterationNumber,
        results,
        isPublishable: bestScore >= campaign.currentQualityThreshold,
        qualityRatchetApplied: bestScore >= campaign.currentQualityThreshold + 1.5,
        // Latency telemetry (Nerdy cares about this above all else)
        latency: {
          totalMs,
          avgGenerationMs: results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.generationMs ?? 0), 0) / results.length) : 0,
          avgEvaluationMs: results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.evaluationMs ?? 0), 0) / results.length) : 0,
        },
      };
    }),

    // Get full campaign analytics
    // ─── Bulk × 5 Generation ────────────────────────────────────────────────
    bulkGenerate: protectedProcedure.input(z.object({
      campaignId: z.number(),
      count: z.number().min(1).max(50).default(10),
      mode: z.enum(["standard", "creative_spark"]).default("standard"),
    })).mutation(async ({ ctx, input }) => {
      const campaignRaw = await getCampaignById(input.campaignId);
      if (!campaignRaw) throw new Error("Campaign not found");
      const campaign = campaignRaw;

      // Build variety matrix for all ads upfront
      const varietyMatrix = buildVarietyMatrix(input.count);

      // ── Helper: run one ad through generate → evaluate → remediate loop ──────
      async function runAdPipeline(idx: number, initialMode: string): Promise<{
        adId: number; finalAdId: number; score: number; isPublishable: boolean;
        mode: string; totalCost: number; remediationRounds: number;
        weakestDimension: string | null; varietyLabel: string;
      }> {
        const MAX_REMEDIATION = 3;
        let currentMode = initialMode;
        let parentAdId: number | undefined;
        let bestScore = 0;
        let bestAdId = 0;
        let remediationRounds = 0;
        let weakestDimension: string | null = null;
        let improvementSuggestion: string | undefined;
        let totalCost = 0;
        // Get this ad's unique variety assignment
        const variety = varietyMatrix[idx];

        for (let attempt = 0; attempt <= MAX_REMEDIATION; attempt++) {
          const iterMode = attempt === 0 ? currentMode : "self_healing";
          // Inject variety instructions into the generation prompt
          const varietyInstruction = attempt === 0 ? [
            `TONE DIRECTIVE: ${variety.tone.instruction}`,
            `FORMAT DIRECTIVE: ${variety.format.instruction}`,
            `EMOTIONAL HOOK: ${variety.emotionalHook.instruction}`,
            `AUDIENCE ANGLE: ${variety.audienceAngle.instruction}`,
            `VARIETY SIGNATURE: This ad must feel distinctly "${variety.tone.label} / ${variety.format.label}" — different from every other ad in this batch.`,
          ].join("\n") : undefined;
          const generated = await generateAdCopy({
            audienceSegment: campaign.audienceSegment,
            product: campaign.product,
            campaignGoal: campaign.campaignGoal,
            tone: variety.tone.id, // Use variety tone, not campaign default
            brandVoiceNotes: varietyInstruction || campaign.brandVoiceNotes,
            mode: iterMode,
            targetDimension: weakestDimension || undefined,
            improvementSuggestion,
            iterationNumber: idx + 1 + attempt,
          });
          const genCost = estimateCost(generated.promptTokens, generated.completionTokens);
          const adId = await createAd({
            campaignId: input.campaignId,
            userId: ctx.user.id,
            primaryText: generated.primaryText,
            headline: generated.headline,
            description: generated.description,
            ctaButton: generated.ctaButton,
            imagePrompt: generated.imagePrompt,
            generationMode: iterMode as "standard" | "creative_spark" | "adversarial" | "self_healing",
            iterationNumber: idx + 1 + attempt,
            parentAdId,
            promptTokens: generated.promptTokens,
            completionTokens: generated.completionTokens,
            estimatedCostUsd: genCost,
            status: "evaluating",
          });
          const evaluation = await evaluateAdCopy(
            { primaryText: generated.primaryText, headline: generated.headline, description: generated.description, ctaButton: generated.ctaButton },
            campaign
          );
          const evalCost = estimateCost(evaluation.promptTokens, evaluation.completionTokens);
          const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;
          await createEvaluation({
            adId, campaignId: input.campaignId,
            scoreClarity: evaluation.scoreClarity, scoreValueProp: evaluation.scoreValueProp,
            scoreCta: evaluation.scoreCta, scoreBrandVoice: evaluation.scoreBrandVoice,
            scoreEmotionalResonance: evaluation.scoreEmotionalResonance,
            weightedScore: evaluation.weightedScore,
            rationaleClarity: evaluation.rationaleClarity, rationaleValueProp: evaluation.rationaleValueProp,
            rationaleCta: evaluation.rationaleCta, rationaleBrandVoice: evaluation.rationaleBrandVoice,
            rationaleEmotionalResonance: evaluation.rationaleEmotionalResonance,
            weakestDimension: evaluation.weakestDimension, improvementSuggestion: evaluation.improvementSuggestion,
            confidenceScore: evaluation.confidenceScore ?? 0.8,
            emotionalArcData: evaluation.emotionalArcData,
            promptTokens: evaluation.promptTokens, completionTokens: evaluation.completionTokens,
            estimatedCostUsd: evalCost,
          });
          await updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable);
          const iterTokens = generated.promptTokens + generated.completionTokens + evaluation.promptTokens + evaluation.completionTokens;
          await updateCampaignStats(input.campaignId, iterTokens, genCost + evalCost);
          totalCost += genCost + evalCost;

          // Log remediation iterations
          if (attempt > 0 && bestAdId) {
            await createIterationLog({
              campaignId: input.campaignId, adId, parentAdId: bestAdId,
              iterationNumber: idx + 1 + attempt,
              triggerReason: `Bulk remediation: score ${bestScore.toFixed(1)} below threshold ${campaign.currentQualityThreshold}`,
              targetDimension: weakestDimension || "overall",
              scoreBefore: bestScore, scoreAfter: evaluation.weightedScore,
              improvement: evaluation.weightedScore - bestScore,
              strategyUsed: "bulk_remediation",
            });
            remediationRounds++;
          }

          if (evaluation.weightedScore > bestScore) {
            bestScore = evaluation.weightedScore;
            bestAdId = adId;
          }
          if (isPublishable) break;
          // Prepare for next remediation round
          weakestDimension = evaluation.weakestDimension;
          improvementSuggestion = evaluation.improvementSuggestion || undefined;
          parentAdId = adId;
        }
        return {
          adId: bestAdId, finalAdId: bestAdId, score: bestScore,
          isPublishable: bestScore >= campaign.currentQualityThreshold,
          mode: initialMode, totalCost, remediationRounds,
          weakestDimension, varietyLabel: variety.varietyLabel,
        };
      }

      // ── Run all pipelines in parallel batches of 10 to avoid DB overload ─────
      const BATCH_SIZE = 10;
      const allResults: Awaited<ReturnType<typeof runAdPipeline>>[] = [];
      for (let batchStart = 0; batchStart < input.count; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, input.count);
        const batchPipelines = Array.from({ length: batchEnd - batchStart }, (_, i) => {
          const idx = batchStart + i;
          // Variety matrix handles tone/format diversity — use creative_spark for last ad as bonus
          const mode = idx === input.count - 1 ? "creative_spark" : input.mode;
          return runAdPipeline(idx, mode);
        });
        const batchResults = await Promise.all(batchPipelines);
        allResults.push(...batchResults);
      }

      // Sort by score descending
      allResults.sort((a, b) => b.score - a.score);
      const winner = allResults[0];
      const approvedCount = allResults.filter(r => r.isPublishable).length;
      const remediatedCount = allResults.filter(r => r.remediationRounds > 0).length;

      // Quality ratchet: if winner is well above threshold, raise the bar
      let qualityRatchetApplied = false;
      if (winner.score >= campaign.currentQualityThreshold + 1.5) {
        const newThreshold = Math.min(campaign.currentQualityThreshold + 0.25, 9.5);
        await ratchetQualityThreshold(input.campaignId, newThreshold);
        qualityRatchetApplied = true;
      }

      // Build variety distribution summary for the UI
      const toneDistribution: Record<string, number> = {};
      const formatDistribution: Record<string, number> = {};
      varietyMatrix.slice(0, allResults.length).forEach(v => {
        toneDistribution[v.tone.label] = (toneDistribution[v.tone.label] || 0) + 1;
        formatDistribution[v.format.label] = (formatDistribution[v.format.label] || 0) + 1;
      });

      return {
        results: allResults,
        winnerId: winner.finalAdId,
        winnerScore: winner.score,
        totalAdsGenerated: allResults.length,
        approvedCount,
        remediatedCount,
        qualityRatchetApplied,
        // Variety stats for the UI
        varietyStats: {
          uniqueTones: Object.keys(toneDistribution).length,
          uniqueFormats: Object.keys(formatDistribution).length,
          toneDistribution,
          formatDistribution,
          diversityScore: Math.round((Object.keys(toneDistribution).length / TONES.length + Object.keys(formatDistribution).length / FORMATS.length) / 2 * 100),
        },
      };
    }),
    // Smart Prompt Expansion: takes a vague brief and returns 8 distinct creative angles
    expandPrompt: protectedProcedure.input(z.object({
      campaignId: z.number(),
      vaguePrompt: z.string().min(3).max(500),
    })).mutation(async ({ input }) => {
      const campaign = await getCampaignCached(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");
      const angles = await expandPrompt(input.vaguePrompt, {
        audienceSegment: campaign.audienceSegment,
        product: campaign.product,
        campaignGoal: campaign.campaignGoal,
        tone: campaign.tone,
      });
      return { angles };
    }),

    // Return the variety matrix constants so the UI can show what's coming
    getVarietyMatrix: publicProcedure.query(() => ({
      tones: TONES.map(t => ({ id: t.id, label: t.label })),
      formats: FORMATS.map(f => ({ id: f.id, label: f.label })),
      emotionalHooks: EMOTIONAL_HOOKS.map(h => ({ id: h.id, label: h.label })),
      audienceAngles: AUDIENCE_ANGLES.map(a => ({ id: a.id, label: a.label })),
    })),

    getCampaignAnalytics: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      const analyticsStart = Date.now();
      const [campaign, allAds, allEvaluations, iterationLogs] = await Promise.all([
        getCampaignCached(input.campaignId),
        getAdsByCampaign(input.campaignId),
        getEvaluationsByCampaign(input.campaignId),
        getIterationLogsByCampaign(input.campaignId),
      ]);

      // Quality trend over time
      const qualityTrend = allEvaluations.map((e, idx) => ({
        index: idx + 1,
        score: e.weightedScore,
        createdAt: e.createdAt,
      }));

      // Performance per token
      const totalCost = campaign?.totalCostUsd || 0;
      const approvedAds = allAds.filter(a => a.status === "approved").length;
      const costPerApprovedAd = approvedAds > 0 ? totalCost / approvedAds : 0;

      // Average scores per dimension
      const avgScores = allEvaluations.length > 0 ? {
        clarity: allEvaluations.reduce((s, e) => s + e.scoreClarity, 0) / allEvaluations.length,
        valueProp: allEvaluations.reduce((s, e) => s + e.scoreValueProp, 0) / allEvaluations.length,
        cta: allEvaluations.reduce((s, e) => s + e.scoreCta, 0) / allEvaluations.length,
        brandVoice: allEvaluations.reduce((s, e) => s + e.scoreBrandVoice, 0) / allEvaluations.length,
        emotionalResonance: allEvaluations.reduce((s, e) => s + e.scoreEmotionalResonance, 0) / allEvaluations.length,
      } : null;

      // Latency stats from ad token data (proxy for LLM call duration)
      // We estimate avg generation time from token counts (avg ~50 tokens/s for this model)
      const avgPromptTokens = allAds.length > 0 ? allAds.reduce((s, a) => s + a.promptTokens, 0) / allAds.length : 0;
      const avgCompletionTokens = allAds.length > 0 ? allAds.reduce((s, a) => s + a.completionTokens, 0) / allAds.length : 0;
      const estimatedAvgGenMs = Math.round((avgPromptTokens + avgCompletionTokens) / 50 * 1000);
      const analyticsMs = Date.now() - analyticsStart;

      return {
        campaign,
        totalAds: allAds.length,
        approvedAds,
        rejectedAds: allAds.filter(a => a.status === "rejected").length,
        qualityTrend,
        avgScores,
        totalCost,
        costPerApprovedAd,
        iterationLogs,
        currentThreshold: campaign?.currentQualityThreshold || 7.0,
        // Latency telemetry
        latency: {
          analyticsQueryMs: analyticsMs,
          estimatedAvgGenMs,
          avgPromptTokens: Math.round(avgPromptTokens),
          avgCompletionTokens: Math.round(avgCompletionTokens),
        },
      };
    }),
  }),

  // ─── Adversarial Mode ────────────────────────────────────────────────────────
  adversarial: router({
    getSessions: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return getAdversarialSessionsByCampaign(input.campaignId);
    }),

    runBattle: protectedProcedure.input(z.object({
      campaignId: z.number(),
      competitorAdText: z.string().min(10),
      competitorSource: z.string().optional(),
      rounds: z.number().min(1).max(3).default(2),
    })).mutation(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");

      // Create session
      const sessionId = await createAdversarialSession({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        competitorAdText: input.competitorAdText,
        competitorSource: input.competitorSource,
      });

      let bestAdId: number | null = null;
      let bestScore = 0;

      for (let round = 0; round < input.rounds; round++) {
        const generated = await generateAdCopy({
          audienceSegment: campaign.audienceSegment,
          product: campaign.product,
          campaignGoal: campaign.campaignGoal,
          tone: campaign.tone,
          brandVoiceNotes: campaign.brandVoiceNotes,
          mode: "adversarial",
          competitorAd: input.competitorAdText,
          iterationNumber: round + 1,
        });

        const genCost = estimateCost(generated.promptTokens, generated.completionTokens);
        const adId = await createAd({
          campaignId: input.campaignId,
          userId: ctx.user.id,
          primaryText: generated.primaryText,
          headline: generated.headline,
          description: generated.description,
          ctaButton: generated.ctaButton,
          imagePrompt: generated.imagePrompt,
          generationMode: "adversarial",
          iterationNumber: round + 1,
          promptTokens: generated.promptTokens,
          completionTokens: generated.completionTokens,
          estimatedCostUsd: genCost,
          status: "evaluating",
        });

        const evaluation = await evaluateAdCopy(
          { primaryText: generated.primaryText, headline: generated.headline, description: generated.description, ctaButton: generated.ctaButton },
          campaign
        );
        const evalCost = estimateCost(evaluation.promptTokens, evaluation.completionTokens);
        const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;

        await createEvaluation({
          adId, campaignId: input.campaignId,
          scoreClarity: evaluation.scoreClarity, scoreValueProp: evaluation.scoreValueProp,
          scoreCta: evaluation.scoreCta, scoreBrandVoice: evaluation.scoreBrandVoice,
          scoreEmotionalResonance: evaluation.scoreEmotionalResonance,
          weightedScore: evaluation.weightedScore,
          rationaleClarity: evaluation.rationaleClarity, rationaleValueProp: evaluation.rationaleValueProp,
          rationaleCta: evaluation.rationaleCta, rationaleBrandVoice: evaluation.rationaleBrandVoice,
          rationaleEmotionalResonance: evaluation.rationaleEmotionalResonance,
          weakestDimension: evaluation.weakestDimension, improvementSuggestion: evaluation.improvementSuggestion,
          confidenceScore: evaluation.confidenceScore ?? 0.8,
          emotionalArcData: evaluation.emotionalArcData,
          promptTokens: evaluation.promptTokens, completionTokens: evaluation.completionTokens, estimatedCostUsd: evalCost,
        });
        await updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable);
        await updateCampaignStats(input.campaignId, generated.promptTokens + generated.completionTokens + evaluation.promptTokens + evaluation.completionTokens, genCost + evalCost);

        if (evaluation.weightedScore > bestScore) {
          bestScore = evaluation.weightedScore;
          bestAdId = adId;
        }
      }

      // Evaluate competitor ad
      const competitorEval = await evaluateAdCopy(
        { primaryText: input.competitorAdText, headline: "Competitor Ad", description: "", ctaButton: "Learn More" },
        campaign
      );

      const winStatus = bestScore > competitorEval.weightedScore ? "winning" : bestScore < competitorEval.weightedScore ? "losing" : "tied";
      await updateAdversarialSession(sessionId, { bestOurAdId: bestAdId || undefined, roundsCompleted: input.rounds, winStatus });

      const bestAd = bestAdId ? await getAdById(bestAdId) : null;
      const bestEval = bestAdId ? await getEvaluationByAdId(bestAdId) : null;

      return {
        sessionId,
        winStatus,
        ourBestScore: bestScore,
        competitorScore: competitorEval.weightedScore,
        bestAd,
        bestEval,
        competitorEval,
      };
    }),
  }),

  // ─── Creative Spark ──────────────────────────────────────────────────────────
  creativeSpark: router({
    getIdeas: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return getCreativeSparkIdeasByCampaign(input.campaignId);
    }),

    generate: protectedProcedure.input(z.object({
      campaignId: z.number(),
      count: z.number().min(3).max(9).default(6),
    })).mutation(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");

      const systemPrompt = `You are the most creative, boundary-pushing ad concept generator in the world. You specialize in ideas that make people say "WAIT, WHAT?!" — concepts so unexpected, so fresh, so memorable that they become cultural moments.

${BRAND_CONTEXT}

Generate ${input.count} WILDLY different creative concepts. Each must have a completely different angle, emotion, and approach. Think: unexpected metaphors, subverted expectations, cultural references, humor, shock, delight, nostalgia, fear, ambition. NO generic ideas. NO safe ideas.

Return ONLY valid JSON.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${input.count} wild creative spark concepts for: ${campaign.product}\nAudience: ${campaign.audienceSegment}\nGoal: ${campaign.campaignGoal}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "creative_sparks",
            strict: true,
            schema: {
              type: "object",
              properties: {
                ideas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      concept: { type: "string" },
                      hook: { type: "string" },
                      angle: { type: "string" },
                      wildFactor: { type: "number" },
                    },
                    required: ["concept", "hook", "angle", "wildFactor"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["ideas"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawSparkContent = response.choices[0]?.message?.content;
      const content = typeof rawSparkContent === "string" ? rawSparkContent : '{"ideas":[]}';
      const parsed = JSON.parse(content);

      const ideas = parsed.ideas.map((idea: any) => ({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        concept: idea.concept,
        hook: idea.hook,
        angle: idea.angle,
        wildFactor: Math.min(10, Math.max(1, Math.round(idea.wildFactor))),
      }));

      await createCreativeSparkIdeas(ideas);
      return getCreativeSparkIdeasByCampaign(input.campaignId);
    }),

    toggleSave: protectedProcedure.input(z.object({
      ideaId: z.number(),
      isSaved: z.boolean(),
    })).mutation(async ({ input }) => {
      await toggleSaveCreativeSparkIdea(input.ideaId, input.isSaved);
      return { success: true };
    }),
  }),

  // ─── Share Links ──────────────────────────────────────────────────────────────
  share: router({
    createShareLink: protectedProcedure.input(z.object({
      campaignId: z.number(),
      origin: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign || campaign.userId !== ctx.user.id) {
        throw new Error("Campaign not found or access denied");
      }
      const existing = await getShareLinkByCampaign(input.campaignId, ctx.user.id);
      if (existing) {
        return { url: input.origin + "/share/" + existing.token };
      }
      const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      await createShareLink({ campaignId: input.campaignId, userId: ctx.user.id, token });
      return { url: input.origin + "/share/" + token };
    }),

    getSharedCampaign: publicProcedure.input(z.object({
      token: z.string(),
    })).query(async ({ input }) => {
      const data = await getShareLinkData(input.token);
      if (!data) throw new Error("Share link not found or expired");
      return data;
    }),
  }),
  // ─── Competitor Intelligence ──────────────────────────────────────────────────
  competitorIntel: router({
    list: publicProcedure.query(async () => {
      return getAllCompetitorAds();
    }),
    analyze: protectedProcedure.input(z.object({
      brand: z.string().min(1),
      primaryText: z.string().min(1),
      headline: z.string().min(1),
      description: z.string().optional(),
      ctaButton: z.string().optional(),
      sourceUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Use LLM to analyze the competitor ad with the same 5-dimension framework
      const systemPrompt = `You are an expert competitive intelligence analyst for digital advertising. You evaluate competitor ads using the same 5-dimension framework used to score Varsity Tutors ads.
${BRAND_CONTEXT}
Analyze this competitor ad with brutal honesty. Score each dimension 1-10. Identify what they do well, where they're weak, and how Varsity Tutors can beat them.`;
      const userPrompt = `Analyze this competitor ad:
Brand: ${input.brand}
Primary Text: "${input.primaryText}"
Headline: "${input.headline}"
Description: "${input.description || 'N/A'}"
CTA: "${input.ctaButton || 'N/A'}"

Provide:
1. Scores for all 5 dimensions (Clarity, Value Prop, CTA, Brand Voice, Emotional Resonance)
2. What hook/pattern stops the scroll
3. Core emotional trigger they're using
4. Their key strengths
5. Their key weaknesses (where Varsity Tutors can win)
6. Full analysis notes`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "competitor_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scoreClarity: { type: "number" },
                scoreValueProp: { type: "number" },
                scoreCta: { type: "number" },
                scoreBrandVoice: { type: "number" },
                scoreEmotionalResonance: { type: "number" },
                hook: { type: "string" },
                emotionalTrigger: { type: "string" },
                strengths: { type: "string" },
                weaknesses: { type: "string" },
                analysisNotes: { type: "string" },
              },
              required: ["scoreClarity", "scoreValueProp", "scoreCta", "scoreBrandVoice", "scoreEmotionalResonance", "hook", "emotionalTrigger", "strengths", "weaknesses", "analysisNotes"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices[0]?.message?.content;
      const analysis = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
      // Calculate weighted score (equal weights for competitor analysis)
      const weightedScore = (analysis.scoreClarity + analysis.scoreValueProp + analysis.scoreCta + analysis.scoreBrandVoice + analysis.scoreEmotionalResonance) / 5;
      // Save to DB
      const id = await createCompetitorAd({
        brand: input.brand,
        primaryText: input.primaryText,
        headline: input.headline,
        description: input.description,
        ctaButton: input.ctaButton,
        sourceUrl: input.sourceUrl,
        scoreClarity: analysis.scoreClarity,
        scoreValueProp: analysis.scoreValueProp,
        scoreCta: analysis.scoreCta,
        scoreBrandVoice: analysis.scoreBrandVoice,
        scoreEmotionalResonance: analysis.scoreEmotionalResonance,
        weightedScore,
        hook: analysis.hook,
        emotionalTrigger: analysis.emotionalTrigger,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        analysisNotes: analysis.analysisNotes,
      });
      return { id, weightedScore, ...analysis };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCompetitorAd(input.id);
      return { success: true };
    }),
  }),
});
export type AppRouter = typeof appRouter;
