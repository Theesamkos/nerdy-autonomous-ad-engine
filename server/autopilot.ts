/**
 * Autopilot Scheduler
 *
 * Every 15 minutes, checks all autopilot-enabled campaigns. If a campaign's
 * autopilotLastRunAt is null or older than autopilotFrequencyHours, it
 * fires one standard generation run (no SSE — fire-and-forget).
 */
import { getAutopilotEnabledCampaigns, updateCampaignAutopilot } from "./db";
import { runGenerateAndEvaluatePipeline } from "./routers";

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function runDueAutopilotCampaigns() {
  let campaigns;
  try {
    campaigns = await getAutopilotEnabledCampaigns();
  } catch (err) {
    // DB may not be ready yet — skip this tick silently
    return;
  }

  const now = Date.now();
  for (const campaign of campaigns) {
    const lastRun = campaign.autopilotLastRunAt ? campaign.autopilotLastRunAt.getTime() : 0;
    const frequencyMs = campaign.autopilotFrequencyHours * 60 * 60 * 1000;
    if (now - lastRun < frequencyMs) continue;

    console.log(`[Autopilot] Running generation for campaign ${campaign.id} (${campaign.name})`);

    // Mark last run immediately to prevent double-firing
    await updateCampaignAutopilot(campaign.id, {
      autopilotLastRunAt: new Date(),
      autopilotTotalRuns: (campaign.autopilotTotalRuns ?? 0) + 1,
    });

    // Fire-and-forget — no hooks, no SSE
    runGenerateAndEvaluatePipeline({
      userId: campaign.userId,
      input: { campaignId: campaign.id, mode: "standard", maxIterations: 3 },
      hooks: {
        shouldStop: () => false,
        onInit: async () => {},
        onPromptBuilt: async () => {},
        onGenerating: async () => {},
        onToken: async () => {},
        onCopyComplete: () => {},
        onEvaluating: async () => {},
        onScoreUpdate: async () => {},
        onResult: () => {},
        onHealing: async () => {},
        onComplete: ({ adId, finalScore }) => {
          console.log(`[Autopilot] Campaign ${campaign.id} completed — adId=${adId} score=${finalScore}`);
        },
      },
    }).catch((err: unknown) => {
      console.error(`[Autopilot] Generation failed for campaign ${campaign.id}:`, err);
    });
  }
}

let autopilotInterval: NodeJS.Timeout | null = null;

export function startAutopilotScheduler() {
  if (autopilotInterval) return;
  console.log("[Autopilot] Scheduler started (15 min poll)");
  // Run once immediately, then on interval
  runDueAutopilotCampaigns().catch(console.error);
  autopilotInterval = setInterval(() => {
    runDueAutopilotCampaigns().catch(console.error);
  }, POLL_INTERVAL_MS);
}

export function stopAutopilotScheduler() {
  if (autopilotInterval) {
    clearInterval(autopilotInterval);
    autopilotInterval = null;
  }
}
