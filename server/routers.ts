import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createCampaign, getCampaignsByUser, getCampaignById, updateCampaignWeights,
  updateCampaignStats, ratchetQualityThreshold, updateCampaignAutopilot,
  createAd, getAdById, getAdsByCampaign, updateAdStatus, updateAdFields,
  createEvaluation, getEvaluationByAdId, getEvaluationsByCampaign, updateLatestEvaluationByAdId,
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

function getPercentile(sortedValues: number[], percentile: number): number | null {
  if (sortedValues.length === 0) return null;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentile / 100) * sortedValues.length) - 1)
  );
  return sortedValues[index];
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
            "weakestDimension", "improvementSuggestion", "emotionalArcData",
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

type GenerateAndEvaluateInput = {
  campaignId: number;
  mode: "standard" | "creative_spark" | "adversarial" | "self_healing";
  competitorAd?: string;
  parentAdId?: number;
  maxIterations: number;
};

export type GenerationPipelineHooks = {
  onInit?: (payload: { message: string }) => Promise<void> | void;
  onPromptBuilt?: (payload: { message: string; tone: string; format: string; hook: string }) => Promise<void> | void;
  onGenerating?: (payload: { message: string }) => Promise<void> | void;
  onToken?: (payload: { token: string }) => Promise<void> | void;
  onCopyComplete?: (payload: { headline: string; primaryText: string; description: string; ctaButton: string }) => Promise<void> | void;
  onEvaluating?: (payload: { message: string }) => Promise<void> | void;
  onScoreUpdate?: (payload: { dimension: string; score: number }) => Promise<void> | void;
  onResult?: (payload: { score: number; status: "approved" | "rejected"; iterationCount: number }) => Promise<void> | void;
  onHealing?: (payload: { message: string; previousScore: number }) => Promise<void> | void;
  onComplete?: (payload: { adId: number | null; finalScore: number; totalMs: number }) => Promise<void> | void;
  shouldStop?: () => boolean;
};

function ensurePipelineOpen(hooks?: GenerationPipelineHooks) {
  if (hooks?.shouldStop?.()) {
    const error = new Error("Generation stream closed by client");
    (error as Error & { code?: string }).code = "STREAM_CLOSED";
    throw error;
  }
}

export async function runGenerateAndEvaluatePipeline(params: {
  userId: number;
  input: GenerateAndEvaluateInput;
  hooks?: GenerationPipelineHooks;
}) {
  const { userId, input, hooks } = params;
  const pipelineStart = Date.now();
  const campaign = await getCampaignById(input.campaignId);
  if (!campaign) throw new Error("Campaign not found");

  ensurePipelineOpen(hooks);
  await hooks?.onInit?.({ message: "Initializing generation pipeline..." });

  let bestAdId: number | null = null;
  let bestScore = 0;
  let iterationNumber = 1;
  const results: Array<{ adId: number; score: number; iteration: number }> = [];

  for (let i = 0; i < input.maxIterations; i++) {
    ensurePipelineOpen(hooks);
    iterationNumber = i + 1;

    let targetDimension: string | undefined;
    let improvementSuggestion: string | undefined;
    if (i > 0 && bestAdId) {
      const prevEval = await getEvaluationByAdId(bestAdId);
      targetDimension = prevEval?.weakestDimension || undefined;
      improvementSuggestion = prevEval?.improvementSuggestion || undefined;
    }

    await hooks?.onPromptBuilt?.({
      message: "Audience profile loaded. Building prompt...",
      tone: String(campaign.tone ?? "Urgent"),
      format: "Problem→Solution",
      hook: "Fear of Missing Out",
    });
    await hooks?.onGenerating?.({ message: "Generating ad copy..." });

    const startTime = Date.now();
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
    const generationMs = Date.now() - startTime;

    for (const token of generated.headline.split(/\s+/).filter(Boolean)) {
      ensurePipelineOpen(hooks);
      await hooks?.onToken?.({ token });
    }
    await hooks?.onCopyComplete?.({
      headline: generated.headline,
      primaryText: generated.primaryText,
      description: generated.description,
      ctaButton: generated.ctaButton,
    });

    const genCost = estimateCost(generated.promptTokens, generated.completionTokens);

    const adId = await createAd({
      campaignId: input.campaignId,
      userId,
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
      generationMs,
      estimatedCostUsd: genCost,
      status: "evaluating",
    });

    await hooks?.onEvaluating?.({ message: "LLM Judge evaluating quality..." });

    const evaluation = await evaluateAdCopy(
      { primaryText: generated.primaryText, headline: generated.headline, description: generated.description, ctaButton: generated.ctaButton },
      campaign
    );

    const evalCost = estimateCost(evaluation.promptTokens, evaluation.completionTokens);
    const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;

    for (const [dimension, score] of [
      ["Clarity", evaluation.scoreClarity],
      ["Value Prop", evaluation.scoreValueProp],
      ["CTA", evaluation.scoreCta],
      ["Brand Voice", evaluation.scoreBrandVoice],
      ["Emotional Resonance", evaluation.scoreEmotionalResonance],
    ] as const) {
      ensurePipelineOpen(hooks);
      await hooks?.onScoreUpdate?.({ dimension, score });
    }

    await createEvaluation({
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
      emotionalArcData: evaluation.emotionalArcData,
      promptTokens: evaluation.promptTokens,
      completionTokens: evaluation.completionTokens,
      estimatedCostUsd: evalCost,
    });

    await updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable);

    if (i > 0 && bestAdId) {
      await createIterationLog({
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
      });
    }

    const totalTokens = generated.promptTokens + generated.completionTokens + evaluation.promptTokens + evaluation.completionTokens;
    await updateCampaignStats(input.campaignId, totalTokens, genCost + evalCost);

    results.push({ adId, score: evaluation.weightedScore, iteration: iterationNumber });

    if (evaluation.weightedScore > bestScore) {
      bestScore = evaluation.weightedScore;
      bestAdId = adId;
    }

    const hasNextIteration = i < input.maxIterations - 1;
    if (isPublishable || !hasNextIteration) {
      await hooks?.onResult?.({
        score: evaluation.weightedScore,
        status: isPublishable ? "approved" : "rejected",
        iterationCount: iterationNumber,
      });
    } else {
      await hooks?.onHealing?.({
        message: `Score ${evaluation.weightedScore.toFixed(1)} below threshold ${campaign.currentQualityThreshold.toFixed(1)}. Running self-healing iteration ${iterationNumber + 1}...`,
        previousScore: evaluation.weightedScore,
      });
    }

    if (isPublishable) break;
  }

  if (bestScore >= campaign.currentQualityThreshold + 1.5) {
    const newThreshold = Math.min(campaign.currentQualityThreshold + 0.25, 9.5);
    await ratchetQualityThreshold(input.campaignId, newThreshold);
  }

  const output = {
    bestAdId,
    bestScore,
    totalIterations: iterationNumber,
    results,
    isPublishable: bestScore >= campaign.currentQualityThreshold,
    qualityRatchetApplied: bestScore >= campaign.currentQualityThreshold + 1.5,
  };

  await hooks?.onComplete?.({
    adId: bestAdId,
    finalScore: bestScore,
    totalMs: Date.now() - pipelineStart,
  });

  return output;
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
      initialQualityThreshold: z.number().min(5.0).max(9.0).default(7.0),
    })).mutation(async ({ ctx, input }) => {
      const id = await createCampaign({
        ...input,
        userId: ctx.user.id,
        currentQualityThreshold: input.initialQualityThreshold,
      });
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
      return getCampaignById(campaignId);
    }),

    toggleAutopilot: protectedProcedure.input(z.object({
      campaignId: z.number(),
      enabled: z.boolean(),
      frequencyHours: z.number().min(1).max(168).default(24).optional(),
    })).mutation(async ({ input }) => {
      await updateCampaignAutopilot(input.campaignId, {
        autopilotEnabled: input.enabled,
        ...(input.frequencyHours !== undefined && { autopilotFrequencyHours: input.frequencyHours }),
      });
      return getCampaignById(input.campaignId);
    }),

    getAutopilotStatus: protectedProcedure.input(z.object({
      campaignId: z.number(),
    })).query(async ({ input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");
      return {
        enabled: campaign.autopilotEnabled,
        frequencyHours: campaign.autopilotFrequencyHours,
        lastRunAt: campaign.autopilotLastRunAt,
        totalRuns: campaign.autopilotTotalRuns,
        nextRunAt: campaign.autopilotEnabled && campaign.autopilotLastRunAt
          ? new Date(campaign.autopilotLastRunAt.getTime() + campaign.autopilotFrequencyHours * 3600 * 1000)
          : null,
      };
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

    simulateABTest: protectedProcedure.input(z.object({
      adAId: z.number(),
      adBId: z.number(),
    })).mutation(async ({ input }) => {
      if (input.adAId === input.adBId) {
        throw new Error("Pick two different ads for A/B simulation");
      }

      const [adA, adB] = await Promise.all([
        getAdById(input.adAId),
        getAdById(input.adBId),
      ]);
      if (!adA || !adB) throw new Error("One or both ads not found");
      if (adA.campaignId !== adB.campaignId) {
        throw new Error("Ads must belong to the same campaign");
      }
      if (adA.status !== "approved" || adB.status !== "approved") {
        throw new Error("A/B simulation requires approved ads");
      }

      const [evalA, evalB] = await Promise.all([
        getEvaluationByAdId(adA.id),
        getEvaluationByAdId(adB.id),
      ]);
      if (!evalA || !evalB) throw new Error("Evaluation data missing for one or both ads");

      const ctrA = (
        (evalA.scoreCta * 0.4 + evalA.scoreValueProp * 0.3 + evalA.scoreEmotionalResonance * 0.3) /
        10
      ) * 0.032;
      const ctrB = (
        (evalB.scoreCta * 0.4 + evalB.scoreValueProp * 0.3 + evalB.scoreEmotionalResonance * 0.3) /
        10
      ) * 0.032;

      const conversionRateA = ((evalA.scoreClarity * 0.5 + evalA.scoreCta * 0.5) / 10) * 0.018;
      const conversionRateB = ((evalB.scoreClarity * 0.5 + evalB.scoreCta * 0.5) / 10) * 0.018;

      const estimatedCpcA = ctrA > 0 ? adA.estimatedCostUsd / ctrA : null;
      const estimatedCpcB = ctrB > 0 ? adB.estimatedCostUsd / ctrB : null;

      const compositeA = (
        evalA.scoreClarity +
        evalA.scoreValueProp +
        evalA.scoreCta +
        evalA.scoreBrandVoice +
        evalA.scoreEmotionalResonance
      ) / 5;
      const compositeB = (
        evalB.scoreClarity +
        evalB.scoreValueProp +
        evalB.scoreCta +
        evalB.scoreBrandVoice +
        evalB.scoreEmotionalResonance
      ) / 5;

      const scoreGap = Math.abs(compositeA - compositeB);
      const normalizedGap = Math.min(scoreGap / 10, 1);
      const confidencePct = Math.round((0.5 + normalizedGap * 0.45) * 100);

      const winner =
        Math.abs(ctrA - ctrB) < Number.EPSILON
          ? "tie"
          : ctrA > ctrB
            ? "A"
            : "B";

      const dimensions = [
        { key: "clarity", label: "Clarity", a: evalA.scoreClarity, b: evalB.scoreClarity },
        { key: "valueProp", label: "Value Prop", a: evalA.scoreValueProp, b: evalB.scoreValueProp },
        { key: "cta", label: "CTA", a: evalA.scoreCta, b: evalB.scoreCta },
        { key: "brandVoice", label: "Brand Voice", a: evalA.scoreBrandVoice, b: evalB.scoreBrandVoice },
        { key: "emotionalResonance", label: "Emotional Resonance", a: evalA.scoreEmotionalResonance, b: evalB.scoreEmotionalResonance },
      ].map((dim) => ({
        ...dim,
        gap: dim.a - dim.b,
        leader: Math.abs(dim.a - dim.b) < Number.EPSILON ? "tie" : dim.a > dim.b ? "A" : "B",
      }));

      return {
        adA: {
          id: adA.id,
          primaryText: adA.primaryText,
          headline: adA.headline,
          description: adA.description,
          ctaButton: adA.ctaButton,
          estimatedCostUsd: adA.estimatedCostUsd,
        },
        adB: {
          id: adB.id,
          primaryText: adB.primaryText,
          headline: adB.headline,
          description: adB.description,
          ctaButton: adB.ctaButton,
          estimatedCostUsd: adB.estimatedCostUsd,
        },
        metrics: {
          adA: { ctr: ctrA, conversionRate: conversionRateA, estimatedCpc: estimatedCpcA },
          adB: { ctr: ctrB, conversionRate: conversionRateB, estimatedCpc: estimatedCpcB },
        },
        winner: {
          label: winner,
          adId: winner === "A" ? adA.id : winner === "B" ? adB.id : null,
          confidencePct: winner === "tie" ? 50 : confidencePct,
          scoreGap,
        },
        dimensions,
      };
    }),

    explainScore: protectedProcedure.input(z.object({
      adId: z.number(),
    })).mutation(async ({ input }) => {
      const ad = await getAdById(input.adId);
      if (!ad) throw new Error("Ad not found");
      const evaluation = await getEvaluationByAdId(input.adId);
      if (!evaluation) throw new Error("Evaluation not found");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior advertising creative director and performance marketing expert. You evaluate ad copy with precision and give specific, actionable feedback. You cite exact words and phrases from the ad. You are direct, not diplomatic.",
          },
          {
            role: "user",
            content: `Explain this ad evaluation in detail and provide one specific rewrite.

AD COPY:
Headline: ${ad.headline}
Body: ${ad.primaryText}
Description: ${ad.description || ""}
CTA: ${ad.ctaButton}

SCORES:
Clarity: ${evaluation.scoreClarity}/10
Value Proposition: ${evaluation.scoreValueProp}/10
CTA Strength: ${evaluation.scoreCta}/10
Brand Voice: ${evaluation.scoreBrandVoice}/10
Emotional Resonance: ${evaluation.scoreEmotionalResonance}/10
Overall: ${evaluation.weightedScore}/10

Return JSON with this exact schema:
{
  "verdict": "string (1 sentence overall judgment, direct and specific)",
  "strengths": ["string (2-3 specific things that worked, cite exact words)"],
  "weaknesses": ["string (2-3 specific things that failed, cite exact words)"],
  "lowestDimension": "string (name of the lowest-scoring dimension)",
  "lowestDimensionExplanation": "string (2 sentences explaining exactly why it scored low)",
  "rewriteSuggestion": {
    "field": "headline | primaryText | ctaButton",
    "original": "string",
    "rewrite": "string",
    "expectedScoreGain": "number"
  }
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "score_explainer",
            strict: true,
            schema: {
              type: "object",
              properties: {
                verdict: { type: "string" },
                strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
                weaknesses: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
                lowestDimension: { type: "string" },
                lowestDimensionExplanation: { type: "string" },
                rewriteSuggestion: {
                  type: "object",
                  properties: {
                    field: { type: "string", enum: ["headline", "primaryText", "ctaButton"] },
                    original: { type: "string" },
                    rewrite: { type: "string" },
                    expectedScoreGain: { type: "number" },
                  },
                  required: ["field", "original", "rewrite", "expectedScoreGain"],
                  additionalProperties: false,
                },
              },
              required: [
                "verdict",
                "strengths",
                "weaknesses",
                "lowestDimension",
                "lowestDimensionExplanation",
                "rewriteSuggestion",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
      return {
        ...parsed,
        weightedScore: evaluation.weightedScore,
        confidenceScore: (evaluation as any).confidenceScore ?? null,
        improvementSuggestion: evaluation.improvementSuggestion ?? null,
      };
    }),

    applyRewrite: protectedProcedure.input(z.object({
      adId: z.number(),
      field: z.enum(["headline", "primaryText", "ctaButton"]),
      newValue: z.string().min(1),
    })).mutation(async ({ input }) => {
      const ad = await getAdById(input.adId);
      if (!ad) throw new Error("Ad not found");
      const campaign = await getCampaignById(ad.campaignId);
      if (!campaign) throw new Error("Campaign not found");
      const previousEvaluation = await getEvaluationByAdId(ad.id);
      if (!previousEvaluation) throw new Error("Evaluation not found");

      await updateAdFields(ad.id, { [input.field]: input.newValue } as Partial<typeof ad>);
      const updatedAd = await getAdById(ad.id);
      if (!updatedAd) throw new Error("Updated ad not found");

      const reevaluation = await evaluateAdCopy(
        {
          primaryText: updatedAd.primaryText,
          headline: updatedAd.headline,
          description: updatedAd.description || "",
          ctaButton: updatedAd.ctaButton,
        },
        campaign
      );
      const evalCost = estimateCost(reevaluation.promptTokens, reevaluation.completionTokens);

      await updateLatestEvaluationByAdId(ad.id, {
        scoreClarity: reevaluation.scoreClarity,
        scoreValueProp: reevaluation.scoreValueProp,
        scoreCta: reevaluation.scoreCta,
        scoreBrandVoice: reevaluation.scoreBrandVoice,
        scoreEmotionalResonance: reevaluation.scoreEmotionalResonance,
        weightedScore: reevaluation.weightedScore,
        rationaleClarity: reevaluation.rationaleClarity,
        rationaleValueProp: reevaluation.rationaleValueProp,
        rationaleCta: reevaluation.rationaleCta,
        rationaleBrandVoice: reevaluation.rationaleBrandVoice,
        rationaleEmotionalResonance: reevaluation.rationaleEmotionalResonance,
        weakestDimension: reevaluation.weakestDimension,
        improvementSuggestion: reevaluation.improvementSuggestion,
        emotionalArcData: reevaluation.emotionalArcData,
        promptTokens: reevaluation.promptTokens,
        completionTokens: reevaluation.completionTokens,
        estimatedCostUsd: evalCost,
      });

      const isPublishable = reevaluation.weightedScore >= campaign.currentQualityThreshold;
      await updateAdStatus(ad.id, isPublishable ? "approved" : "rejected", reevaluation.weightedScore, isPublishable);

      const oldScore = previousEvaluation.weightedScore;
      const newScore = reevaluation.weightedScore;
      return {
        oldScore,
        newScore,
        improvement: newScore - oldScore,
      };
    }),

    generateIntelligenceBrief: protectedProcedure.input(z.object({
      campaignId: z.number(),
    })).mutation(async ({ input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");

      const allAds = await getAdsByCampaign(input.campaignId);
      const approvedAds = allAds.filter((ad) => ad.status === "approved" && ad.isPublishable);
      if (approvedAds.length === 0) {
        throw new Error("No approved ads available for intelligence brief");
      }

      const evaluationsByAdId = new Map<number, Awaited<ReturnType<typeof getEvaluationByAdId>>>();
      await Promise.all(
        approvedAds.map(async (ad) => {
          const evaluation = await getEvaluationByAdId(ad.id);
          evaluationsByAdId.set(ad.id, evaluation);
        })
      );

      const inferFormat = (text: string) => {
        const value = text.toLowerCase();
        if (value.includes("?")) return "Question-led";
        if (value.includes("you") && value.includes("your")) return "Direct address";
        if (value.includes("because") || value.includes("so that")) return "Problem→Solution";
        if (value.includes("students") || value.includes("parents")) return "Audience-specific narrative";
        return "Benefit-led";
      };

      const inferEmotionalHook = (headline: string, primaryText: string) => {
        const value = `${headline} ${primaryText}`.toLowerCase();
        if (value.includes("score") || value.includes("admissions")) return "Achievement anxiety";
        if (value.includes("fall behind") || value.includes("miss")) return "Fear of missing out";
        if (value.includes("confidence") || value.includes("support")) return "Reassurance";
        if (value.includes("win") || value.includes("top")) return "Aspiration";
        return "Outcome certainty";
      };

      const inferTone = (text: string) => {
        const value = text.toLowerCase();
        if (value.includes("now") || value.includes("today") || value.includes("before")) return "urgent";
        if (value.includes("together") || value.includes("support")) return "friendly";
        if (value.includes("proven") || value.includes("strategy")) return "professional";
        if (value.includes("imagine") || value.includes("unlock")) return "empowering";
        return campaign.tone;
      };

      const rows = approvedAds
        .map((ad) => {
          const evaluation = evaluationsByAdId.get(ad.id);
          if (!evaluation) return null;
          return {
            adId: ad.id,
            headline: ad.headline,
            ctaButton: ad.ctaButton,
            score: evaluation.weightedScore,
            tone: inferTone(ad.primaryText),
            format: inferFormat(ad.primaryText),
            emotionalHook: inferEmotionalHook(ad.headline, ad.primaryText),
            dimensions: {
              clarity: evaluation.scoreClarity,
              valueProp: evaluation.scoreValueProp,
              cta: evaluation.scoreCta,
              brandVoice: evaluation.scoreBrandVoice,
              emotionalResonance: evaluation.scoreEmotionalResonance,
            },
          };
        })
        .filter((row): row is NonNullable<typeof row> => !!row)
        .sort((a, b) => b.score - a.score);

      if (rows.length === 0) {
        throw new Error("No evaluation data available for approved ads");
      }

      const top3 = rows.slice(0, 3).map((row) => ({
        tone: row.tone,
        format: row.format,
        emotionalHook: row.emotionalHook,
        headline: row.headline,
        score: Number(row.score.toFixed(2)),
      }));
      const bottom3 = [...rows].reverse().slice(0, 3).map((row) => ({
        tone: row.tone,
        format: row.format,
        emotionalHook: row.emotionalHook,
        headline: row.headline,
        score: Number(row.score.toFixed(2)),
      }));

      const groupAverage = (items: typeof rows, key: "tone" | "format") => {
        const totals = new Map<string, { sum: number; count: number }>();
        for (const item of items) {
          const label = item[key];
          const current = totals.get(label) || { sum: 0, count: 0 };
          current.sum += item.score;
          current.count += 1;
          totals.set(label, current);
        }
        return Array.from(totals.entries())
          .map(([label, value]) => ({
            label,
            avgScore: Number((value.sum / value.count).toFixed(2)),
          }))
          .sort((a, b) => b.avgScore - a.avgScore);
      };

      const avgScoreByTone = groupAverage(rows, "tone");
      const avgScoreByFormat = groupAverage(rows, "format");

      const topHalf = rows.slice(0, Math.max(1, Math.ceil(rows.length / 2)));
      const ctaCounts = new Map<string, number>();
      for (const item of topHalf) {
        ctaCounts.set(item.ctaButton, (ctaCounts.get(item.ctaButton) || 0) + 1);
      }
      const mostCommonWinningCtas = Array.from(ctaCounts.entries())
        .map(([cta, count]) => ({ cta, count }))
        .sort((a, b) => b.count - a.count);

      const dimensionAverages = {
        clarity: rows.reduce((sum, row) => sum + row.dimensions.clarity, 0) / rows.length,
        valueProp: rows.reduce((sum, row) => sum + row.dimensions.valueProp, 0) / rows.length,
        cta: rows.reduce((sum, row) => sum + row.dimensions.cta, 0) / rows.length,
        brandVoice: rows.reduce((sum, row) => sum + row.dimensions.brandVoice, 0) / rows.length,
        emotionalResonance: rows.reduce((sum, row) => sum + row.dimensions.emotionalResonance, 0) / rows.length,
      };
      const dimensionEntries = Object.entries(dimensionAverages).map(([dimension, score]) => ({
        dimension,
        avgScore: Number(score.toFixed(2)),
      })).sort((a, b) => b.avgScore - a.avgScore);

      const summary = {
        campaignId: input.campaignId,
        approvedAds: rows.length,
        avgScore: Number((rows.reduce((sum, row) => sum + row.score, 0) / rows.length).toFixed(2)),
        top3,
        bottom3,
        avgScoreByTone,
        avgScoreByFormat,
        mostCommonWinningCtas,
        dimensionBreakdown: {
          highest: dimensionEntries[0],
          lowest: dimensionEntries[dimensionEntries.length - 1],
          all: dimensionEntries,
        },
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior performance marketing strategist at a top agency. You analyze ad campaign data and write sharp, actionable strategic briefs. Be specific, cite the actual data, and give concrete recommendations. Write in a confident, direct tone. No fluff. Maximum 250 words.",
          },
          {
            role: "user",
            content: `Here is the performance data for this ad campaign:\n${JSON.stringify(summary, null, 2)}\n\nWrite a Campaign Intelligence Brief with exactly these sections:\n1. WHAT'S WORKING (2-3 sentences on patterns in top performers)\n2. WHAT'S FAILING (2-3 sentences on patterns in low performers)\n3. AUDIENCE INSIGHT (1-2 sentences on what this data reveals about the audience)\n4. TOP 3 RECOMMENDATIONS (numbered list, each one specific and actionable)\n5. PREDICTED NEXT BATCH SCORE (your prediction for average score if recommendations are followed)`,
          },
        ],
      });

      const rawBrief = response.choices[0]?.message?.content;
      const brief = (typeof rawBrief === "string" ? rawBrief : "").trim() || "Unable to generate intelligence brief.";
      return {
        brief,
        generatedAt: new Date(),
        topTone: avgScoreByTone[0]?.label || campaign.tone,
        topFormat: avgScoreByFormat[0]?.label || "Benefit-led",
        avgScore: summary.avgScore,
      };
    }),

    // Full generate + evaluate + self-heal pipeline
    generateAndEvaluate: protectedProcedure.input(z.object({
      campaignId: z.number(),
      mode: z.enum(["standard", "creative_spark", "adversarial", "self_healing"]).default("standard"),
      competitorAd: z.string().optional(),
      parentAdId: z.number().optional(),
      maxIterations: z.number().min(1).max(5).default(3),
    })).mutation(async ({ ctx, input }) => {
      return runGenerateAndEvaluatePipeline({
        userId: ctx.user.id,
        input,
      });
    }),

    // Get full campaign analytics
    // ─── Bulk × 5 Generation ────────────────────────────────────────────────
    bulkGenerate: protectedProcedure.input(z.object({
      campaignId: z.number(),
      count: z.number().min(2).max(10).default(5),
      mode: z.enum(["standard", "creative_spark"]).default("standard"),
    })).mutation(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");
      // Run `count` pipelines in parallel — each generates + evaluates independently
      const pipelines = Array.from({ length: input.count }, (_, idx) =>
        (async () => {
          const pipelineMode = idx === 0 ? input.mode : (idx === input.count - 1 ? "creative_spark" : input.mode);
          const generated = await generateAdCopy({
            audienceSegment: campaign.audienceSegment,
            product: campaign.product,
            campaignGoal: campaign.campaignGoal,
            tone: campaign.tone,
            brandVoiceNotes: campaign.brandVoiceNotes,
            mode: pipelineMode,
            iterationNumber: idx + 1,
          });
          const genCost = (generated.promptTokens * 0.000003) + (generated.completionTokens * 0.000015);
          const adId = await createAd({
            campaignId: input.campaignId,
            userId: ctx.user.id,
            primaryText: generated.primaryText,
            headline: generated.headline,
            description: generated.description,
            ctaButton: generated.ctaButton,
            imagePrompt: generated.imagePrompt,
            generationMode: pipelineMode as "standard" | "creative_spark" | "adversarial" | "self_healing",
            iterationNumber: idx + 1,
            promptTokens: generated.promptTokens,
            completionTokens: generated.completionTokens,
            estimatedCostUsd: genCost,
            status: "evaluating",
          });
          const evaluation = await evaluateAdCopy(
            { primaryText: generated.primaryText, headline: generated.headline, description: generated.description, ctaButton: generated.ctaButton },
            campaign
          );
          const evalCost = (evaluation.promptTokens * 0.000003) + (evaluation.completionTokens * 0.000015);
          const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;
          await createEvaluation({
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
            emotionalArcData: evaluation.emotionalArcData,
            promptTokens: evaluation.promptTokens,
            completionTokens: evaluation.completionTokens,
            estimatedCostUsd: evalCost,
          });
          await updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable);
          const totalTokens = generated.promptTokens + generated.completionTokens + evaluation.promptTokens + evaluation.completionTokens;
          await updateCampaignStats(input.campaignId, totalTokens, genCost + evalCost);
          return { adId, score: evaluation.weightedScore, isPublishable, mode: pipelineMode, totalCost: genCost + evalCost };
        })()
      );
      const results = await Promise.all(pipelines);
      // Sort by score descending — winner is index 0
      results.sort((a, b) => b.score - a.score);
      const winner = results[0];
      // Quality ratchet: if winner is well above threshold, raise the bar
      if (winner.score >= campaign.currentQualityThreshold + 1.5) {
        const newThreshold = Math.min(campaign.currentQualityThreshold + 0.25, 9.5);
        await ratchetQualityThreshold(input.campaignId, newThreshold);
      }
      return {
        results,
        winnerId: winner.adId,
        winnerScore: winner.score,
        totalAdsGenerated: results.length,
        approvedCount: results.filter(r => r.isPublishable).length,
        qualityRatchetApplied: winner.score >= campaign.currentQualityThreshold + 1.5,
      };
    }),
    getCampaignAnalytics: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      const [campaign, allAds, allEvaluations, iterationLogs] = await Promise.all([
        getCampaignById(input.campaignId),
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

      const generationTimes = allAds
        .map((ad) => ad.generationMs)
        .filter((value): value is number => typeof value === "number" && value >= 0)
        .sort((a, b) => a - b);

      const latencyHistogram = [
        { bucket: "0-1s", minMs: 0, maxMs: 1000 },
        { bucket: "1-1.5s", minMs: 1000, maxMs: 1500 },
        { bucket: "1.5-2s", minMs: 1500, maxMs: 2000 },
        { bucket: "2-2.5s", minMs: 2000, maxMs: 2500 },
        { bucket: "2.5-3s", minMs: 2500, maxMs: 3000 },
        { bucket: "3s+", minMs: 3000, maxMs: Number.POSITIVE_INFINITY },
      ].map((bucket) => ({
        bucket: bucket.bucket,
        count: generationTimes.filter((value) => value >= bucket.minMs && value < bucket.maxMs).length,
      }));

      return {
        campaign,
        totalAds: allAds.length,
        approvedAds,
        rejectedAds: allAds.filter(a => a.status === "rejected").length,
        qualityTrend,
        avgScores,
        totalCost,
        costPerApprovedAd,
        latency: {
          p50: getPercentile(generationTimes, 50),
          p95: getPercentile(generationTimes, 95),
          p99: getPercentile(generationTimes, 99),
          histogram: latencyHistogram,
          samples: generationTimes.length,
        },
        iterationLogs,
        currentThreshold: campaign?.currentQualityThreshold || 7.0,
      };
    }),

    // ─── Split by Audience ────────────────────────────────────────────────────
    splitByAudience: protectedProcedure.input(z.object({
      adId: z.number(),
      campaignId: z.number(),
    })).mutation(async ({ input }) => {
      const [sourceAd, campaign] = await Promise.all([
        getAdById(input.adId),
        getCampaignById(input.campaignId),
      ]);
      if (!sourceAd) throw new Error("Source ad not found");
      if (!campaign) throw new Error("Campaign not found");

      const PERSONAS = [
        { id: "anxious_parent",    name: "Anxious Parent",            description: "Driven by fear of their child falling behind, responds to urgency and reassurance" },
        { id: "budget_parent",     name: "Budget-Conscious Parent",   description: "Price-sensitive, needs ROI justification, responds to value framing" },
        { id: "high_achiever",     name: "High-Achieving Student",    description: "Competitive, goal-oriented, responds to achievement and ranking language" },
        { id: "skeptical_parent",  name: "Skeptical Parent",          description: "Tried tutoring before without results, needs proof and differentiation" },
        { id: "lastminute_parent", name: "Last-Minute Parent",        description: "Deadline pressure (SAT in 3 weeks), responds to speed and guaranteed results" },
      ] as const;

      const systemPrompt = `You are an expert direct-response copywriter. Rewrite the provided ad copy specifically for the target persona. Keep the same core offer and CTA intent. Change the language, emotional hooks, and framing to resonate with this specific person. Return JSON only.`;

      const variants = await Promise.all(
        PERSONAS.map(async (persona) => {
          const userPrompt = `TARGET PERSONA: ${persona.name}
Persona description: ${persona.description}

ORIGINAL AD:
Headline: "${sourceAd.headline}"
Primary text: "${sourceAd.primaryText}"
Description: "${sourceAd.description}"
CTA: "${sourceAd.ctaButton}"

Product: ${campaign.product}
Campaign goal: ${campaign.campaignGoal}

Rewrite this ad for the target persona. Keep the core offer but change language, hooks, and framing.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "audience_variant",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    headline:         { type: "string" },
                    primaryText:      { type: "string" },
                    description:      { type: "string" },
                    ctaButton:        { type: "string" },
                    personaRationale: { type: "string" },
                  },
                  required: ["headline", "primaryText", "description", "ctaButton", "personaRationale"],
                  additionalProperties: false,
                },
              },
            },
          });

          const raw = response.choices[0]?.message?.content;
          const copy = JSON.parse(typeof raw === "string" ? raw : "{}") as {
            headline: string; primaryText: string; description: string;
            ctaButton: string; personaRationale: string;
          };

          const evaluation = await evaluateAdCopy(
            { primaryText: copy.primaryText, headline: copy.headline, description: copy.description, ctaButton: copy.ctaButton },
            campaign
          );

          return {
            persona:          persona.name,
            personaId:        persona.id,
            headline:         copy.headline,
            primaryText:      copy.primaryText,
            description:      copy.description,
            ctaButton:        copy.ctaButton,
            personaRationale: copy.personaRationale,
            score:            evaluation.weightedScore,
            confidenceScore:  Math.round((evaluation.weightedScore / 10) * 100),
          };
        })
      );

      return variants.sort((a, b) => b.score - a.score);
    }),

    approveAudienceVariant: protectedProcedure.input(z.object({
      campaignId: z.number(),
      parentAdId: z.number(),
      headline:    z.string(),
      primaryText: z.string(),
      description: z.string(),
      ctaButton:   z.string(),
      persona:     z.string(),
    })).mutation(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");

      const evaluation = await evaluateAdCopy(
        { primaryText: input.primaryText, headline: input.headline, description: input.description, ctaButton: input.ctaButton },
        campaign
      );
      const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;
      const evalCost = estimateCost(evaluation.promptTokens, evaluation.completionTokens);

      const adId = await createAd({
        campaignId:      input.campaignId,
        userId:          ctx.user.id,
        primaryText:     input.primaryText,
        headline:        input.headline,
        description:     input.description,
        ctaButton:       input.ctaButton,
        imagePrompt:     "",
        generationMode:  "standard",
        iterationNumber: 1,
        parentAdId:      input.parentAdId,
        promptTokens:    0,
        completionTokens: evaluation.completionTokens,
        generationMs:    0,
        estimatedCostUsd: evalCost,
        status:          isPublishable ? "approved" : "rejected",
      });

      await createEvaluation({
        adId,
        campaignId:                input.campaignId,
        scoreClarity:              evaluation.scoreClarity,
        scoreValueProp:            evaluation.scoreValueProp,
        scoreCta:                  evaluation.scoreCta,
        scoreBrandVoice:           evaluation.scoreBrandVoice,
        scoreEmotionalResonance:   evaluation.scoreEmotionalResonance,
        weightedScore:             evaluation.weightedScore,
        rationaleClarity:          evaluation.rationaleClarity,
        rationaleValueProp:        evaluation.rationaleValueProp,
        rationaleCta:              evaluation.rationaleCta,
        rationaleBrandVoice:       evaluation.rationaleBrandVoice,
        rationaleEmotionalResonance: evaluation.rationaleEmotionalResonance,
        weakestDimension:          evaluation.weakestDimension,
        improvementSuggestion:     evaluation.improvementSuggestion,
        emotionalArcData:          evaluation.emotionalArcData,
        promptTokens:              evaluation.promptTokens,
        completionTokens:          evaluation.completionTokens,
        estimatedCostUsd:          evalCost,
      });

      await updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable);
      await updateCampaignStats(input.campaignId, evaluation.promptTokens + evaluation.completionTokens, evalCost);

      return { adId, score: evaluation.weightedScore, isPublishable };
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
