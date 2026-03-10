# Autonomous Ad Engine — Claude/Cursor Agent Prompts

Each prompt below is fully self-contained. Paste it directly into Cursor's Claude Agent chat (or Claude Code CLI) and let it run. No additional context needed.

---

## PROMPT 1 — Fix Card Background Rendering (CSS)

> **Use model:** Claude Sonnet (fast, CSS/UI fix)
> **Estimated time:** 5 min

```
You are working on the Autonomous Ad Engine project at the root of this workspace.

PROBLEM
The `.ops-card` CSS class is defined in `client/src/index.css` inside `@layer components` with `background-color: rgb(6,20,46)`. However, card backgrounds are not rendering visibly in the browser — cards appear transparent against the dark space background.

ROOT CAUSE HYPOTHESIS
The `overflow: hidden` on `.ops-card` combined with the `::after` pseudo-element and the `position: relative` may be interacting poorly with Tailwind v4's layer cascade. Additionally, `backdrop-filter` on sibling/parent elements can cause stacking context issues that make `background-color` appear transparent.

WHAT YOU MUST DO

1. Open `client/src/index.css`. Find the `.ops-card` block (around line 529). Replace the entire `.ops-card` rule with this exact CSS:

```css
.ops-card {
  background: #06142e !important;
  border: 1px solid rgba(34,211,238,0.18);
  border-radius: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(34,211,238,0.07);
}
```

Key changes: use hex color (not rgba), use `background` shorthand with `!important` to override any cascade conflict, remove `overflow: hidden` (it was clipping the background in some stacking contexts), remove `backdrop-filter` (it was creating a new stacking context that conflicted with the fixed space background).

2. Also update `.stat-tile` (around line 578) to use the same approach:
```css
.stat-tile {
  padding: 1.25rem 1.5rem;
  background: #06142e !important;
  border: 1px solid rgba(34,211,238,0.20);
  border-radius: 10px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}
```

3. Update `.glass`, `.glass-dark`, `.glass-glow` the same way — replace `background-color: rgba(...)` with `background: #06142e !important`.

4. Open `client/src/pages/CampaignBuilder.tsx`. The three step content `motion.div` elements (step1, step2, step3) should already have `className="ops-card p-8 space-y-6"`. Verify this is the case. If any of them still have `className="space-y-6"` without `ops-card`, add it.

5. Run `pnpm tsc --noEmit` and confirm 0 errors.

6. Open the browser to `http://localhost:3000/campaigns/new` and verify the form card has a visible dark navy background (#06142e) that is clearly distinct from the space background.

DO NOT change any other CSS. DO NOT change any component files except CampaignBuilder.tsx step wrappers. DO NOT add new dependencies.
```

---

## PROMPT 2 — Bulk Generation Mode (5 Ads in Parallel)

> **Use model:** Claude Sonnet (backend + UI feature)
> **Estimated time:** 20–30 min

```
You are working on the Autonomous Ad Engine project at the root of this workspace.

CONTEXT — EXISTING ARCHITECTURE
- Stack: React 19 + Tailwind 4 + Express + tRPC 11 + MySQL (Drizzle ORM)
- All backend logic lives in `server/routers.ts` as tRPC procedures
- The existing single-ad generation procedure is `trpc.ads.generateAndEvaluate` with this input schema:
  ```ts
  z.object({
    campaignId: z.number(),
    mode: z.enum(["standard", "creative_spark", "adversarial"]).default("standard"),
    maxIterations: z.number().min(1).max(5).default(3),
    parentAdId: z.number().optional(),
    competitorAd: z.string().optional(),
  })
  ```
- It returns: `{ bestAdId, bestScore, totalIterations, results, isPublishable, qualityRatchetApplied }`
- The `generateAdCopy` and `evaluateAdCopy` helper functions already exist in `server/routers.ts`
- The `createAd`, `createEvaluation`, `updateAdStatus`, `updateCampaignStats` DB helpers are in `server/db.ts`
- The `getCampaignById` helper returns a campaign object with: `audienceSegment`, `product`, `campaignGoal`, `tone`, `brandVoiceNotes`, `currentQualityThreshold`
- The UI for single generation is in `client/src/pages/CampaignDetail.tsx`

FEATURE TO BUILD: Bulk Generation Mode

Add a "Generate × 5" button to the CampaignDetail page that runs 5 independent ad generation pipelines in parallel, then surfaces the single best-scoring ad with a visual comparison of all 5 results.

BACKEND — Add this tRPC procedure to `server/routers.ts` inside the `ads` router (after the existing `generateAndEvaluate` procedure):

```ts
bulkGenerate: protectedProcedure.input(z.object({
  campaignId: z.number(),
  count: z.number().min(2).max(5).default(5),
  mode: z.enum(["standard", "creative_spark", "adversarial"]).default("standard"),
})).mutation(async ({ ctx, input }) => {
  const campaign = await getCampaignById(input.campaignId);
  if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

  // Run `count` independent pipelines in parallel using Promise.all
  const pipelines = Array.from({ length: input.count }, async (_, i) => {
    // Each pipeline: generate 1 ad (no self-healing iterations, just 1 shot each)
    const generated = await generateAdCopy({
      audienceSegment: campaign.audienceSegment,
      product: campaign.product,
      campaignGoal: campaign.campaignGoal,
      tone: campaign.tone,
      brandVoiceNotes: campaign.brandVoiceNotes,
      mode: input.mode,
      iterationNumber: i + 1,
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
      generationMode: input.mode,
      iterationNumber: i + 1,
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
    return { adId, score: evaluation.weightedScore, isPublishable, primaryText: generated.primaryText, headline: generated.headline };
  });

  const results = await Promise.all(pipelines);
  const best = results.reduce((a, b) => a.score > b.score ? a : b);
  return { results, bestAdId: best.adId, bestScore: best.score, totalGenerated: input.count };
}),
```

FRONTEND — In `client/src/pages/CampaignDetail.tsx`:

1. Add a `useMutation` hook for `trpc.ads.bulkGenerate` near the existing `generateMutation`.

2. Add a `isBulkRunning` state (boolean) and a `bulkResults` state (array of `{ adId, score, primaryText, headline, isPublishable }`).

3. In the generation panel (the section with the "Generate Ad" button), add a second button immediately below it:
   - Label: `⚡ Generate × 5` (or use the Zap icon from lucide-react)
   - Style: use `btn-secondary` class with a teal border
   - Disabled when: `isBulkRunning || generateMutation.isPending`
   - On click: call `bulkGenerate.mutate({ campaignId, count: 5, mode: currentMode })` where `currentMode` is whatever mode is currently selected
   - While running: show a loading state with text "Running 5 pipelines..." and a spinner

4. When `bulkGenerate` succeeds, set `bulkResults` to the results array and show a results panel below the button:
   - Title: "Bulk Run Complete — 5 ads generated"
   - Show a mini score bar for each of the 5 ads (adId, score out of 10, approved/rejected badge)
   - Highlight the best-scoring ad with a gold border
   - Show total cost (sum of all 5 estimatedCostUsd values — fetch from the ads list which will auto-refresh)
   - A "View Best Ad" button that scrolls to that ad in the ads list below

5. After bulk generation completes, call `trpc.useUtils().ads.list.invalidate({ campaignId })` to refresh the ads list.

DESIGN RULES
- Match the existing dark navy + teal design system exactly
- Use the same `ops-card` class for any new card containers
- Use `section-label` class for section headers
- Use `btn-primary` and `btn-secondary` for buttons
- No new dependencies — use only what's already installed

VERIFICATION
- Run `pnpm tsc --noEmit` — must show 0 errors
- Manually test: create a campaign, click "Generate × 5", verify 5 ads appear in the list
- Verify the best-scoring ad is correctly identified and highlighted
```

---

## PROMPT 3 — CSV/PDF Export on PerformanceTracker

> **Use model:** Claude Sonnet (frontend utility feature)
> **Estimated time:** 15–20 min

```
You are working on the Autonomous Ad Engine project at the root of this workspace.

CONTEXT — EXISTING ARCHITECTURE
- Stack: React 19 + Tailwind 4 + Express + tRPC 11
- The PerformanceTracker page is at `client/src/pages/PerformanceTracker.tsx`
- It already has these data sources available as React state:
  - `campaign` — campaign object with: `name`, `campaignGoal`, `tone`, `currentQualityThreshold`
  - `analytics` — object with: `totalAds`, `approvedAds`, `avgScore`, `totalCostUsd`, `qualityTrend`, `avgScores`
  - `ads` — array of ad objects with: `id`, `primaryText`, `headline`, `description`, `ctaButton`, `status`, `qualityScore`, `estimatedCostUsd`, `generationMode`, `iterationNumber`, `createdAt`
  - `approvedAds` — filtered subset of `ads` where `status === "approved"`
- The page already imports `lucide-react` icons
- No PDF library is currently installed

FEATURE TO BUILD: Export Button (CSV + PDF)

Add an "Export" dropdown button to the PerformanceTracker page header that offers two options: "Export CSV" and "Export PDF Report".

PART A — CSV Export (client-side, no new dependencies)

Add a `handleExportCSV` function that:
1. Builds a CSV string from the `approvedAds` array with these columns:
   `Ad ID, Primary Text, Headline, CTA Button, Quality Score, Generation Mode, Iteration #, Est. Cost (USD), Created At`
2. Adds a header row with the campaign name and export date as the first line (as a comment row starting with `#`)
3. Creates a Blob with `type: "text/csv"`, creates an object URL, triggers a download with filename `{campaignName}-approved-ads-{date}.csv`
4. Cleans up the object URL after download

PART B — PDF Export (use the `jspdf` package)

Install `jspdf` and `jspdf-autotable`:
```bash
pnpm add jspdf jspdf-autotable
```

Add a `handleExportPDF` function that generates a professional PDF report:
1. Page header: "Autonomous Ad Engine — Performance Report" in large bold text, campaign name below it, export date, horizontal rule
2. Summary section: 4 KPI boxes in a row — Total Ads Generated, Approved Ads, Average Score, Total Cost
3. Approved Ads table with columns: `#`, `Headline`, `Primary Text (truncated to 60 chars)`, `Score`, `Mode`, `Cost`
4. Footer on each page: "Generated by Autonomous Ad Engine" + page number
5. Filename: `{campaignName}-report-{date}.pdf`

PART C — UI

In the PerformanceTracker page header (the `motion.div` with the back button and campaign name), add an "Export" button on the right side of the header row:
- Use a `DropdownMenu` from `@/components/ui/dropdown-menu` (shadcn/ui — already installed)
- Trigger button: label "Export" with a `Download` icon from lucide-react, styled with `btn-secondary` class
- Two menu items: "Export CSV" (calls `handleExportCSV`) and "Export PDF Report" (calls `handleExportPDF`)
- Disable both items when `!approvedAds.length` with a tooltip "No approved ads yet"

DESIGN RULES
- Match the existing dark navy + teal design system
- The dropdown should use the dark theme (the shadcn DropdownMenu already inherits CSS variables)
- No layout changes to the existing page — only add the button to the header row

VERIFICATION
- Run `pnpm tsc --noEmit` — must show 0 errors
- Test CSV: verify the downloaded file opens correctly in Excel/Numbers with proper columns
- Test PDF: verify the PDF has the correct layout and all approved ads are listed
- Test empty state: verify the export button is disabled when there are no approved ads
```

---

## PROMPT 4 — Shareable Campaign Link

> **Use model:** Claude Sonnet (full-stack feature)
> **Estimated time:** 25–35 min

```
You are working on the Autonomous Ad Engine project at the root of this workspace.

CONTEXT — EXISTING ARCHITECTURE
- Stack: React 19 + Tailwind 4 + Express + tRPC 11 + MySQL (Drizzle ORM)
- Schema file: `drizzle/schema.ts` — uses `mysqlTable` from `drizzle-orm/mysql-core`
- DB helpers: `server/db.ts` — uses `db` from `server/_core/db.ts`
- tRPC procedures: `server/routers.ts`
- Frontend routing: `wouter` (not React Router) — routes defined in `client/src/App.tsx`
- Auth: `protectedProcedure` requires login, `publicProcedure` does not

FEATURE TO BUILD: Read-Only Shareable Campaign Link

When a campaign has at least one approved ad, the owner can generate a shareable link. Anyone with the link (no login required) can view a read-only page showing: the campaign name, the best approved ad's copy, its score breakdown, and the total cost to generate it.

STEP 1 — Database Schema

Add a new table to `drizzle/schema.ts`:

```ts
export const campaignShareLinks = mysqlTable("campaign_share_links", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),  // null = never expires
});
export type CampaignShareLink = typeof campaignShareLinks.$inferSelect;
```

After adding the schema, run:
```bash
pnpm drizzle-kit generate
```
Then read the generated SQL file in `drizzle/migrations/` and apply it using the `webdev_execute_sql` tool (or paste the SQL into the database UI).

STEP 2 — DB Helpers

Add these functions to `server/db.ts`:

```ts
import { campaignShareLinks } from "../drizzle/schema";
import { randomBytes } from "crypto";

export async function createShareLink(campaignId: number, userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.insert(campaignShareLinks).values({ campaignId, userId, token });
  return token;
}

export async function getShareLinkData(token: string) {
  const [link] = await db.select().from(campaignShareLinks).where(eq(campaignShareLinks.token, token)).limit(1);
  if (!link) return null;
  const campaign = await getCampaignById(link.campaignId);
  if (!campaign) return null;
  const allAds = await getAdsByCampaign(link.campaignId);
  const approvedAds = allAds.filter(a => a.status === "approved");
  if (!approvedAds.length) return null;
  const bestAd = approvedAds.reduce((a, b) => (a.qualityScore || 0) > (b.qualityScore || 0) ? a : b);
  const bestAdFull = await getAdById(bestAd.id);
  return {
    campaignName: campaign.name,
    campaignGoal: campaign.campaignGoal,
    bestAd: bestAdFull,
    totalAdsGenerated: allAds.length,
    totalApproved: approvedAds.length,
    totalCostUsd: allAds.reduce((sum, a) => sum + (a.estimatedCostUsd || 0), 0),
  };
}
```

STEP 3 — tRPC Procedures

Add to `server/routers.ts` inside the `campaigns` router:

```ts
createShareLink: protectedProcedure.input(z.object({
  campaignId: z.number(),
})).mutation(async ({ ctx, input }) => {
  const campaign = await getCampaignById(input.campaignId);
  if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
  const token = await createShareLink(input.campaignId, ctx.user.id);
  return { token, url: `${input.origin}/share/${token}` };
}),

getSharedCampaign: publicProcedure.input(z.object({
  token: z.string(),
})).query(async ({ input }) => {
  const data = await getShareLinkData(input.token);
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found or expired" });
  return data;
}),
```

Note: `createShareLink` needs `origin` in its input. Update the input schema to include `origin: z.string()`. The frontend must pass `window.location.origin` as the `origin` value.

STEP 4 — Frontend: Share Button

In `client/src/pages/CampaignDetail.tsx`, add a "Share" button to the page header (near the campaign name):
- Icon: `Share2` from lucide-react
- Style: `btn-secondary` class
- On click: call `trpc.campaigns.createShareLink.useMutation()` with `{ campaignId, origin: window.location.origin }`
- On success: copy the returned `url` to clipboard using `navigator.clipboard.writeText(url)`, then show a toast: "Share link copied to clipboard!"
- Disable the button if there are no approved ads yet

STEP 5 — Frontend: Public Share Page

Create `client/src/pages/SharePage.tsx`:
- Route: `/share/:token` (add to `client/src/App.tsx`)
- No `AppLayout` wrapper — this is a standalone public page
- Call `trpc.campaigns.getSharedCampaign.useQuery({ token })` where `token` comes from `useParams()`
- Page layout:
  - Header: "Autonomous Ad Engine" logo text (teal, monospace) + "Powered by AI" badge
  - Campaign name as the page title
  - Best ad displayed in a clean card: Primary Text, Headline, Description, CTA Button
  - Score breakdown: 5 dimension scores as a horizontal bar chart (use recharts BarChart — already installed)
  - Stats row: Total Ads Generated, Approved Ads, Total Cost
  - Footer: "Generated autonomously — no human copywriters were harmed"
- Background: use the same `#020b18` dark background with the space background component
- If loading: show a centered spinner
- If error (token not found): show "This share link is invalid or has expired."

DESIGN RULES
- Match the existing dark navy + teal design system
- Use `ops-card` class for card containers
- Use `section-label` class for section headers
- The page must work without authentication — it is fully public
- Mobile responsive — the ad card and score bars must look good on a phone screen

VERIFICATION
- Run `pnpm tsc --noEmit` — must show 0 errors
- Run `pnpm drizzle-kit generate` and apply the migration
- Test: create a campaign, generate an approved ad, click Share, open the copied URL in an incognito window
- Verify the share page loads without login and shows the correct ad data
```

---

## How to Use These Prompts

| Prompt | Priority | Complexity | Do First |
|--------|----------|------------|----------|
| Prompt 1 — CSS Fix | Critical | Low | Yes — fix this before anything else |
| Prompt 2 — Bulk × 5 | High | Medium | After Prompt 1 |
| Prompt 3 — CSV/PDF Export | High | Low-Medium | Can run in parallel with Prompt 2 |
| Prompt 4 — Share Link | Medium | High | After Prompts 1 & 2 |

**Recommended workflow in Cursor:**
1. Open the project in Cursor
2. Paste Prompt 1 into Claude Agent → let it run → verify cards are visible
3. Paste Prompt 2 into Claude Agent → let it run → test bulk generation
4. Paste Prompt 3 into Claude Agent → let it run → test export
5. Paste Prompt 4 into Claude Agent → let it run → test share link
6. After all 4 are done, paste back here and I will review the output, fix any TypeScript errors, and save the checkpoint
