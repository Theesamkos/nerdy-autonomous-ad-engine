# Autonomous Ad Engine — Project TODO

## Phase 1: Foundation
- [x] Database schema (campaigns, ads, evaluations, iterations, token_usage)
- [x] Global dark theme + design tokens in index.css
- [x] App.tsx routes + DashboardLayout sidebar

## Phase 2: Backend Services
- [x] tRPC router: campaigns (create, list, get)
- [x] tRPC router: ads.generate (streaming LLM generation)
- [x] tRPC router: ads.evaluate (5-dimension LLM-as-judge scoring)
- [x] tRPC router: ads.iterate (self-healing feedback loop)
- [x] tRPC router: ads.list / ads.get
- [x] Quality ratchet logic (progressive threshold raising)
- [x] Performance-per-token tracking (cost correlation)
- [x] Creative Spark generator (unconstrained LLM mode)
- [x] Adversarial mode router (competitor ad input + iterative improvement)

## Phase 3: Core UI — Generation
- [x] Landing / Hero page with animated intro
- [x] Campaign Builder page (brief form: audience, product, goal, tone)
- [x] Real-time generation stream panel (live LLM token output)
- [x] Generated Ad Card component (primary text, headline, description, CTA)

## Phase 4: Core UI — Evaluation & Tuning
- [x] Quality Score Dashboard (radar chart for 5 dimensions)
- [x] Interactive Dimension Tuning sliders (real-time weight adjustment)
- [x] Evaluation rationale panel (per-dimension reasoning)
- [x] Quality Trend chart (improvement trajectory across iterations)
- [x] Emotional Resonance Visualizer (sentiment arc chart)

## Phase 5: Advanced Features
- [x] Ad-versarial Mode page (competitor ad input, side-by-side comparison)
- [x] Creative Spark Generator page (inspirational card deck UI)
- [x] Performance Tracker page (cost-per-quality chart, token usage stats)
- [x] Self-healing loop status indicator (live diagnosis feed)
- [x] Quality Ratchet progress bar (current threshold display)

## Phase 6: Polish & Delivery
- [x] Mobile responsiveness pass (sidebar + mobile header)
- [x] Loading skeletons and empty states
- [x] Smooth page transitions and micro-animations (framer-motion)
- [x] Vitest unit tests for core backend procedures (17/17 passing)
- [x] Final checkpoint and delivery

## Phase 7: 100x Visual Redesign (Gauntlet x Mission Control)
- [x] New pure-black design system with warm gold accent (#c8a84b) and dot-grid texture
- [x] JetBrains Mono + Space Grotesk typography system
- [x] Bracket corner "classified document" UI signature element
- [x] Terminal-style generation pipeline with log entries and blinking cursor
- [x] Redesigned Home landing page (massive typography, bracket corners, animated stats)
- [x] Redesigned AppLayout sidebar (monospace nav, status indicators, gold accents)
- [x] Redesigned Dashboard page (campaign grid with KPI tiles)
- [x] Redesigned CampaignBuilder (ops-input fields, full-bleed dark form)
- [x] Redesigned CampaignDetail (header stats grid, terminal pipeline, weight tuner)
- [x] Redesigned AdversarialMode (battle arena UI)
- [x] Redesigned CreativeSpark (wild-factor cards, inspiration deck)
- [x] Redesigned PerformanceTracker (scatter plot, radar, emotional arc visualizer)
- [x] Final TypeScript check: 0 errors
- [x] Final test run: 17/17 passing

## Phase 8: UI Cleanup & Polish Sprint

- [x] Increase space background opacity to 38-42% for more planet visibility
- [x] Redesign AppLayout sidebar — tighter, cleaner, less visual noise
- [x] Rebuild Dashboard — clean card grid, clear hierarchy, breathing room
- [x] Rebuild Home landing page — sharper hero, cleaner feature grid
- [x] Rebuild CampaignDetail — tabbed layout to reduce visual overload
- [x] Rebuild CampaignBuilder — cleaner step flow
- [x] Rebuild AdversarialMode — cleaner two-panel layout
- [x] Rebuild CreativeSpark — cleaner card grid
- [x] Rebuild PerformanceTracker — cleaner chart layout
- [x] Add Facebook/Instagram phone frame mockup to CampaignDetail
- [x] Final TypeScript check: 0 errors + 17/17 tests passing
- [x] GitHub push + checkpoint

## Phase 9: Three High-Impact Features

- [x] Facebook/Instagram phone frame ad preview mockup in CampaignDetail
- [x] Bulk generation mode: generate 5 ads in parallel, surface top scorer — Cursor prompt ready
- [x] Backend: bulkGenerate tRPC procedure (parallel pipeline) — Cursor prompt ready
- [x] Export to CSV on PerformanceTracker (approved ads + scores + cost) — Cursor prompt ready
- [x] Export to PDF on PerformanceTracker (formatted report) — Cursor prompt ready
- [x] Final TypeScript check: 0 errors + 17/17 tests passing
- [x] Checkpoint + delivery

## Phase 10: Home Page Tesla-Style Redesign

- [x] Audit Home page — identify clutter, hierarchy issues, spacing problems
- [x] Rebuild hero — asymmetric 2-col layout, single clean subtext, breathing room
- [x] Rebuild terminal mockup — focused score ring + ad copy + dimension bars + log
- [x] Rebuild stats bar — Tesla instrument cluster style, no card borders
- [x] Rebuild features grid — 3-col, icon+tag row, hook line in accent color
- [x] Remove redundant bottom CTA section
- [x] TypeScript: 0 errors
- [x] Checkpoint + delivery

## Phase 11: Home Page Spacing Pass

- [x] Increase section vertical padding — hero, stats, features, footer
- [x] Increase internal card padding and gap between feature cards
- [x] Add more breathing room between headline, subtext, CTAs, and trust signals
- [x] Hero: full-viewport-height with golden ratio vertical centering
- [x] Checkpoint + delivery

## Phase 13: GitHub Push + Next Features

- [x] Push Manus project to GitHub
- [x] Bulk × 5 Generation Mode — backend bulkGenerate procedure + frontend UI
- [x] CSV/PDF Export on PerformanceTracker
- [x] TypeScript: 0 errors + 17/17 tests passing
- [x] Checkpoint + delivery

## Phase 14: Context-Aware Sidebar Navigation

- [x] Fix 404 on /adversarial — route is campaign-scoped (/campaigns/:id/adversarial)
- [x] Rebuild AppLayout sidebar: context-aware (top-level nav vs campaign sub-nav)
- [x] Campaign sub-nav: Overview, Adversarial Mode, Creative Spark, Performance Tracker
- [x] Active campaign name shown in sidebar header when in campaign context
- [x] Back to Dashboard breadcrumb when in campaign context
- [x] TypeScript: 0 errors + tests passing
- [x] Checkpoint + delivery

## Phase 15: Thursday Submission Sprint

### BLOCK 1 — Documentation (Highest ROI, do first)
- [x] Write DECISION_LOG.md — why these 5 dimensions, why the weights, what failed, limitations
- [x] Write README.md — one-command setup, what it does, how to run, how to demo
- [x] Write TECHNICAL_WRITEUP.md — 1-2 page architecture overview for submission

### BLOCK 2 — Demo Data (Avoid -5 deduction)
- [x] Build a seed script that generates 50+ ads across 3 Varsity Tutors audience segments
- [x] Run the seed script and verify 50+ ads with full evaluation scores in the database
- [x] Export CSV of all approved ads with scores from PerformanceTracker

### BLOCK 3 — Remaining Cursor Features (How It Works, ELITE badge, Share button)
- [ ] Run Cursor Prompt 1: "How It Works" section on Home page
- [ ] Run Cursor Prompt 2: ELITE badge + owner notification on 9.0+ ads
- [ ] Run Cursor Prompt 3: Share button on CampaignDetail
- [ ] Pull changes from GitHub, run tests, save checkpoint

### BLOCK 4 — Competitive Intelligence (Bonus +10 points)
- [x] Research Meta Ad Library API / scraping approach for competitor ads
- [x] Pull competitor ads: Princeton Review, Khan Academy, Chegg, Kaplan
- [x] Add competitor reference data to generation prompts
- [x] Build a "Competitor Intelligence" panel in the UI showing patterns found

### BLOCK 5 — Final Polish & Submission Prep
- [ ] Pre-populate the live demo with real Varsity Tutors SAT campaign data
- [ ] Record a 3-5 minute demo walkthrough video
- [x] Final TypeScript check: 0 errors
- [x] Final test run: 17/17+ passing
- [x] Save final checkpoint + push to GitHub
- [ ] Verify GitHub repo is public and all files are present

## Phase 16: Configurable Quality Threshold

- [x] Add qualityThreshold field to campaigns table (default 7.0, range 5.0–9.0)
- [x] Add threshold slider to CampaignBuilder Step 3 (Brand Voice) with tier labels
- [x] Wire threshold through campaigns.create procedure
- [x] Use campaign.qualityThreshold in generateAndEvaluate self-healing loop (already uses currentQualityThreshold from DB)
- [x] Update CampaignDetail header to show current threshold
- [x] TypeScript: 0 errors + tests passing
- [x] Checkpoint + push to GitHub

## Phase 17: Ready to Launch Export Panel

- [ ] Build ReadyToLaunch component with Meta-formatted fields (headline ≤27 chars, primary text, description, CTA type)
- [ ] One-click copy button per field with visual confirmation (checkmark flash)
- [ ] Character count indicators matching Meta's limits (headline 27, description 30, primary text 125 recommended)
- [ ] "Open in Ads Manager" deep link button (pre-selects campaign objective based on campaignGoal)
- [ ] "Copy All Fields" master button that copies everything formatted as a block
- [ ] Show panel only on approved ads (not failed/pending)
- [ ] Add to CampaignDetail ad card expanded view
- [ ] TypeScript: 0 errors + tests passing
- [ ] Checkpoint + push to GitHub

## Phase 18: Full App Functionality Sweep

- [ ] Fix Creative Spark bulk insert DB error (campaignId foreign key / userId issue)
- [ ] Finish Ready to Launch export panel on approved ad cards
- [ ] Audit and fix CampaignDetail page (all tabs, all buttons)
- [ ] Audit and fix Dashboard page
- [ ] Audit and fix AdversarialMode page
- [ ] Audit and fix PerformanceTracker page
- [ ] Audit and fix CompetitorIntel page
- [ ] Audit and fix SharePage (public view)
- [ ] Audit and fix Home landing page
- [ ] TypeScript: 0 errors + tests passing
- [ ] Checkpoint + push to GitHub
