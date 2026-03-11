import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // Ad brief fields
  audienceSegment: text("audienceSegment").notNull(),
  product: text("product").notNull(),
  campaignGoal: mysqlEnum("campaignGoal", ["awareness", "conversion", "retargeting"]).notNull(),
  tone: mysqlEnum("tone", ["empowering", "urgent", "friendly", "professional", "playful"]).notNull(),
  brandVoiceNotes: text("brandVoiceNotes"),
  // Dimension weights (0-100, sum = 100)
  weightClarity: int("weightClarity").default(20).notNull(),
  weightValueProp: int("weightValueProp").default(25).notNull(),
  weightCta: int("weightCta").default(20).notNull(),
  weightBrandVoice: int("weightBrandVoice").default(15).notNull(),
  weightEmotionalResonance: int("weightEmotionalResonance").default(20).notNull(),
  // Quality ratchet
  initialQualityThreshold: float("initialQualityThreshold").default(7.0).notNull(),
  currentQualityThreshold: float("currentQualityThreshold").default(7.0).notNull(),
  totalAdsGenerated: int("totalAdsGenerated").default(0).notNull(),
  totalTokensUsed: int("totalTokensUsed").default(0).notNull(),
  totalCostUsd: float("totalCostUsd").default(0).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── Generated Ads ────────────────────────────────────────────────────────────
export const ads = mysqlTable("ads", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  // Ad content
  primaryText: text("primaryText").notNull(),
  headline: varchar("headline", { length: 255 }).notNull(),
  description: text("description"),
  ctaButton: varchar("ctaButton", { length: 64 }).notNull(),
  imagePrompt: text("imagePrompt"),
  imageUrl: text("imageUrl"),
  // Generation metadata
  generationMode: mysqlEnum("generationMode", ["standard", "creative_spark", "adversarial", "self_healing"]).default("standard").notNull(),
  iterationNumber: int("iterationNumber").default(1).notNull(),
  parentAdId: int("parentAdId"),
  promptTokens: int("promptTokens").default(0).notNull(),
  completionTokens: int("completionTokens").default(0).notNull(),
  estimatedCostUsd: float("estimatedCostUsd").default(0).notNull(),
  // Aggregate quality score (cached from latest evaluation)
  qualityScore: float("qualityScore"),
  isPublishable: boolean("isPublishable").default(false).notNull(),
  status: mysqlEnum("status", ["generating", "evaluating", "approved", "rejected", "archived"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ad = typeof ads.$inferSelect;
export type InsertAd = typeof ads.$inferInsert;

// ─── Ad Evaluations ───────────────────────────────────────────────────────────
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  adId: int("adId").notNull(),
  campaignId: int("campaignId").notNull(),
  // Dimension scores (1-10)
  scoreClarity: float("scoreClarity").notNull(),
  scoreValueProp: float("scoreValueProp").notNull(),
  scoreCta: float("scoreCta").notNull(),
  scoreBrandVoice: float("scoreBrandVoice").notNull(),
  scoreEmotionalResonance: float("scoreEmotionalResonance").notNull(),
  // Weighted aggregate
  weightedScore: float("weightedScore").notNull(),
  // LLM rationale per dimension
  rationaleClarity: text("rationaleClarity"),
  rationaleValueProp: text("rationaleValueProp"),
  rationaleCta: text("rationaleCta"),
  rationaleBrandVoice: text("rationaleBrandVoice"),
  rationaleEmotionalResonance: text("rationaleEmotionalResonance"),
  // Weakest dimension for self-healing
  weakestDimension: varchar("weakestDimension", { length: 64 }),
  improvementSuggestion: text("improvementSuggestion"),
  // Emotional arc data (JSON array of sentiment points)
  emotionalArcData: json("emotionalArcData"),
  // Token usage for evaluation
  promptTokens: int("promptTokens").default(0).notNull(),
  completionTokens: int("completionTokens").default(0).notNull(),
  estimatedCostUsd: float("estimatedCostUsd").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

// ─── Iteration Log ────────────────────────────────────────────────────────────
export const iterationLogs = mysqlTable("iteration_logs", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  adId: int("adId").notNull(),
  parentAdId: int("parentAdId"),
  iterationNumber: int("iterationNumber").notNull(),
  triggerReason: text("triggerReason"),
  targetDimension: varchar("targetDimension", { length: 64 }),
  scoreBefore: float("scoreBefore"),
  scoreAfter: float("scoreAfter"),
  improvement: float("improvement"),
  strategyUsed: varchar("strategyUsed", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IterationLog = typeof iterationLogs.$inferSelect;

// ─── Adversarial Sessions ─────────────────────────────────────────────────────
export const adversarialSessions = mysqlTable("adversarial_sessions", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  competitorAdText: text("competitorAdText").notNull(),
  competitorSource: varchar("competitorSource", { length: 255 }),
  bestOurAdId: int("bestOurAdId"),
  roundsCompleted: int("roundsCompleted").default(0).notNull(),
  winStatus: mysqlEnum("winStatus", ["pending", "winning", "losing", "tied"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdversarialSession = typeof adversarialSessions.$inferSelect;

// ─── Creative Spark Ideas ─────────────────────────────────────────────────────
export const creativeSparkIdeas = mysqlTable("creative_spark_ideas", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  concept: text("concept").notNull(),
  hook: text("hook").notNull(),
  angle: varchar("angle", { length: 128 }),
  wildFactor: int("wildFactor").default(5).notNull(), // 1-10 scale
  isSaved: boolean("isSaved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreativeSparkIdea = typeof creativeSparkIdeas.$inferSelect;

// ─── Campaign Share Links ─────────────────────────────────────────────────────
export const campaignShareLinks = mysqlTable("campaign_share_links", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type CampaignShareLink = typeof campaignShareLinks.$inferSelect;
export type InsertCampaignShareLink = typeof campaignShareLinks.$inferInsert;
// ─── Competitor Ads (Meta Ad Library Intelligence) ───────────────────────────
export const competitorAds = mysqlTable("competitor_ads", {
  id: int("id").autoincrement().primaryKey(),
  brand: varchar("brand", { length: 128 }).notNull(),          // e.g. "Princeton Review"
  primaryText: text("primaryText").notNull(),
  headline: varchar("headline", { length: 256 }).notNull(),
  description: varchar("description", { length: 256 }),
  ctaButton: varchar("ctaButton", { length: 64 }),
  sourceUrl: varchar("sourceUrl", { length: 512 }),            // Meta Ad Library URL
  // LLM evaluation scores (same 5 dimensions as our ads)
  scoreClarity: float("scoreClarity"),
  scoreValueProp: float("scoreValueProp"),
  scoreCta: float("scoreCta"),
  scoreBrandVoice: float("scoreBrandVoice"),
  scoreEmotionalResonance: float("scoreEmotionalResonance"),
  weightedScore: float("weightedScore"),
  // Pattern analysis
  hook: text("hook"),                                          // What stops the scroll
  emotionalTrigger: varchar("emotionalTrigger", { length: 256 }), // Core emotional appeal
  weaknesses: text("weaknesses"),                              // Where we can beat them
  strengths: text("strengths"),                                // What they do well
  analysisNotes: text("analysisNotes"),                        // Full LLM analysis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CompetitorAd = typeof competitorAds.$inferSelect;
export type InsertCompetitorAd = typeof competitorAds.$inferInsert;
