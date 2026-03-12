# AI Tools & Prompts Documentation

This document records every AI tool, model, and prompt strategy used in building the Autonomous Ad Engine.

---

## Models Used

| Task | Model | Why |
|---|---|---|
| Ad copy generation | GPT-4o (via Manus Forge API) | Strong creative writing, follows brand voice constraints reliably |
| LLM-as-judge evaluation | GPT-4o (same model) | Consistent scoring when given structured rubrics; avoids inter-model calibration drift |
| Competitor ad analysis | GPT-4o | Pattern recognition across multiple ad examples |
| Creative Spark mode | GPT-4o with higher temperature | Unconstrained creative generation for novel hooks |

**Why single-model for both generation and evaluation?** The PRD explicitly states "Single LLM for both generation and evaluation is fine." Using the same model reduces the risk of the evaluator being systematically biased against the generator's style. The trade-off is that the model may be lenient on its own outputs — we mitigate this by using structured rubrics with explicit scoring anchors rather than open-ended judgment.

---

## Generation Prompts

### Standard Ad Generation Prompt

The generation prompt is structured in four sections:

1. **System context** — Establishes the model as a direct-response copywriter for Varsity Tutors with explicit brand voice rules (empowering, knowledgeable, approachable, results-focused).

2. **Campaign brief** — Injects the audience segment, product/offer, campaign goal (awareness vs. conversion), and tone.

3. **Meta ad anatomy** — Reminds the model of the exact field structure: primary text (≤125 chars visible), headline (5-8 words, benefit-driven), description (optional reinforcement), CTA button (funnel-matched).

4. **Quality anchors** — Provides concrete examples of what Score 1 vs. Score 10 looks like for each dimension, so the model self-calibrates before writing.

**Key prompt engineering decisions:**
- We lead with "pain point → solution → proof → CTA" as the structural template because the PRD identifies this as the highest-converting pattern on Meta.
- We explicitly forbid generic phrases ("world-class tutors", "expert help") and require specific, differentiated claims ("raise your SAT score 200+ points").
- We include the current iteration number and any previous improvement suggestion so the model knows what to fix.

### Self-Healing / Remediation Prompt

When an ad scores below 7.0, the system identifies the weakest dimension and regenerates with a targeted fix prompt:

```
The previous ad scored [X]/10 on [dimension]. The evaluator said: "[rationale]".
Rewrite the ad with a specific focus on improving [dimension].
Keep everything else strong. Do not sacrifice [other dimensions] to fix [dimension].
```

This targeted approach outperforms full regeneration because it preserves what worked while fixing what didn't.

### Creative Spark Mode Prompt

Creative Spark uses a deliberately unconstrained prompt that asks the model to "break the pattern" — use an unexpected hook, subvert the expected format, or lead with an emotion rather than a feature. This generates high-variance outputs that occasionally score very high on Emotional Resonance.

---

## Evaluation Prompts

### LLM-as-Judge Prompt

The evaluation prompt asks the model to score each of the 5 dimensions on a 1-10 scale with a written rationale. Key design decisions:

1. **Structured JSON output** — We use `response_format: { type: "json_schema" }` to enforce a strict schema. This eliminates parsing failures and ensures every evaluation has all required fields.

2. **Explicit anchors per dimension** — Each dimension includes a description of what Score 1, Score 5, and Score 10 look like, drawn directly from the PRD's quality table.

3. **Weighted aggregate** — The final score is computed server-side from the 5 dimension scores using the campaign's current weight configuration. This allows weight tuning without re-evaluating ads.

4. **Weakest dimension identification** — The evaluator returns the single lowest-scoring dimension and a specific improvement suggestion. This feeds directly into the self-healing loop.

5. **Confidence field** — The evaluator returns a confidence score (0.0-1.0) indicating how certain it is about the scores. Low-confidence evaluations (< 0.6) are flagged in the UI.

---

## Competitor Intelligence Prompts

The Competitor Intelligence feature analyzes competitor ad copy (Princeton Review, Khan Academy, Chegg, Kaplan) and extracts:
- Hook patterns (what stops the scroll)
- CTA strategies (what drives clicks)
- Emotional triggers (what resonates)
- Weaknesses (what we can exploit)

The analysis prompt asks the model to think like a strategist, not a copywriter — identify patterns across multiple ads rather than evaluating individual quality.

---

## Iteration Strategy

We tried three improvement strategies before settling on the current approach:

**Strategy 1: Full regeneration (abandoned)** — Regenerate the entire ad from scratch when it fails. Problem: throws away what worked. A high-scoring headline paired with a weak CTA would lose the headline in the next attempt.

**Strategy 2: Field-level surgery (abandoned)** — Regenerate only the failing field (e.g., just the CTA). Problem: fields are interdependent. A new CTA that doesn't match the primary text's emotional tone scores worse overall.

**Strategy 3: Targeted regeneration with context (current)** — Regenerate the full ad but with explicit instructions to preserve strengths and fix the weakest dimension. This is the approach described in the PRD's evaluation workflow diagram.

---

## Context Management

Each generation call receives:
- The campaign brief (audience, product, goal, tone, brand voice notes)
- The current iteration number
- The previous ad's weakest dimension and improvement suggestion (if remediating)
- The current quality threshold

We deliberately do NOT pass the full history of previous ads to avoid context window bloat and to prevent the model from anchoring too strongly on previous outputs. Each ad is generated fresh with only the diagnostic signal from the previous attempt.

---

## Tools Used in Development

| Tool | Purpose |
|---|---|
| Manus AI Agent | Full-stack development, architecture decisions, code generation |
| Vitest | Unit and integration testing (17 tests) |
| Drizzle ORM | Type-safe database schema and migrations |
| tRPC | End-to-end type-safe API layer |
| Recharts | Quality trend and performance visualizations |
| Framer Motion | UI animations and micro-interactions |
| shadcn/ui | Component library for consistent UI patterns |

---

## Known Limitations of the AI Approach

1. **Non-determinism** — LLM outputs are stochastic. The same brief will produce different ads on each run. We mitigate this with the quality threshold and remediation loop, but we cannot guarantee reproducibility.

2. **Self-evaluation bias** — Using the same model for generation and evaluation creates a risk that the model is lenient on its own outputs. We partially address this with explicit rubrics and scoring anchors.

3. **No ground truth calibration** — The PRD mentions real Varsity Tutors performance data would be provided via Slack. Without actual CTR/conversion data, our quality scores are based on structural best practices rather than empirical performance. A production system would calibrate the evaluator against real performance data.

4. **Context window limits** — For very long campaigns with many iteration logs, we truncate the context to avoid hitting token limits. This means the model may not see all historical context in long-running campaigns.

5. **Rate limits** — Batch generation of 50 ads makes many parallel API calls. In production, this would require rate limit handling and exponential backoff. The current implementation assumes sufficient API quota.
