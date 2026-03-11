/**
 * seed-demo.mjs
 * Generates 55 real ads across 3 Varsity Tutors audience segments.
 * Calls the tRPC router directly so all generation, evaluation,
 * iteration logs, and cost tracking are real data.
 *
 * Usage: node --loader ts-node/esm seed-demo.mjs
 *    or: npx tsx seed-demo.mjs
 */

import "dotenv/config";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use tsx to run this — it handles TS imports
const { appRouter } = await import("./server/routers.ts");

// ─── Owner user context ───────────────────────────────────────────────────────
const OWNER_USER = {
  id: 1,
  openId: process.env.OWNER_OPEN_ID || "owner",
  name: "Sam Kos",
  email: "sam@example.com",
  avatarUrl: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeCtx() {
  return {
    user: OWNER_USER,
    req: { headers: {} },
    res: { setHeader: () => {}, clearCookie: () => {} },
  };
}

// ─── Campaign definitions ─────────────────────────────────────────────────────
const CAMPAIGNS = [
  {
    name: "SAT Prep — Anxious Parents (Awareness)",
    audienceSegment:
      "Parents of high school juniors and seniors who are anxious about college admissions and worried their child's SAT score isn't competitive enough for top universities",
    product:
      "Varsity Tutors 1-on-1 SAT prep — personalized online tutoring with expert tutors, flexible scheduling, and a proven track record of score improvement",
    campaignGoal: "awareness",
    tone: "empowering",
    brandVoiceNotes:
      "Lead with the parent's fear of their child falling behind. Transition to hope and empowerment. End with a specific outcome. Avoid generic 'best tutors' language.",
    adsToGenerate: 20,
  },
  {
    name: "SAT Prep — Students Ready to Improve (Conversion)",
    audienceSegment:
      "High school sophomores and juniors who are stressed about their upcoming SAT, have taken a practice test and know their score needs work, and are actively looking for a solution",
    product:
      "Varsity Tutors SAT prep — 1-on-1 online tutoring, adaptive practice tests, and personalized study plans that target your specific weak areas",
    campaignGoal: "conversion",
    tone: "urgent",
    brandVoiceNotes:
      "Speak directly to the student, not the parent. Acknowledge the stress. Make the solution feel achievable and fast. Use specific numbers (score improvement, time to results). Strong conversion CTA.",
    adsToGenerate: 20,
  },
  {
    name: "SAT Prep — Comparison Shoppers (Retargeting)",
    audienceSegment:
      "Families who are actively comparing SAT prep options — Varsity Tutors vs Princeton Review vs Khan Academy vs Chegg vs Kaplan — and haven't made a decision yet",
    product:
      "Varsity Tutors SAT prep — 1-on-1 personalized tutoring that adapts to your child's specific needs, unlike group classes or generic video courses",
    campaignGoal: "retargeting",
    tone: "professional",
    brandVoiceNotes:
      "This audience has already seen generic ads. Differentiate on personalization vs. one-size-fits-all. Use social proof. Address the price objection indirectly by emphasizing ROI. Don't mention competitors by name.",
    adsToGenerate: 15,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  const caller = appRouter.createCaller(makeCtx());
  let totalGenerated = 0;
  let totalApproved = 0;

  console.log("\n🚀 Starting demo seed — generating 55 real ads across 3 campaigns...\n");
  console.log("Each ad runs the full generate → evaluate → self-heal pipeline.\n");

  for (const def of CAMPAIGNS) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📋 ${def.name}`);
    console.log(`   Goal: ${def.campaignGoal} | Tone: ${def.tone}`);
    console.log(`   Generating ${def.adsToGenerate} ads with self-healing (max 3 iterations each)...\n`);

    // Create campaign
    const campaign = await caller.campaigns.create({
      name: def.name,
      audienceSegment: def.audienceSegment,
      product: def.product,
      campaignGoal: def.campaignGoal,
      tone: def.tone,
      brandVoiceNotes: def.brandVoiceNotes,
    });

    const campaignId = campaign.id;
    console.log(`   ✅ Campaign created (ID: ${campaignId})`);

    let campaignApproved = 0;
    const scores = [];

    for (let i = 0; i < def.adsToGenerate; i++) {
      try {
        const result = await caller.ads.generateAndEvaluate({
          campaignId,
          mode: "standard",
          maxIterations: 3,
        });

        scores.push(result.bestScore);
        if (result.isPublishable) campaignApproved++;
        totalGenerated++;
        if (result.isPublishable) totalApproved++;

        const bar = result.isPublishable ? "✅" : "⚠️ ";
        const ratchet = result.qualityRatchetApplied ? " 🔺 RATCHET" : "";
        console.log(
          `   Ad ${String(i + 1).padStart(2, "0")}/${def.adsToGenerate}: score ${result.bestScore.toFixed(2)} | ${result.totalIterations} iter | ${bar}${ratchet}`
        );

        // Pause between ads to avoid rate-limiting
        await sleep(800);
      } catch (err) {
        console.error(`   ❌ Ad ${i + 1} failed: ${err.message}`);
        await sleep(2000);
      }
    }

    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";
    const best = scores.length > 0 ? Math.max(...scores).toFixed(2) : "N/A";
    console.log(`\n   📊 Results: ${campaignApproved}/${def.adsToGenerate} approved | avg score: ${avg} | best: ${best}`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅  SEED COMPLETE");
  console.log("═".repeat(60));
  console.log(`Total generated:  ${totalGenerated}`);
  console.log(`Total approved:   ${totalApproved} (${((totalApproved / totalGenerated) * 100).toFixed(0)}%)`);
  console.log("\nOpen the app → Dashboard to see your 3 campaigns.");
  console.log("Go to Performance Tracker inside any campaign to see quality trends.\n");
}

seed().catch((err) => {
  console.error("\n💥 Seed failed:", err.message || err);
  process.exit(1);
});
