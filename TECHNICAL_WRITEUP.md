# Technical Writeup — Autonomous Ad Engine
**Author:** Sam Kos | **Submission:** Nerdy / Varsity Tutors Gauntlet | **Scope:** v3 (Autonomous Ad Engine)

---

## System Overview

The Autonomous Ad Engine is a full-stack web application that implements an autonomous pipeline for generating, evaluating, and iteratively improving Facebook and Instagram ad copy for Varsity Tutors (Nerdy). The system is built around three core loops: a **generation loop** that produces structured ad copy from campaign briefs, an **evaluation loop** that scores every ad across five quality dimensions using an LLM judge, and a **self-healing loop** that automatically rewrites ads that fall below the quality threshold, targeting the specific dimension that needs improvement.

The north star metric throughout the design is **performance per token** — how much quality the system produces per dollar of LLM API spend. Every ad tracks its token usage and estimated cost, and the Performance Tracker page visualizes quality vs. cost across all generated ads.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React + tRPC)                 │
│  Home · Dashboard · Campaign Builder · Campaign Detail   │
│  Ad-versarial Mode · Creative Spark · Performance Tracker│
└──────────────────────┬──────────────────────────────────┘
                       │ tRPC over HTTP
┌──────────────────────▼──────────────────────────────────┐
│                   SERVER (Express + tRPC)                │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  campaigns  │  │     ads      │  │  adversarial   │  │
│  │   router    │  │    router    │  │    router      │  │
│  └─────────────┘  └──────┬───────┘  └────────────────┘  │
│                          │                               │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │           Core Generation Pipeline               │   │
│  │                                                  │   │
│  │  generateAdCopy() → evaluateAdCopy() → ratchet() │   │
│  └───────────────────────┬──────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │              LLM (Manus Forge API)               │   │
│  │         GPT-4o class, structured JSON output     │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ Drizzle ORM
┌──────────────────────▼──────────────────────────────────┐
│                  DATABASE (MySQL / TiDB)                 │
│  users · campaigns · ads · evaluations · iteration_logs  │
│  adversarial_sessions · creative_spark_ideas · share_links│
└─────────────────────────────────────────────────────────┘
```

### Technology Choices

The stack is React 19 + TypeScript on the frontend, Express 4 + tRPC 11 on the backend, and MySQL/TiDB via Drizzle ORM for persistence. tRPC provides end-to-end type safety without a separate API schema — procedures defined in `server/routers.ts` are consumed directly in the frontend with full TypeScript inference. This eliminates an entire class of bugs (mismatched API contracts) and makes refactoring significantly safer.

Tailwind CSS v4 with a custom dark theme handles styling. Framer Motion provides the animations (the live pipeline visualization, card transitions, and the emotional arc chart). The design system uses a space/intelligence aesthetic — dark backgrounds, teal accent for primary actions, gold for high-quality indicators — chosen to communicate that this is a precision instrument, not a toy.

---

## The Generation Pipeline

### Input: Campaign Brief

Every generation run starts with a campaign brief stored in the database:

| Field | Type | Purpose |
|---|---|---|
| `audienceSegment` | text | Who the ad is targeting |
| `product` | text | What is being advertised |
| `campaignGoal` | enum | awareness / conversion / retargeting |
| `tone` | enum | empowering / urgent / friendly / professional / playful |
| `brandVoiceNotes` | text | Optional additional brand context |
| `weightClarity` | int | Weight for Clarity dimension (0–100) |
| `weightValueProp` | int | Weight for Value Proposition dimension |
| `weightCta` | int | Weight for CTA dimension |
| `weightBrandVoice` | int | Weight for Brand Voice dimension |
| `weightEmotionalResonance` | int | Weight for Emotional Resonance dimension |
| `currentQualityThreshold` | float | Minimum passing score (starts at 7.0) |

### Step 1: Ad Copy Generation

The generation function (`generateAdCopy`) sends two messages to the LLM: a system prompt containing the Varsity Tutors brand context, Meta ad best practices, and mode-specific instructions; and a user prompt containing the campaign brief. The model returns structured JSON with four required fields:

- `primaryText` — the main copy above the image (1–3 sentences, stops the scroll)
- `headline` — bold text below the image (max 40 characters, punchy)
- `description` — secondary text (max 30 characters, often truncated on mobile)
- `ctaButton` — one of: Learn More, Sign Up, Get Started, Book Now, Try Free

The model also returns an `imagePrompt` (for future v2 image generation) and `reasoning` (the model's explanation of its creative choices, logged for debugging).

Four generation modes are supported, each with different system prompt instructions:

| Mode | Behavior |
|---|---|
| `standard` | High-converting ad using Meta best practices |
| `creative_spark` | No guardrails — wildly creative, unexpected, memorable |
| `adversarial` | Studies a competitor ad and creates a superior version |
| `self_healing` | Receives the weakest dimension and improvement suggestion from the previous evaluation; fixes that specific weakness |

### Step 2: LLM-as-Judge Evaluation

Immediately after generation, a second LLM call evaluates the ad. The evaluator receives a different system prompt with explicit scoring rubrics and instructions to "be harsh — a 7 means genuinely good, 8+ means excellent, 9–10 is rare and exceptional." It returns scores for all five dimensions, written rationale for each score, the weakest dimension, an improvement suggestion, and an emotional arc analysis (the primary text broken into 3–5 segments with intensity and valence scores for each).

The weighted aggregate score is calculated server-side using the campaign's dimension weights:

```
weightedScore = (scoreClarity × weightClarity + scoreValueProp × weightValueProp +
                 scoreCta × weightCta + scoreBrandVoice × weightBrandVoice +
                 scoreEmotionalResonance × weightEmotionalResonance) / 100
```

### Step 3: Quality Gate and Self-Healing

If `weightedScore >= currentQualityThreshold`, the ad is marked "approved" and the pipeline stops. If not, the system enters the self-healing loop: it takes the `weakestDimension` and `improvementSuggestion` from the evaluation, switches to `self_healing` mode, and generates a new ad with targeted instructions. This repeats up to `maxIterations` times (default: 3, max: 5). Every iteration is logged with score before, score after, target dimension, and strategy used.

### Step 4: Quality Ratchet

After the pipeline completes, if the best ad scored 1.5+ points above `currentQualityThreshold`, the threshold automatically rises by 0.25 points (capped at 9.5). This implements the "standards only go UP" requirement from the PRD.

---

## Database Schema

Eight tables store all system state:

| Table | Purpose |
|---|---|
| `users` | Auth — managed by Manus OAuth |
| `campaigns` | Campaign briefs, dimension weights, quality threshold, running cost totals |
| `ads` | Every generated ad — all four copy fields, generation mode, iteration number, token usage, status |
| `evaluations` | Full scorecard per ad — 5 dimension scores, rationales, weakest dimension, improvement suggestion, emotional arc data |
| `iteration_logs` | Every self-healing cycle — score before/after, target dimension, strategy used |
| `adversarial_sessions` | Competitor ad battles — round-by-round scores, win status |
| `creative_spark_ideas` | Unconstrained ideas with save/unsave toggle |
| `campaign_share_links` | Tokens for public share URLs |

---

## Quality Measurement

### The Five Dimensions

The PRD specifies five quality dimensions. Here is how each is operationalized in the evaluation prompt:

**Clarity (default weight: 20%)** — Is the message immediately understandable? The evaluator looks for a single clear takeaway communicable in under three seconds. Confusing ads with multiple competing messages score 1–3. Crystal clear single-benefit ads score 8–10.

**Value Proposition (default weight: 25%)** — Does the ad communicate a compelling, specific benefit? Generic feature-focused copy ("we have tutors") scores low. Specific, differentiated outcomes ("raise your SAT score 200+ points in 8 weeks") score high. This dimension is weighted highest because it most directly drives conversion decisions.

**Call to Action (default weight: 20%)** — Is the next step clear, urgent, and low-friction? Vague CTAs ("learn more") score lower than specific, stage-appropriate CTAs ("start your free practice test"). The evaluator checks whether the CTA matches the campaign goal (awareness vs. conversion vs. retargeting).

**Brand Voice (default weight: 15%)** — Does the ad sound like Varsity Tutors? The evaluator checks for the brand's four voice attributes: empowering, knowledgeable, approachable, results-focused. Ads that sound generic or use competitor-style fear-based messaging score low. This dimension is weighted lowest because a slightly off-brand ad that converts is better than a perfectly on-brand ad that doesn't.

**Emotional Resonance (default weight: 20%)** — Does the ad connect emotionally with the target audience? For the parent audience, this means tapping into college admissions anxiety and the desire to give their child every advantage. For the student audience, it means connecting with test anxiety and the ambition to succeed. Flat, purely rational ads score low.

### Dimension Weights Are Adjustable

Each campaign has its own dimension weights, adjustable via sliders in the UI (constrained to sum to 100). This allows the system to optimize for different campaign goals: an awareness campaign for parents should weight Emotional Resonance higher; a retargeting campaign for comparison shoppers should weight Value Prop and CTA higher.

---

## Performance-Per-Token Tracking

Every LLM call records its token usage. The system estimates cost using GPT-4o-mini pricing:

```
cost = (promptTokens / 1000) × $0.00015 + (completionTokens / 1000) × $0.0006
```

The Performance Tracker page aggregates this data into:
- Total cost per campaign
- Cost per generated ad
- Cost per approved ad (the metric that matters — how much does it cost to produce a passing ad?)
- Quality vs. cost scatter plot — each point is one ad, showing the relationship between score and cost
- Quality trend over time — does the system improve across iterations?

---

## Features Built

| Feature | Description | PRD Scope |
|---|---|---|
| Campaign Builder | Brief input with audience, product, goal, tone, brand notes | v1 |
| Ad Generation Pipeline | Standard, self-healing, adversarial, creative spark modes | v1 |
| 5-Dimension LLM Evaluation | Scores + rationales + weakest dimension + improvement suggestion | v1 |
| Self-Healing Feedback Loop | Up to 5 iterations targeting the weakest dimension | v1 |
| Quality Ratchet | Threshold auto-raises when performance exceeds bar by 1.5+ points | v3 |
| Performance-Per-Token Tracking | Cost per ad, cost per approved ad, quality vs. cost chart | v3 |
| Iteration Logs | Full before/after record of every self-healing cycle | v1 |
| Bulk × 5 Generation | 5 parallel pipelines, surfaces the winner | v2 |
| Ad-versarial Mode | Compete against real competitor ads, round-by-round scoring | v3 |
| Creative Spark Generator | Unconstrained mode for breaking creative blocks | v3 |
| Dimension Weight Tuning | Per-campaign sliders for adjusting dimension importance | v2 |
| Emotional Arc Analysis | Sentiment intensity and valence per segment of primary text | v3 |
| Shareable Campaign Links | Public read-only campaign reports without authentication | v2 |
| Facebook/Instagram Mockup | Phone frame preview showing how the ad looks on device | v2 |
| CSV Export | Download all approved ads with scores | v1 |

---

## Test Coverage

17 tests across 2 test files cover all major system paths:

- Campaign creation and weight validation (weights must sum to 100)
- Ad generation pipeline (full generate-evaluate-iterate loop)
- Evaluation scoring and weighted aggregate calculation
- Campaign analytics (quality trend, cost metrics, iteration logs)
- Adversarial mode (battle execution, win status determination)
- Creative Spark (idea generation, save/unsave toggle)
- Auth (session management, logout)

Tests run in under 700ms using Vitest with mocked LLM calls.

---

## Limitations and Future Work

The system's primary limitation is that the evaluator uses the same model as the generator, which introduces potential self-evaluation bias. A production system would use a separate evaluation model and validate LLM scores against human judgment on a sample of approved ads.

The evaluation framework has not been calibrated against real Varsity Tutors performance data. The scoring rubrics are based on general Meta ad best practices and the brand context provided in the PRD brief. Calibration against actual high-performing Varsity Tutors ads would significantly improve evaluation accuracy.

The most impactful next step would be competitive intelligence from the Meta Ad Library — pulling real competitor ads from Princeton Review, Khan Academy, Chegg, and Kaplan, analyzing their patterns, and feeding those patterns into the generation prompts. This is the highest-value feature not yet implemented.

See [DECISION_LOG.md](./DECISION_LOG.md) for detailed reasoning on every major design decision and an honest account of what didn't work.
