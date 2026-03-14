import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

// ─── Event types from the SSE stream ─────────────────────────────────────────
type StreamEvent =
  | { type: "init"; message: string }
  | { type: "prompt_built"; message: string; tone: string; format: string; hook: string }
  | { type: "generating"; message: string }
  | { type: "token"; token: string }
  | { type: "copy_complete"; headline: string; primaryText: string; description: string; ctaButton: string }
  | { type: "evaluating"; message: string }
  | { type: "score_update"; dimension: string; score: number }
  | { type: "result"; score: number; status: "approved" | "rejected"; iterationCount: number }
  | { type: "healing"; message: string; previousScore: number }
  | { type: "complete"; adId: number | null; finalScore: number; totalMs: number }
  | { type: "error"; message: string };

type LogLine = {
  id: number;
  tag: "SYS" | "AI" | "EVAL" | "PASS" | "FAIL" | "HEAL";
  msg: string;
  ts: string;
};

type ScoreEntry = { dimension: string; score: number };

type CompleteResult = {
  adId: number | null;
  finalScore: number;
  totalMs: number;
  isApproved: boolean;
  iterations: number;
};

function nowTs() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

const TAG_COLORS: Record<LogLine["tag"], string> = {
  SYS:  "rgba(148,163,184,0.7)",
  AI:   "#22d3ee",
  EVAL: "#f59e0b",
  PASS: "#34d399",
  FAIL: "#f87171",
  HEAL: "#fb923c",
};

// ─── Animated score bar ───────────────────────────────────────────────────────
function ScoreBar({ dimension, score, delay }: { dimension: string; score: number; delay: number }) {
  const color = score >= 8 ? "#34d399" : score >= 6 ? "#22d3ee" : "#f87171";
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, type: "spring", stiffness: 200 }}
      className="flex items-center gap-2"
    >
      <span className="font-mono text-xs w-28 shrink-0" style={{ color: "rgba(148,163,184,0.6)" }}>
        {dimension.toUpperCase()}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <motion.span
        className="font-mono text-xs w-6 text-right shrink-0"
        style={{ color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5 }}
      >
        {score.toFixed(1)}
      </motion.span>
    </motion.div>
  );
}

// ─── Animated final score counter ─────────────────────────────────────────────
function ScoreCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(t * value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toFixed(1)}</>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export interface GenerationTheaterProps {
  campaignId: number;
  mode?: "standard" | "creative_spark";
  maxIterations?: number;
  isActive: boolean;
  onComplete: (result: { adId: number | null; finalScore: number; isApproved: boolean; iterations: number }) => void;
}

export default function GenerationTheater({
  campaignId,
  mode = "standard",
  maxIterations = 3,
  isActive,
  onComplete,
}: GenerationTheaterProps) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [headlineTokens, setHeadlineTokens] = useState<string[]>([]);
  const [copyComplete, setCopyComplete] = useState<{ headline: string; primaryText: string } | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [result, setResult] = useState<{ status: "approved" | "rejected"; score: number; iterations: number } | null>(null);
  const [complete, setComplete] = useState<CompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  const lineId = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  const addLog = (tag: LogLine["tag"], msg: string) => {
    setLogs(prev => [...prev, { id: lineId.current++, tag, msg, ts: nowTs() }]);
  };

  useEffect(() => {
    if (!isActive) return;

    // Reset state
    setLogs([]);
    setHeadlineTokens([]);
    setCopyComplete(null);
    setScores([]);
    setResult(null);
    setComplete(null);
    setError(null);
    lineId.current = 0;

    const url = `/api/stream/generate?campaignId=${campaignId}&mode=${mode}&maxIterations=${maxIterations}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (evt) => {
      let event: StreamEvent;
      try {
        event = JSON.parse(evt.data);
      } catch {
        return;
      }

      switch (event.type) {
        case "init":
          addLog("SYS", event.message);
          break;
        case "prompt_built":
          addLog("SYS", event.message);
          break;
        case "generating":
          addLog("AI", event.message);
          break;
        case "token":
          setHeadlineTokens(prev => [...prev, event.token]);
          break;
        case "copy_complete":
          setCopyComplete({ headline: event.headline, primaryText: event.primaryText });
          addLog("AI", `Copy ready — "${event.headline}"`);
          break;
        case "evaluating":
          addLog("EVAL", event.message);
          break;
        case "score_update":
          setScores(prev => [...prev, { dimension: event.dimension, score: event.score }]);
          break;
        case "result":
          setResult({ status: event.status, score: event.score, iterations: event.iterationCount });
          if (event.status === "approved") {
            addLog("PASS", `APPROVED — Score: ${event.score.toFixed(1)}/10 in ${event.iterationCount} iteration(s)`);
          } else {
            addLog("FAIL", `Below threshold — Score: ${event.score.toFixed(1)}/10`);
          }
          break;
        case "healing":
          addLog("HEAL", event.message);
          // Reset for next iteration
          setHeadlineTokens([]);
          setCopyComplete(null);
          setScores([]);
          break;
        case "complete":
          setComplete({
            adId: event.adId,
            finalScore: event.finalScore,
            totalMs: event.totalMs,
            isApproved: result?.status === "approved",
            iterations: result?.iterations ?? 1,
          });
          es.close();
          break;
        case "error":
          setError(event.message);
          addLog("FAIL", `Error: ${event.message}`);
          es.close();
          break;
      }
    };

    es.onerror = () => {
      if (!complete) {
        setError("Stream connection lost");
        addLog("FAIL", "Stream connection lost");
      }
      es.close();
    };

    return () => {
      es.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, campaignId, mode, maxIterations]);

  // Fire onComplete once we have a complete event
  useEffect(() => {
    if (!complete) return;
    onComplete({
      adId: complete.adId,
      finalScore: complete.finalScore,
      isApproved: result?.status === "approved",
      iterations: result?.iterations ?? 1,
    });
  }, [complete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const showCopyPreview = headlineTokens.length > 0 || copyComplete;
  const showScores = scores.length > 0;
  const showResult = !!complete;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.9)",
        border: "1px solid rgba(34,211,238,0.3)",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "rgba(34,211,238,0.12)" }}>
        <motion.span
          className="w-2 h-2 rounded-full"
          style={{ background: "#34d399" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="font-mono text-xs tracking-widest font-bold" style={{ color: "#22d3ee" }}>
          ● GENERATION PIPELINE — LIVE
        </span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#34d399" }} />
        </div>
      </div>

      {/* ── Pipeline Log ── */}
      <div className="px-4 py-3 space-y-0.5 max-h-40 overflow-y-auto scrollbar-thin" style={{ scrollbarColor: "rgba(34,211,238,0.15) transparent" }}>
        <AnimatePresence>
          {logs.map(line => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 font-mono text-xs leading-5"
            >
              <span style={{ color: "#94a3b8", flexShrink: 0 }}>{line.ts}</span>
              <span
                className="font-bold px-1 rounded text-xs shrink-0"
                style={{ color: TAG_COLORS[line.tag], border: `1px solid ${TAG_COLORS[line.tag]}33` }}
              >
                {line.tag}
              </span>
              <span style={{ color: "rgba(226,232,240,0.8)" }}>{line.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!complete && !error && (
          <div className="flex items-center gap-2 pt-0.5">
            <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 10 }}>{">"}</span>
            <motion.span
              className="inline-block w-1.5 h-3.5 align-middle"
              style={{ background: "#22d3ee" }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* ── Live Copy Preview ── */}
      <AnimatePresence>
        {showCopyPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div
              className="rounded p-3"
              style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}
            >
              <div className="font-mono text-xs tracking-widest mb-2" style={{ color: "rgba(34,211,238,0.5)" }}>
                LIVE COPY PREVIEW
              </div>
              <div className="font-mono text-[11px] font-bold" style={{ color: "#e2e8f0" }}>
                {copyComplete
                  ? copyComplete.headline
                  : headlineTokens.map((w, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.05 }}
                      >
                        {w}{" "}
                      </motion.span>
                    ))}
                {!copyComplete && (
                  <motion.span
                    className="inline-block w-1 h-3 ml-0.5 align-middle"
                    style={{ background: "#22d3ee" }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  />
                )}
              </div>
              {copyComplete?.primaryText && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-mono text-xs mt-1.5 leading-4"
                  style={{ color: "rgba(148,163,184,0.6)" }}
                >
                  {copyComplete.primaryText.slice(0, 120)}{copyComplete.primaryText.length > 120 ? "…" : ""}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Score Reveal ── */}
      <AnimatePresence>
        {showScores && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div
              className="rounded p-3 space-y-2"
              style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.1)" }}
            >
              <div className="font-mono text-xs tracking-widest mb-1" style={{ color: "rgba(245,158,11,0.5)" }}>
                QUALITY EVALUATION
              </div>
              {scores.map((s, i) => (
                <ScoreBar key={s.dimension} dimension={s.dimension} score={s.score} delay={i * 0.12} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result Card ── */}
      <AnimatePresence>
        {showResult && complete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-4 mb-4 rounded-lg p-4"
            style={{
              background: result?.status === "approved"
                ? "rgba(52,211,153,0.06)"
                : "rgba(248,113,113,0.06)",
              border: `1px solid ${result?.status === "approved" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {result?.status === "approved"
                ? <CheckCircle2 size={14} style={{ color: "#34d399" }} />
                : <XCircle size={14} style={{ color: "#f87171" }} />}
              <span
                className="font-mono font-bold text-xs tracking-widest"
                style={{ color: result?.status === "approved" ? "#34d399" : "#f87171" }}
              >
                {result?.status === "approved" ? "APPROVED — ADDING TO CAMPAIGN" : "BELOW THRESHOLD"}
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
              <span>
                Score:{" "}
                <span className="font-bold" style={{ color: result?.status === "approved" ? "#34d399" : "#f87171" }}>
                  <ScoreCounter value={complete.finalScore} />/10
                </span>
              </span>
              <span>Iterations: <span className="font-bold" style={{ color: "#e2e8f0" }}>{complete.iterations}</span></span>
              <span>
                Time:{" "}
                <span className="font-bold" style={{ color: "#e2e8f0" }}>
                  {(complete.totalMs / 1000).toFixed(1)}s
                </span>
              </span>
            </div>
            {result?.status === "approved" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-1.5 mt-2 font-mono text-xs"
                style={{ color: "rgba(52,211,153,0.6)" }}
              >
                <CheckCircle2 size={10} />
                Ad saved and ready to deploy
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ── */}
      <AnimatePresence>
        {error && !complete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 mb-4 flex items-center gap-2 px-3 py-2 rounded font-mono text-xs"
            style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}
          >
            <AlertTriangle size={11} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
