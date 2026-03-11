# Autonomous Ad Engine (100x Edition)

> An autonomous pipeline that generates, evaluates, self-heals, and progressively improves Facebook & Instagram ad copy — without human intervention.

Built for the Nerdy / Varsity Tutors Gauntlet challenge. This is a v3 submission: everything in v1 and v2, plus self-healing feedback loops, quality ratchet, performance-per-token tracking, and agentic orchestration.

---

## What It Does

The engine takes a campaign brief (audience, product, goal, tone) and runs a fully autonomous loop:

```
Brief → Generate Ad → Score (5 dimensions) → Above 7.0?
                                              ├─ Yes → Add to library
                                              └─ No  → Identify weakest dimension
                                                     → Targeted regeneration
                                                     → Re-score
                                                     → Track improvement
```

Every ad gets scored across five dimensions by an LLM judge: **Clarity**, **Value Proposition**, **Call to Action**, **Brand Voice**, and **Emotional Resonance**. Scores below 7.0/10 trigger automatic self-healing. The quality floor only moves up — never down.

---

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm installed
- A database (MySQL/TiDB compatible)
- Environment variables (see below)

### One-Command Setup

```bash
# Clone and install
git clone https://github.com/Theesamkos/nerdy-autonomous-ad-engine.git
cd nerdy-autonomous-ad-engine
pnpm install

# Start the dev server (frontend + backend together)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is running.

### Environment Variables

The following variables are required. Copy `.env.example` to `.env` and fill them in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session signing secret (any random string) |
| `BUILT_IN_FORGE_API_KEY` | LLM API key (Manus Forge or OpenAI-compatible) |
| `BUILT_IN_FORGE_API_URL` | LLM API base URL |
| `VITE_APP_ID` | OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | OAuth login portal URL |

### Database Setup

```bash
# Generate migration SQL from schema
pnpm drizzle-kit generate

# Apply migrations (read the generated SQL and run it against your DB)
# Or use the built-in webdev_execute_sql tool if running on Manus
```

---

## How to Use It

### 1. Create a Campaign

Navigate to **Dashboard → New Campaign**. Fill in:
- **Audience segment** — who you're targeting (e.g., "Parents of high school juniors anxious about SAT scores")
- **Product/offer** — what you're advertising (e.g., "Varsity Tutors SAT prep — 1-on-1 online tutoring")
- **Campaign goal** — awareness, conversion, or retargeting
- **Tone** — empowering, urgent, friendly, professional, or playful
- **Brand voice notes** — optional additional context

### 2. Generate Ads

Inside a campaign, click **Generate**. Choose a mode:

| Mode | What It Does |
|---|---|
| **Standard** | High-converting ad using best practices |
| **Self-Healing** | Automatically fixes weak dimensions across up to 5 iterations |
| **Bulk × 5** | Runs 5 pipelines in parallel, surfaces the winner |

Watch the pipeline run live. Every generation and evaluation step is visible in real time.

### 3. Read the Scorecard

Every ad gets a full evaluation:
- Five dimension scores (1–10) with written rationale
- Weighted aggregate score
- Weakest dimension identified
- Improvement suggestion for the next iteration

### 4. Track Improvement

The **Performance Tracker** shows:
- Quality trend over time (is the system getting better?)
- Cost per ad and cost per approved ad
- Quality vs. cost scatter plot (performance per token)
- Iteration logs showing before/after scores for every self-healing cycle

### 5. Run Ad-versarial Mode

Paste in a competitor's ad. The engine runs multiple rounds, iterating until every dimension score beats the competition. See exactly where you're winning and losing.

### 6. Export Results

Download a CSV of all approved ads with their full evaluation scores from the Performance Tracker page.

---

## Running Tests

```bash
pnpm test
```

17 tests covering all major procedures: campaign management, ad generation pipeline, evaluation scoring, adversarial mode, creative spark, and auth.

```
Test Files  2 passed (2)
      Tests  17 passed (17)
   Duration  686ms
```

---

## Architecture Overview

See [TECHNICAL_WRITEUP.md](./TECHNICAL_WRITEUP.md) for the full architecture breakdown.

See [DECISION_LOG.md](./DECISION_LOG.md) for the reasoning behind every major design decision, including what didn't work and where the system breaks.

---

## Key Files

```
server/routers.ts        ← All tRPC procedures (generation, evaluation, iteration)
server/db.ts             ← Database query helpers
drizzle/schema.ts        ← All 8 database tables
client/src/pages/        ← All UI pages
DECISION_LOG.md          ← Design decisions, trade-offs, honest limitations
TECHNICAL_WRITEUP.md     ← Architecture and system design
```

---

## Submission Artifacts

| Artifact | Location |
|---|---|
| Live demo | [https://autonomous-ad-engine.manus.space](https://autonomous-ad-engine.manus.space) |
| Source code | This repository |
| Decision log | [DECISION_LOG.md](./DECISION_LOG.md) |
| Technical writeup | [TECHNICAL_WRITEUP.md](./TECHNICAL_WRITEUP.md) |
| Generated ad samples | Export CSV from Performance Tracker in the live demo |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| Animations | Framer Motion |
| Backend | Express 4 + tRPC 11 |
| Database | MySQL / TiDB (via Drizzle ORM) |
| LLM | GPT-4o class via Manus Forge API |
| Auth | Manus OAuth |
| Testing | Vitest |
| Deployment | Manus hosting |

---

## Known Limitations

- LLM evaluation scores have variance, particularly on Emotional Resonance (±0.5–1.0 across runs)
- Cost estimates are approximations based on GPT-4o-mini pricing; actual costs depend on the underlying model
- The system has not been calibrated against real Varsity Tutors performance data (reference ads were not available)
- Vague campaign briefs produce generic ads that pass the quality threshold but would not perform well in production
- The evaluator uses the same model as the generator, which introduces potential self-evaluation bias

See [DECISION_LOG.md](./DECISION_LOG.md) for full details on limitations and what I'd change with more time.
