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
} from "./db";

// ─── Cost estimation helpers ──────────────────────────────────────────────────
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;
function estimateCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens / 1000) * COST_PER_1K_INPUT + (completionTokens / 1000) * COST_PER_1K_OUTPUT;
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
      return getCampaignById(campaignId);
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
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new Error("Campaign not found");

      let bestAdId: number | null = null;
      let bestScore = 0;
      let iterationNumber = 1;
      const results: Array<{ adId: number; score: number; iteration: number }> = [];

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

        // Generate
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

        const genCost = estimateCost(generated.promptTokens, generated.completionTokens);

        // Save ad
        const adId = await createAd({
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
        });

        // Evaluate
        const evaluation = await evaluateAdCopy(
          { primaryText: generated.primaryText, headline: generated.headline, description: generated.description, ctaButton: generated.ctaButton },
          campaign
        );

        const evalCost = estimateCost(evaluation.promptTokens, evaluation.completionTokens);
        const isPublishable = evaluation.weightedScore >= campaign.currentQualityThreshold;

        // Save evaluation
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

        // Update ad status
        await updateAdStatus(adId, isPublishable ? "approved" : "rejected", evaluation.weightedScore, isPublishable);

        // Log iteration
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

        // Update campaign stats
        const totalTokens = generated.promptTokens + generated.completionTokens + evaluation.promptTokens + evaluation.completionTokens;
        await updateCampaignStats(input.campaignId, totalTokens, genCost + evalCost);

        results.push({ adId, score: evaluation.weightedScore, iteration: iterationNumber });

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

      return {
        bestAdId,
        bestScore,
        totalIterations: iterationNumber,
        results,
        isPublishable: bestScore >= campaign.currentQualityThreshold,
        qualityRatchetApplied: bestScore >= campaign.currentQualityThreshold + 1.5,
      };
    }),

    // Get full campaign analytics
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
});
export type AppRouter = typeof appRouter;
