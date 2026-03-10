# Autonomous Ad Engine — Next 3 Feature Prompts
# For Claude Code in Cursor (Agent Mode)
# Run each prompt independently in order. Each is fully self-contained.
# After each run: push to GitHub, then notify Manus to apply SQL migrations if any.

---

## PROMPT 1 — "How It Works" Section on Home Page
**Estimated time:** 10–15 min | **No backend changes** | **Pure UI**

---

### PASTE THIS INTO CURSOR AGENT:

You are working on the Autonomous Ad Engine project at the path:
`nerdy-autonomous-ad-engine/`

**Task:** Add a "How It Works" section to the Home page between the stats bar and the features grid.

**File to edit:** `client/src/pages/Home.tsx`

**Exact injection point:** Find this comment in the file:
```
{/* ── Features ── */}
<section className="relative z-10 px-8 pb-32 max-w-7xl mx-auto">
```
Insert the new "How It Works" section **immediately before** that line.

**Design system rules (match exactly):**
- Background: `rgba(4,14,30,0.6)` with `backdropFilter: "blur(20px)"` and `border: "1px solid rgba(34,211,238,0.1)"`
- Section label pill: `background: "rgba(34,211,238,0.06)"`, `border: "1px solid rgba(34,211,238,0.13)"`, text in `#22d3ee`, `font-mono`, `0.6rem`, `letterSpacing: "0.14em"`, `textTransform: "uppercase"`
- Heading: `font-display font-bold`, `color: "#f8fafc"`, `letterSpacing: "-0.02em"`, `fontSize: "clamp(1.6rem, 3vw, 2.2rem)"`
- Step numbers: large `font-mono` in `#22d3ee`, `fontSize: "3rem"`, `opacity: 0.15` (watermark style behind the step title)
- Step titles: `font-display font-semibold text-sm`, `color: "#f8fafc"`
- Step descriptions: `text-xs leading-relaxed`, `color: "rgba(148,163,184,0.6)"`
- Connector arrows between steps: `→` in `#22d3ee` at `opacity: 0.3`, hidden on mobile
- Framer Motion: `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ delay: 0.45 }}`
- Padding: `px-8 py-24` on the section, `max-w-7xl mx-auto`

**The 3 steps to render:**

```
Step 1 — Brief
Title: "Define Your Campaign"
Description: "Enter your product, audience, goal, and tone. The engine uses this brief as the foundation for every generation decision."
Icon: FileText (from lucide-react — already imported or add it)

Step 2 — Generate & Evaluate
Title: "AI Writes & Judges"
Description: "The pipeline generates ad copy, then an LLM-as-Judge scores it across 5 dimensions: Clarity, Value Prop, CTA, Brand Voice, and Emotional Resonance."
Icon: Brain (already imported)

Step 3 — Approve & Improve
Title: "Ratchet to Excellence"
Description: "Ads below the quality threshold trigger self-healing loops. The engine rewrites, re-evaluates, and only surfaces ads that pass. No human intervention required."
Icon: CheckCircle2 (already imported)
```

**Layout:** 3-column grid on desktop (`lg:grid-cols-3`), single column on mobile. Each step is a card with:
- Top: step number watermark (01, 02, 03) + icon side by side
- Middle: step title
- Bottom: description
- Between cards (desktop only): a centered `→` connector

**Imports already available in the file:** `Brain`, `CheckCircle2`, `ArrowRight`, `ChevronRight`, `Zap`, `Cpu` from `lucide-react`. Add `FileText` if not already imported.

**After making changes:**
1. Run `pnpm tsc --noEmit` — must show 0 errors
2. Confirm the section renders between the stats bar and the features grid
3. Do NOT modify any other sections of the file

---

## PROMPT 2 — High-Score Ad Owner Notification
**Estimated time:** 15–20 min | **Backend + minor UI** | **No SQL migration needed**

---

### PASTE THIS INTO CURSOR AGENT:

You are working on the Autonomous Ad Engine project at the path:
`nerdy-autonomous-ad-engine/`

**Task:** When any ad scores ≥ 9.0 (weighted score), automatically notify the project owner via the built-in notification system. Also add a small UI indicator on the ad card when the score is ≥ 9.0.

---

**PART 1 — Backend: Add notification to `generateAndEvaluate` in `server/routers.ts`**

The `notifyOwner` helper is already imported and available. Find this import at the top of `server/routers.ts`:
```ts
import { notifyOwner } from "./_core/notification";
```
If it's not there, add it.

Find the `generateAndEvaluate` procedure. After the evaluation is saved (after the `createEvaluation(...)` call), add this block:

```ts
// Notify owner if ad scores ≥ 9.0
if (evaluation.weightedScore >= 9.0) {
  await notifyOwner({
    title: `🏆 High-Score Ad: ${evaluation.weightedScore.toFixed(1)}/10`,
    content: `Campaign: ${campaign.name}\nScore: ${evaluation.weightedScore.toFixed(1)}/10\nHeadline: ${generated.headline}\nPrimary Text: ${generated.primaryText.slice(0, 120)}${generated.primaryText.length > 120 ? "..." : ""}\nIteration: ${iterationNumber}`,
  }).catch(() => {}); // Non-blocking — never fail the pipeline on notification error
}
```

Also add the same block inside the `bulkGenerate` procedure, after each individual ad's evaluation is saved. The `bulkGenerate` procedure runs `Promise.all` over 5 pipelines — add the notification inside each pipeline's `.then()` or after the `createEvaluation` call inside the map function.

**Important:** The notification must NEVER throw or block the pipeline. Always wrap in `.catch(() => {})`.

---

**PART 2 — Frontend: Add a "Elite Score" badge on ad cards in `client/src/pages/CampaignDetail.tsx`**

Find the `AdCard` component (or the section that renders individual ad cards). Locate where the weighted score is displayed — it will look something like:
```tsx
<span>{ad.evaluation?.weightedScore?.toFixed(1)}</span>
```
or similar.

After the score display, add this conditional badge:
```tsx
{ad.evaluation && ad.evaluation.weightedScore >= 9.0 && (
  <div
    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
    style={{
      background: "rgba(251,191,36,0.1)",
      border: "1px solid rgba(251,191,36,0.25)",
    }}
  >
    <span style={{ fontSize: "0.55rem", color: "#fbbf24", letterSpacing: "0.1em", fontFamily: "monospace" }}>
      ELITE
    </span>
  </div>
)}
```

Also add the same badge in the `BulkResultsPanel` (the panel that shows bulk generation results) — find where each result's score is displayed and add the same badge.

---

**PART 3 — Verification**

1. Run `pnpm tsc --noEmit` — must show 0 errors
2. Confirm the notification import is present in `server/routers.ts`
3. Confirm the `.catch(() => {})` wrapper is on every `notifyOwner` call
4. Confirm the ELITE badge renders conditionally only when score ≥ 9.0
5. Do NOT modify any other procedures or components

---

## PROMPT 3 — Share Button on CampaignDetail
**Estimated time:** 10–15 min | **Frontend only** | **Backend already built**

---

### PASTE THIS INTO CURSOR AGENT:

You are working on the Autonomous Ad Engine project at the path:
`nerdy-autonomous-ad-engine/`

**Task:** Add a "Share" button to the CampaignDetail page header that calls the existing `trpc.campaigns.createShareLink` procedure and copies the resulting URL to the clipboard.

**Context — what's already built:**
- `trpc.campaigns.createShareLink` procedure exists in `server/routers.ts`. It accepts `{ campaignId: number, origin: string }` and returns `{ url: string }`.
- `trpc.campaigns.getSharedCampaign` procedure exists (public, no auth required).
- The `SharePage` component exists at `client/src/pages/SharePage.tsx` and is registered at route `/share/:token` in `App.tsx`.
- The `campaign_share_links` table exists in the database.

**File to edit:** `client/src/pages/CampaignDetail.tsx`

---

**STEP 1 — Add the Share2 icon import**

Find the lucide-react import line at the top of `CampaignDetail.tsx`:
```ts
import { Zap, Brain, CheckCircle2, XCircle, Swords, Sparkles,
  BarChart3, ChevronDown, ChevronUp, Target, DollarSign, Award,
  SlidersHorizontal, Save, ArrowLeft, Copy, Check, Activity, Smartphone, Layers, Trophy
} from "lucide-react";
```
Add `Share2` to this import list.

---

**STEP 2 — Add the shareMutation**

Find where the other mutations are declared (look for `generateMutation`, `bulkMutation`, etc.). Add this mutation after them:

```ts
const shareMutation = trpc.campaigns.createShareLink.useMutation({
  onSuccess: (data) => {
    navigator.clipboard.writeText(data.url).then(() => {
      toast.success("Share link copied to clipboard!");
    }).catch(() => {
      toast.success(`Share link: ${data.url}`);
    });
  },
  onError: (err) => {
    toast.error(err.message || "Failed to create share link");
  },
});
```

---

**STEP 3 — Add the Share button to the header**

Find the header button group in the JSX. It currently looks like this:
```tsx
<div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
  <Link href={`/campaigns/${campaignId}/adversarial`}>
    <button className="btn-secondary flex items-center gap-1.5 text-xs">
      <Swords size={12} /> Adversarial
    </button>
  </Link>
  <Link href={`/campaigns/${campaignId}/spark`}>
    <button className="btn-secondary flex items-center gap-1.5 text-xs">
      <Sparkles size={12} /> Spark
    </button>
  </Link>
  <Link href={`/campaigns/${campaignId}/performance`}>
    <button className="btn-secondary flex items-center gap-1.5 text-xs">
      <BarChart3 size={12} /> Analytics
    </button>
  </Link>
</div>
```

Add the Share button **after** the Analytics button, inside the same `div`:

```tsx
<button
  className="btn-secondary flex items-center gap-1.5 text-xs"
  onClick={() => shareMutation.mutate({ campaignId, origin: window.location.origin })}
  disabled={shareMutation.isPending || !ads || ads.filter(a => a.status === "approved").length === 0}
  title={!ads || ads.filter(a => a.status === "approved").length === 0 ? "Approve at least one ad to share" : "Copy share link"}
>
  {shareMutation.isPending ? (
    <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "rgba(34,211,238,0.3)", borderTopColor: "#22d3ee" }} />
  ) : (
    <Share2 size={12} />
  )}
  Share
</button>
```

**Important:** The button is disabled unless there is at least one approved ad (`status === "approved"`). The `ads` array is already available in the component from the `trpc.ads.getByCampaign.useQuery` call.

---

**STEP 4 — Verification**

1. Run `pnpm tsc --noEmit` — must show 0 errors
2. Confirm `Share2` is in the lucide-react import
3. Confirm `shareMutation` uses `window.location.origin` (never a hardcoded domain)
4. Confirm the button is disabled when no approved ads exist
5. Confirm the button shows a spinner while pending
6. Do NOT modify the SharePage, App.tsx routes, or any backend files

---

## After Running All 3 Prompts

1. Run `pnpm tsc --noEmit` one final time — must show 0 errors
2. Run `pnpm test` — must show 17/17 passing (or more if new tests were added)
3. Push to GitHub: `git add -A && git commit -m "feat: how-it-works section, elite score notifications, share button" && git push origin main`
4. Notify Manus to pull, run tests, and save checkpoint

---
*Generated by Manus AI — Mar 10, 2026*
