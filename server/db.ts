import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  campaigns, InsertCampaign, Campaign,
  ads, InsertAd, Ad,
  evaluations, InsertEvaluation,
  iterationLogs,
  adversarialSessions,
  creativeSparkIdeas,
  campaignShareLinks, InsertCampaignShareLink,
  competitorAds, InsertCompetitorAd, CompetitorAd,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export async function createCampaign(data: InsertCampaign): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(data);
  return (result[0] as any).insertId as number;
}

export async function getCampaignsByUser(userId: number): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number): Promise<Campaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0];
}

export async function updateCampaignWeights(
  campaignId: number,
  weights: { weightClarity: number; weightValueProp: number; weightCta: number; weightBrandVoice: number; weightEmotionalResonance: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set(weights).where(eq(campaigns.id, campaignId));
}

export async function updateCampaignStats(campaignId: number, tokensUsed: number, costUsd: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set({
    totalAdsGenerated: sql`totalAdsGenerated + 1`,
    totalTokensUsed: sql`totalTokensUsed + ${tokensUsed}`,
    totalCostUsd: sql`totalCostUsd + ${costUsd}`,
  }).where(eq(campaigns.id, campaignId));
}

export async function ratchetQualityThreshold(campaignId: number, newThreshold: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set({ currentQualityThreshold: newThreshold }).where(eq(campaigns.id, campaignId));
}

export async function updateCampaignAutopilot(
  campaignId: number,
  data: { autopilotEnabled?: boolean; autopilotFrequencyHours?: number; autopilotLastRunAt?: Date; autopilotTotalRuns?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set(data).where(eq(campaigns.id, campaignId));
}

export async function getAutopilotEnabledCampaigns(): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.autopilotEnabled, true));
}

// ─── Ads ──────────────────────────────────────────────────────────────────────
export async function createAd(data: InsertAd): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ads).values(data);
  return (result[0] as any).insertId as number;
}

export async function getAdById(id: number): Promise<Ad | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
  return result[0];
}

export async function getAdsByCampaign(campaignId: number): Promise<Ad[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ads).where(eq(ads.campaignId, campaignId)).orderBy(desc(ads.createdAt));
}

export async function updateAdStatus(adId: number, status: Ad["status"], qualityScore?: number, isPublishable?: boolean) {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<Ad> = { status };
  if (qualityScore !== undefined) updateData.qualityScore = qualityScore;
  if (isPublishable !== undefined) updateData.isPublishable = isPublishable;
  await db.update(ads).set(updateData).where(eq(ads.id, adId));
}

export async function updateAdFields(
  adId: number,
  fields: Partial<Pick<Ad, "headline" | "primaryText" | "ctaButton" | "description">>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(ads).set(fields).where(eq(ads.id, adId));
}

// ─── Evaluations ──────────────────────────────────────────────────────────────
export async function createEvaluation(data: InsertEvaluation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evaluations).values(data);
  return (result[0] as any).insertId as number;
}

export async function getEvaluationByAdId(adId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluations).where(eq(evaluations.adId, adId)).orderBy(desc(evaluations.createdAt)).limit(1);
  return result[0];
}

export async function updateLatestEvaluationByAdId(
  adId: number,
  data: Partial<typeof evaluations.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  const latest = await db.select({ id: evaluations.id })
    .from(evaluations)
    .where(eq(evaluations.adId, adId))
    .orderBy(desc(evaluations.createdAt))
    .limit(1);
  if (!latest[0]) return;
  await db.update(evaluations).set(data).where(eq(evaluations.id, latest[0].id));
}

export async function getEvaluationsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluations).where(eq(evaluations.campaignId, campaignId)).orderBy(evaluations.createdAt);
}

// ─── Iteration Logs ───────────────────────────────────────────────────────────
export async function createIterationLog(data: typeof iterationLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(iterationLogs).values(data);
}

export async function getIterationLogsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(iterationLogs).where(eq(iterationLogs.campaignId, campaignId)).orderBy(iterationLogs.createdAt);
}

// ─── Adversarial Sessions ─────────────────────────────────────────────────────
export async function createAdversarialSession(data: typeof adversarialSessions.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(adversarialSessions).values(data);
  return (result[0] as any).insertId as number;
}

export async function getAdversarialSessionsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adversarialSessions).where(eq(adversarialSessions.campaignId, campaignId)).orderBy(desc(adversarialSessions.createdAt));
}

export async function updateAdversarialSession(sessionId: number, data: Partial<typeof adversarialSessions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(adversarialSessions).set(data).where(eq(adversarialSessions.id, sessionId));
}

// ─── Creative Spark Ideas ─────────────────────────────────────────────────────
export async function createCreativeSparkIdeas(ideas: (typeof creativeSparkIdeas.$inferInsert)[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(creativeSparkIdeas).values(ideas);
}

export async function getCreativeSparkIdeasByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creativeSparkIdeas).where(eq(creativeSparkIdeas.campaignId, campaignId)).orderBy(desc(creativeSparkIdeas.createdAt));
}

export async function toggleSaveCreativeSparkIdea(ideaId: number, isSaved: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(creativeSparkIdeas).set({ isSaved }).where(eq(creativeSparkIdeas.id, ideaId));
}

// ─── Campaign Share Links ─────────────────────────────────────────────────────
export async function createShareLink(data: InsertCampaignShareLink): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(campaignShareLinks).values(data);
  return data.token;
}

export async function getShareLinkByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaignShareLinks).where(eq(campaignShareLinks.token, token)).limit(1);
  return result[0];
}

export async function getShareLinkByCampaign(campaignId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaignShareLinks)
    .where(and(eq(campaignShareLinks.campaignId, campaignId), eq(campaignShareLinks.userId, userId)))
    .orderBy(desc(campaignShareLinks.createdAt)).limit(1);
  return result[0];
}

export async function getShareLinkData(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const link = await getShareLinkByToken(token);
  if (!link) return undefined;
  const campaign = await getCampaignById(link.campaignId);
  if (!campaign) return undefined;
  const allAds = await getAdsByCampaign(link.campaignId);
  const approvedAds = allAds.filter(a => a.status === 'approved');
  const bestAd = approvedAds.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))[0];
  const bestEval = bestAd ? await getEvaluationByAdId(bestAd.id) : undefined;
  return { campaign, approvedAds, bestAd, bestEval };
}

// ─── Competitor Ads ───────────────────────────────────────────────────────────
export async function createCompetitorAd(data: InsertCompetitorAd): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(competitorAds).values(data);
  return (result as any).insertId;
}

export async function getAllCompetitorAds(): Promise<CompetitorAd[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitorAds).orderBy(desc(competitorAds.weightedScore));
}

export async function getCompetitorAdsByBrand(brand: string): Promise<CompetitorAd[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitorAds).where(eq(competitorAds.brand, brand));
}

export async function deleteCompetitorAd(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(competitorAds).where(eq(competitorAds.id, id));
}
