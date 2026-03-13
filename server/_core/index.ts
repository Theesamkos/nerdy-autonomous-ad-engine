import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter, runGenerateAndEvaluatePipeline } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { startAutopilotScheduler } from "../autopilot";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  app.get("/api/stream/generate", async (req, res) => {
    const campaignId = Number(req.query.campaignId);
    const count = Number(req.query.count ?? 1);

    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      res.status(400).json({ error: "campaignId query param is required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let closed = false;
    const timeouts = new Set<NodeJS.Timeout>();
    const cleanup = () => {
      if (closed) return;
      closed = true;
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
    req.on("close", () => cleanup());

    const writeEvent = (payload: Record<string, unknown>) => {
      if (closed) return;
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        if (closed) {
          resolve();
          return;
        }
        const timeout = setTimeout(() => {
          timeouts.delete(timeout);
          resolve();
        }, ms);
        timeouts.add(timeout);
      });

    const rawMode = String(req.query.mode ?? "standard");
    const mode = ["standard", "creative_spark", "adversarial", "self_healing"].includes(rawMode)
      ? (rawMode as "standard" | "creative_spark" | "adversarial" | "self_healing")
      : "standard";
    const maxIterations = Math.max(1, Math.min(5, Number(req.query.maxIterations ?? count) || 3));

    try {
      const user = await sdk.authenticateRequest(req);
      await runGenerateAndEvaluatePipeline({
        userId: user.id,
        input: {
          campaignId,
          mode,
          maxIterations,
        },
        hooks: {
          shouldStop: () => closed,
          onInit: async ({ message }) => {
            writeEvent({ type: "init", message });
            await sleep(250);
          },
          onPromptBuilt: async ({ message, tone, format, hook }) => {
            writeEvent({ type: "prompt_built", message, tone, format, hook });
            await sleep(250);
          },
          onGenerating: async ({ message }) => {
            writeEvent({ type: "generating", message });
            await sleep(200);
          },
          onToken: async ({ token }) => {
            writeEvent({ type: "token", token });
            await sleep(40);
          },
          onCopyComplete: ({ headline, primaryText, description, ctaButton }) => {
            writeEvent({ type: "copy_complete", headline, primaryText, description, ctaButton });
          },
          onEvaluating: async ({ message }) => {
            writeEvent({ type: "evaluating", message });
            await sleep(250);
          },
          onScoreUpdate: async ({ dimension, score }) => {
            writeEvent({ type: "score_update", dimension, score });
            await sleep(300);
          },
          onResult: ({ score, status, iterationCount }) => {
            writeEvent({ type: "result", score, status, iterationCount });
          },
          onHealing: async ({ message, previousScore }) => {
            writeEvent({ type: "healing", message, previousScore });
            await sleep(300);
          },
          onComplete: ({ adId, finalScore, totalMs }) => {
            writeEvent({ type: "complete", adId, finalScore, totalMs });
          },
        },
      });

      if (!closed) res.end();
      cleanup();
    } catch (error) {
      if (!closed) {
        writeEvent({ type: "error", message: (error as Error).message });
        res.end();
      }
      cleanup();
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startAutopilotScheduler();
  });
}

startServer().catch(console.error);
