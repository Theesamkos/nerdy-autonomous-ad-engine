import { createCallerFactory } from "./server/_core/trpc";
import { appRouter } from "./server/routers";

const createCaller = createCallerFactory(appRouter);
const caller = createCaller({ user: { id: 1, openId: "test", name: "Test", role: "admin" as const, createdAt: new Date() } });

async function test() {
  try {
    const result = await caller.creativeSpark.generate({ campaignId: 30001, count: 3 });
    console.log("SUCCESS: Generated", result.length, "sparks");
    if (result[0]) console.log("First spark:", result[0].concept?.substring(0, 60));
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }
}
test();
