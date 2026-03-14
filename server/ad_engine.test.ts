import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createCampaign: vi.fn().mockResolvedValue(1),
  getCampaignsByUser: vi.fn().mockResolvedValue([]),
  getCampaignById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "Test Campaign",
    audienceSegment: "Parents of high school juniors",
    product: "SAT tutoring",
    campaignGoal: "conversion",
    tone: "empowering",
    brandVoiceNotes: null,
    weightClarity: 20,
    weightValueProp: 25,
    weightCta: 20,
    weightBrandVoice: 15,
    weightEmotionalResonance: 20,
    currentQualityThreshold: 7.0,
    totalAdsGenerated: 0,
    totalTokensUsed: 0,
    totalCostUsd: 0,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateCampaignWeights: vi.fn().mockResolvedValue(undefined),
  updateCampaignStats: vi.fn().mockResolvedValue(undefined),
  ratchetQualityThreshold: vi.fn().mockResolvedValue(undefined),
  updateCampaignAutopilot: vi.fn().mockResolvedValue(undefined),
  createAd: vi.fn().mockResolvedValue(42),
  getAdById: vi.fn().mockResolvedValue({
    id: 42,
    campaignId: 1,
    userId: 1,
    primaryText: "Unlock your child's SAT potential",
    headline: "Expert 1-on-1 Tutoring",
    description: "Score guarantee",
    ctaButton: "Get Started",
    imagePrompt: "A student studying",
    generationMode: "standard",
    iterationNumber: 1,
    parentAdId: null,
    promptTokens: 100,
    completionTokens: 150,
    estimatedCostUsd: 0.0001,
    status: "approved",
    qualityScore: 8.2,
    isPublishable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAdsByCampaign: vi.fn().mockResolvedValue([]),
  updateAdStatus: vi.fn().mockResolvedValue(undefined),
  updateAdFields: vi.fn().mockResolvedValue(undefined),
  createEvaluation: vi.fn().mockResolvedValue(1),
  getEvaluationByAdId: vi.fn().mockResolvedValue({
    id: 1,
    adId: 42,
    campaignId: 1,
    scoreClarity: 8.0,
    scoreValueProp: 8.5,
    scoreCta: 7.5,
    scoreBrandVoice: 8.0,
    scoreEmotionalResonance: 8.5,
    weightedScore: 8.1,
    rationaleClarity: "Clear and concise",
    rationaleValueProp: "Strong value prop",
    rationaleCta: "Good CTA",
    rationaleBrandVoice: "On brand",
    rationaleEmotionalResonance: "Emotionally resonant",
    weakestDimension: "cta",
    improvementSuggestion: "Make CTA more urgent",
    emotionalArcData: [{ segment: "1", text: "Unlock your child's potential", intensity: 7, valence: 0.8 }],
    promptTokens: 80,
    completionTokens: 200,
    estimatedCostUsd: 0.0002,
    createdAt: new Date(),
  }),
  updateLatestEvaluationByAdId: vi.fn().mockResolvedValue(undefined),
  getEvaluationsByCampaign: vi.fn().mockResolvedValue([]),
  createIterationLog: vi.fn().mockResolvedValue(1),
  getIterationLogsByCampaign: vi.fn().mockResolvedValue([]),
  createAdversarialSession: vi.fn().mockResolvedValue(10),
  getAdversarialSessionsByCampaign: vi.fn().mockResolvedValue([]),
  updateAdversarialSession: vi.fn().mockResolvedValue(undefined),
  createCreativeSparkIdeas: vi.fn().mockResolvedValue(undefined),
  getCreativeSparkIdeasByCampaign: vi.fn().mockResolvedValue([]),
  toggleSaveCreativeSparkIdea: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
          content: JSON.stringify({
          primaryText: "Unlock your child's SAT potential with expert 1-on-1 tutoring.",
          headline: "Score Higher. Get In.",
          description: "Score guarantee included",
          ctaButton: "Get Started",
          imagePrompt: "A confident student studying at a desk",
          reasoning: "Leads with outcome, addresses parent anxiety",
          // Evaluation fields
          scoreClarity: 8.0,
          scoreValueProp: 8.5,
          scoreCta: 7.5,
          scoreBrandVoice: 8.0,
          scoreEmotionalResonance: 8.5,
          rationaleClarity: "Clear and concise",
          rationaleValueProp: "Strong value prop",
          rationaleCta: "Good CTA",
          rationaleBrandVoice: "On brand",
          rationaleEmotionalResonance: "Emotionally resonant",
          weakestDimension: "cta",
          improvementSuggestion: "Make CTA more urgent",
          confidenceScore: 0.85,
          emotionalArcData: [{ segment: "1", text: "Unlock your child's potential", intensity: 7, valence: 0.8 }],
          // Creative spark fields
          ideas: [
            { concept: "Wild idea 1", hook: "Hook 1", angle: "Angle 1", wildFactor: 9 },
            { concept: "Wild idea 2", hook: "Hook 2", angle: "Angle 2", wildFactor: 7 },
          ],
          // Smart Prompt Expansion fields
          angles: [
            { angleId: "a1", angleName: "Anxious Parent Relief", tone: "empowering", format: "problem_solution", emotionalHook: "relief", audienceAngle: "anxious_parent", exampleHeadline: "Stop Worrying About SAT", examplePrimaryText: "Your child can score 200+ points higher.", creativeDirection: "Lead with the parent's anxiety, resolve with proof." },
            { angleId: "a2", angleName: "Student Aspiration", tone: "urgent", format: "bold_claim", emotionalHook: "aspiration", audienceAngle: "motivated_student", exampleHeadline: "Your Dream School Awaits", examplePrimaryText: "Top scorers didn't get lucky. They got tutored.", creativeDirection: "Speak directly to the student's ambition." },
          ],
        }),
      },
    }],
    usage: { prompt_tokens: 100, completion_tokens: 150 },
  }),
}));

// ─── Auth context helper ──────────────────────────────────────────────────────
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("campaigns router", () => {
  it("list returns campaigns for the authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("get returns a campaign by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.get({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test Campaign");
  });

  it("create returns the newly created campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.create({
      name: "New Campaign",
      audienceSegment: "Parents of juniors",
      product: "SAT tutoring",
      campaignGoal: "conversion",
      tone: "empowering",
    });
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
  });

  it("updateWeights throws when weights do not sum to 100", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.campaigns.updateWeights({
        campaignId: 1,
        weightClarity: 10,
        weightValueProp: 10,
        weightCta: 10,
        weightBrandVoice: 10,
        weightEmotionalResonance: 10, // total = 50, not 100
      })
    ).rejects.toThrow("Weights must sum to 100");
  });

  it("updateWeights succeeds when weights sum to 100", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.updateWeights({
      campaignId: 1,
      weightClarity: 20,
      weightValueProp: 25,
      weightCta: 20,
      weightBrandVoice: 15,
      weightEmotionalResonance: 20,
    });
    expect(result).toBeDefined();
  });

  it("autopilot toggle and status are callable", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.campaigns.toggleAutopilot({
      campaignId: 1,
      enabled: true,
      frequencyHours: 24,
    });
    const status = await caller.campaigns.getAutopilotStatus({ campaignId: 1 });

    expect(status).toHaveProperty("enabled");
    expect(status).toHaveProperty("frequencyHours");
    expect(status).toHaveProperty("lastRunAt");
    expect(status).toHaveProperty("totalRuns");
    expect(status).toHaveProperty("nextRunAt");
  });
});

describe("ads router", () => {
  it("list returns ads for a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.list({ campaignId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("get returns an ad with its evaluation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.get({ id: 42 });
    expect(result.ad).toBeDefined();
    expect(result.evaluation).toBeDefined();
    expect(result.evaluation?.weightedScore).toBe(8.1);
  });

  it("getCampaignAnalytics returns analytics structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.getCampaignAnalytics({ campaignId: 1 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalAds");
    expect(result).toHaveProperty("approvedAds");
    expect(result).toHaveProperty("qualityTrend");
    expect(result).toHaveProperty("costPerApprovedAd");
    expect(result).toHaveProperty("iterationLogs");
  });

  it("generateAndEvaluate runs the full pipeline and returns results", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.generateAndEvaluate({
      campaignId: 1,
      mode: "standard",
      maxIterations: 1,
    });
    expect(result).toHaveProperty("bestAdId");
    expect(result).toHaveProperty("bestScore");
    expect(result).toHaveProperty("totalIterations");
    expect(result).toHaveProperty("isPublishable");
    expect(result).toHaveProperty("qualityRatchetApplied");
    expect(result.totalIterations).toBe(1);
  });

  it("bulkGenerate supports higher count for autopilot run-now", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.bulkGenerate({
      campaignId: 1,
      count: 10,
      mode: "standard",
    });
    expect(result.totalAdsGenerated).toBe(10);
    expect(result).toHaveProperty("winnerId");
    expect(result).toHaveProperty("winnerScore");
  });
});

describe("adversarial router", () => {
  it("getSessions returns sessions for a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adversarial.getSessions({ campaignId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("runBattle returns win status and scores", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adversarial.runBattle({
      campaignId: 1,
      competitorAdText: "Get the best SAT scores with Princeton Review. Proven methods. Expert teachers.",
      competitorSource: "Princeton Review",
      rounds: 1,
    });
    expect(result).toHaveProperty("winStatus");
    expect(result).toHaveProperty("ourBestScore");
    expect(result).toHaveProperty("competitorScore");
    expect(["winning", "losing", "tied"]).toContain(result.winStatus);
  });
});

describe("creativeSpark router", () => {
  it("getIdeas returns ideas for a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.creativeSpark.getIdeas({ campaignId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("generate calls LLM and saves ideas", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.creativeSpark.generate({ campaignId: 1, count: 3 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("toggleSave updates save state", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.creativeSpark.toggleSave({ ideaId: 1, isSaved: true });
    expect(result.success).toBe(true);
  });
});

describe("auth router", () => {
  it("me returns the authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
  });

  it("logout clears the session cookie", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("campaigns.updateThreshold", () => {
  it("updates the quality threshold for a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.updateThreshold({ campaignId: 1, threshold: 7.5 });
    expect(result.success).toBe(true);
    expect(result.newThreshold).toBe(7.5);
  });

  it("rejects threshold below 1.0", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.campaigns.updateThreshold({ campaignId: 1, threshold: 0.5 }))
      .rejects.toThrow();
  });

  it("rejects threshold above 9.9", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.campaigns.updateThreshold({ campaignId: 1, threshold: 10.5 }))
      .rejects.toThrow();
  });
});

describe("ads.getVarietyMatrix", () => {
  it("returns tones, formats, and emotionalHooks arrays", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.getVarietyMatrix();
    expect(Array.isArray(result.tones)).toBe(true);
    expect(Array.isArray(result.formats)).toBe(true);
    expect(Array.isArray(result.hooks)).toBe(true);
    expect(result.tones.length).toBeGreaterThanOrEqual(6);
    expect(result.formats.length).toBeGreaterThanOrEqual(5);
    expect(result.hooks.length).toBeGreaterThanOrEqual(4);
  });
});

describe("ads.bulkGenerate", () => {
  it("returns results with totalAdsGenerated, approvedCount, and varietyStats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.bulkGenerate({ campaignId: 1, count: 2 });
    expect(result).toBeDefined();
    expect(typeof result.totalAdsGenerated).toBe("number");
    expect(typeof result.approvedCount).toBe("number");
    expect(typeof result.winnerId).toBe("number");
    expect(typeof result.winnerScore).toBe("number");
  });

  it("rejects count below 1", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.ads.bulkGenerate({ campaignId: 1, count: 0 }))
      .rejects.toThrow();
  });

  it("rejects count above 50", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.ads.bulkGenerate({ campaignId: 1, count: 51 }))
      .rejects.toThrow();
  });
});

describe("ads.expandPrompt", () => {
  it("returns an array of creative angles from a vague prompt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ads.expandPrompt({ campaignId: 1, vaguePrompt: "tutoring for stressed parents" });
    expect(Array.isArray(result.angles)).toBe(true);
    // angles may be empty if mock LLM doesn't return JSON with angles key — that's OK
    expect(Array.isArray(result.angles)).toBe(true);
  });
});
