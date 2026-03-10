# Cursor Agent Prompt — Feature 2: Bulk Generation Mode

> **Model:** Claude Sonnet 3.7 (Agent mode)
> **Estimated time:** 15–20 min
> **Complexity:** Medium

---

## Context (read before executing)

This is a React 19 + tRPC 11 + Drizzle ORM app. The stack is:
- Frontend: `client/src/` — React + Tailwind 4 + Framer Motion
- Backend: `server/routers.ts` — all tRPC procedures
- DB helpers: `server/db.ts`
- Design system: dark theme, `ops-card` class, `btn-primary`/`btn-secondary`, `section-label`, `font-mono` for labels, `font-display` for headings. Colors: teal `#22d3ee`, gold `#f59e0b`, green `#34d399`, red `#f87171`.

The existing single-ad generation pipeline is `ads.generateAndEvaluate` in `server/routers.ts`. It runs: generate → evaluate → self-heal loop → return best ad. Study this procedure thoroughly before writing the bulk version.

---

## What to Build

**Bulk Generation Mode**: Run 5 independent `generateAndEvaluate` pipelines in parallel using `Promise.all`, then surface the top-scoring ad as the winner.

---

## Backend: Add `ads.bulkGenerate` procedure to `server/routers.ts`

Add this new procedure inside the `ads` router (after `getCampaignAnalytics`):

```typescript
bulkGenerate: protectedProcedure.input(z.object({
  campaignId: z.number(),
  count: z.number().min(2).max(5).default(5),
  maxIterations: z.number().min(1).max(3).default(2),
})).mutation(async ({ ctx, input }) => {
  const campaign = await getCampaignById(input.campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Run `count` independent generate+evaluate pipelines in parallel
  const pipelines = Array.from({ length: input.count }, (_, i) =>
    // Reuse the same generateAdCopy + evaluateAdCopy helpers already in the file
    // Each pipeline: generate → evaluate → save ad → save evaluation → update status
    // Return: { adId, score, primaryText, headline, ctaButton }
  );

  const results = await Promise.all(pipelines);

  // Find winner (highest weightedScore)
  const winner = results.reduce((best, r) => r.score > best.score ? r : best, results[0]);

  // Mark winner as publishable if score >= threshold
  // Update campaign stats (sum all token costs)

  return {
    results,          // all 5 results with adId + score
    winnerId: winner.adId,
    winnerScore: winner.score,
    isPublishable: winner.score >= campaign.currentQualityThreshold,
  };
})
```

**Implementation rules:**
1. Each pipeline inside `Promise.all` must call `generateAdCopy(...)` and `evaluateAdCopy(...)` — these helpers already exist at the top of `server/routers.ts`. Do NOT rewrite them.
2. Each pipeline must call `createAd(...)`, `createEvaluation(...)`, `updateAdStatus(...)` from `server/db.ts` — same as the existing `generateAndEvaluate` procedure.
3. Pass `mode: "standard"` and `iterationNumber: 1` for all pipelines.
4. After `Promise.all`, call `updateCampaignStats(campaignId, totalTokens, totalCost)` once with the summed totals.
5. Apply the quality ratchet only on the winner score (same logic as `generateAndEvaluate`).
6. TypeScript must compile with 0 errors — run `pnpm tsc --noEmit` to verify.

---

## Frontend: Add Bulk Generate button to `client/src/pages/CampaignDetail.tsx`

### State additions (inside `CampaignDetail` component):
```typescript
const [isBulkGenerating, setIsBulkGenerating] = useState(false);
const [bulkResult, setBulkResult] = useState<{
  results: Array<{ adId: number; score: number }>;
  winnerId: number;
  winnerScore: number;
  isPublishable: boolean;
} | null>(null);
```

### Mutation:
```typescript
const bulkGenerateMutation = trpc.ads.bulkGenerate.useMutation({
  onMutate: () => { setIsBulkGenerating(true); setBulkResult(null); },
  onSuccess: (result) => {
    setIsBulkGenerating(false);
    setBulkResult(result);
    refetchAds();
    refetchAnalytics();
    toast.success(`Bulk complete. Winner: ${result.winnerScore.toFixed(1)}/10`);
  },
  onError: (err) => { setIsBulkGenerating(false); toast.error(err.message); },
});
```

### UI changes in the Generation Engine card:

Replace the existing two-button row:
```tsx
// BEFORE (two buttons):
<button onClick={() => handleGenerate("standard")} ...>Generate Ad</button>
<button onClick={() => handleGenerate("creative_spark")} ...>Creative Mode</button>

// AFTER (three buttons, same row, flex-wrap):
<button onClick={() => handleGenerate("standard")} ...>
  <Zap size={13} /> Generate Ad
</button>
<button onClick={() => handleGenerate("creative_spark")} ...>
  <Sparkles size={13} /> Creative Mode
</button>
<button
  onClick={() => bulkGenerateMutation.mutate({ campaignId, count: 5, maxIterations: 2 })}
  disabled={isBulkGenerating || isGenerating}
  className="btn-secondary flex-1 min-w-[140px] flex items-center justify-center gap-2"
  style={{ borderColor: "rgba(245,158,11,0.25)", color: "#f59e0b" }}
>
  {isBulkGenerating
    ? <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
        style={{ borderColor: "rgba(245,158,11,0.2)", borderTopColor: "#f59e0b" }} /> Running 5 Pipelines...</>
    : <><Layers size={13} /> Bulk × 5</>
  }
</button>
```

Add `Layers` to the lucide-react import at the top of the file.

### Bulk result panel (add after the Generation Engine card):
```tsx
{bulkResult && (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="ops-card p-6">
    <div className="flex items-center gap-3 mb-4">
      <Layers size={14} style={{ color: "#f59e0b" }} />
      <div className="section-label">Bulk Generation Results</div>
      <span className={`tag-ops ${bulkResult.isPublishable ? "tag-green" : "tag-red"}`}>
        {bulkResult.isPublishable ? "Winner Approved" : "Below Threshold"}
      </span>
    </div>
    <div className="grid grid-cols-5 gap-2 mb-4">
      {bulkResult.results.map((r, i) => (
        <div key={r.adId}
          className="ops-card p-3 text-center"
          style={{
            borderColor: r.adId === bulkResult.winnerId ? "rgba(245,158,11,0.35)" : undefined,
            background: r.adId === bulkResult.winnerId ? "rgba(245,158,11,0.05)" : undefined,
          }}>
          <div className="font-mono text-[9px] mb-1" style={{ color: "rgba(100,116,139,0.5)" }}>
            {r.adId === bulkResult.winnerId ? "★ WINNER" : `Ad ${i + 1}`}
          </div>
          <div className="font-display font-bold text-lg"
            style={{ color: r.adId === bulkResult.winnerId ? "#f59e0b" : "#f8fafc", letterSpacing: "-0.03em" }}>
            {r.score.toFixed(1)}
          </div>
        </div>
      ))}
    </div>
    <p className="font-mono text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>
      5 independent pipelines ran in parallel. Winner Ad #{bulkResult.winnerId} scored {bulkResult.winnerScore.toFixed(1)}/10.
    </p>
  </motion.div>
)}
```

---

## Verification checklist

After implementation, verify:
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm test` → 17/17 passing
- [ ] Clicking "Bulk × 5" shows a loading spinner and "Running 5 Pipelines..." text
- [ ] After completion, the result panel shows 5 score tiles with the winner highlighted in gold
- [ ] All 5 ads appear in the Generated Ads list below
- [ ] No TypeScript `any` warnings on the new procedure return type

---

## Files to modify
1. `server/routers.ts` — add `bulkGenerate` procedure inside `ads` router
2. `client/src/pages/CampaignDetail.tsx` — add state, mutation, button, result panel

Do NOT modify any other files.
