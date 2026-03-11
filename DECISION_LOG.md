# Decision Log — Autonomous Ad Engine
**Author:** Sam Kos | **Project:** Nerdy / Varsity Tutors Autonomous Content Generation System | **Date:** March 2026

---

## What This Document Is

This is a record of the real decisions I made while building this system — not a polished retrospective, but an honest account of what I chose, why I chose it, what didn't work, and where the system still breaks. The PRD said your decision log matters as much as your output. I took that seriously.

---

## The Core Problem I Was Solving

The brief was deceptively simple: build a system that generates Facebook and Instagram ads and gets measurably better over time. The hard part isn't the generation — any LLM can write an ad. The hard part is building a system that *knows* when an ad is bad, can diagnose *why* it's bad, and can fix the specific weakness without breaking everything else.

Most AI ad tools are black boxes. You put in a brief, you get copy, you have no idea if it's good or why. I wanted to build the opposite: a system where every decision is traceable, every score is explained, and every improvement is logged with a before/after comparison.

---

## Decision 1: Why These 5 Dimensions (and Not Others)

**What I chose:** Clarity, Value Proposition, Call to Action, Brand Voice, and Emotional Resonance.

**Why:** The PRD specified these five explicitly, but I also independently validated them against what actually drives Meta ad performance. Here's my reasoning for each:

**Clarity** is the foundation. If someone can't understand what you're offering in under three seconds, nothing else matters. On mobile feeds, you have less than a second to communicate your core message before the thumb moves. A confusing ad is a dead ad regardless of how emotionally resonant it is.

**Value Proposition** is what separates Varsity Tutors from the noise. The SAT prep market is crowded — Princeton Review, Khan Academy, Chegg, Kaplan are all running ads in the same feed. Generic "we have tutors" copy blends in. Specific, differentiated benefits ("raise your SAT score 200+ points") stand out. I weighted this highest (25%) because it's the dimension most likely to drive actual conversion decisions.

**Call to Action** is often underweighted in ad evaluation frameworks. A weak CTA kills conversion even when everything else is strong. "Learn More" is fine for awareness; "Start Your Free Practice Test" is dramatically better for conversion. The CTA needs to match the funnel stage, and most generated ads get this wrong.

**Brand Voice** matters more for Varsity Tutors than for most brands because they're in an emotionally charged category (college admissions anxiety). The brand voice — empowering, knowledgeable, approachable — is a deliberate counter-positioning to the fear-based messaging that competitors often use. An ad that sounds like a generic education company undermines the brand even if it converts.

**Emotional Resonance** is the dimension I was most uncertain about including as a scored dimension. It's the hardest to measure objectively. But the PRD's brand context made it clear: "emotional resonance > rational argument for awareness." For the parent audience especially, the emotional hook (college admissions anxiety, wanting the best for your kid) is the primary driver. I kept it in but weighted it second-lowest (15% for brand voice, 20% for emotional resonance) because it's the dimension where LLM scoring is least reliable.

**What I considered but rejected:** I looked at including "Scroll-Stop Power" (how likely is the first line to stop the scroll) as a sixth dimension, but decided it was better captured within Clarity and Emotional Resonance rather than as a separate score. Adding more dimensions would have made the evaluation prompt longer and more expensive without proportional signal gain.

---

## Decision 2: Why the Default Weights Are 20/25/20/15/20

**The weights:** Clarity 20%, Value Prop 25%, CTA 20%, Brand Voice 15%, Emotional Resonance 20%.

**Why not equal weights (20% each)?** I ran the system with equal weights initially and found that it was producing ads that scored well overall but had weak value propositions. Equal weighting treats "sounds like the brand" as equally important as "communicates a compelling reason to buy." For a conversion-focused campaign, that's wrong. Value Prop is the dimension most directly tied to whether someone actually clicks.

**Why Brand Voice is lowest at 15%:** This was a deliberate choice that I'm not fully confident in. Brand Voice is important for long-term brand health, but for a direct response campaign (which most Meta ads are), a slightly off-brand ad that converts is better than a perfectly on-brand ad that doesn't. I made it the lowest weight to avoid the system over-optimizing for "sounds like Varsity Tutors" at the expense of actual persuasion.

**Why I made weights user-adjustable:** Different campaigns have different goals. An awareness campaign for parents should weight Emotional Resonance higher. A retargeting campaign for comparison shoppers should weight Value Prop and CTA even higher. Making the weights a per-campaign setting lets the system adapt to the brief rather than applying a one-size-fits-all formula. The constraint that weights must sum to 100 enforces the trade-off: if you care more about one dimension, you have to care less about another.

---

## Decision 3: Single LLM for Both Generation and Evaluation

**What I chose:** One LLM (the Manus Forge API, GPT-4o class) for both writing ads and judging them.

**The trade-off I accepted:** Using the same model to generate and evaluate creates a potential bias — the model may be more lenient on its own output than an independent judge would be. The PRD's v2 scope suggests multi-model orchestration as an improvement. I chose single-model for v1 for three reasons:

First, it significantly simplifies the architecture. Multi-model orchestration requires managing multiple API clients, different prompt formats, and reconciling potentially contradictory outputs. For a v1 system, the complexity cost wasn't worth it.

Second, the LLM-as-judge approach works better than I expected. By giving the evaluator a separate system prompt with explicit scoring rubrics and instructions to "be harsh — a 7 means genuinely good, 8+ means excellent, 9-10 is rare," I was able to get calibrated, consistent scores even from the same model that generated the ad. The key insight is that generation and evaluation are genuinely different tasks that activate different capabilities in the model.

Third, the alternative (rules-based evaluation) would have been worse. A keyword-matching or template-based evaluator can't assess emotional resonance or brand voice. The LLM judge, even if slightly biased, is dramatically more capable than any rules-based alternative I could have built.

**What I'd change with more time:** I would implement a separate evaluation model and compare its scores to the generation model's self-evaluation. If they diverge significantly, that's a signal the generation model is being too lenient. This would also unlock the +3 bonus points for multi-model orchestration.

---

## Decision 4: The Self-Healing Strategy — Targeted vs. Full Regeneration

**The core question:** When an ad fails the quality threshold, do you regenerate the whole ad or just fix the weak part?

**What I built:** Targeted regeneration. The evaluator identifies the weakest dimension and writes a specific improvement suggestion. The next generation call receives that suggestion as a targeted instruction: "The previous version scored poorly on Emotional Resonance. Specifically: the primary text is too rational and doesn't connect with the parent's anxiety about college admissions. Fix this while keeping the strong value proposition."

**Why not full regeneration?** Full regeneration is wasteful and often makes things worse. If an ad has a strong value proposition but weak emotional resonance, throwing it all away and starting from scratch risks losing the strong parts. Targeted regeneration preserves what works and fixes what doesn't.

**The failure mode I discovered:** Targeted regeneration can over-correct. If the system is told to improve Emotional Resonance, it sometimes does so at the expense of Clarity or CTA strength. I addressed this by adding "while keeping everything else strong" to the self-healing prompt, but this is still the most common failure pattern in the system. An ad that was a 7.2 overall with a weak 6.0 on Emotional Resonance might become a 7.5 overall after self-healing, but the improvement is not always in the targeted dimension.

**The iteration limit:** I capped self-healing at 5 iterations. After 5 attempts, the system accepts the best result it found, even if it's below threshold. This prevents infinite loops and token waste. In practice, I found that if an ad hasn't reached threshold after 3 iterations, the brief itself is likely the problem — the audience/product/goal combination is too vague or contradictory to produce a strong ad. A human should review the brief.

---

## Decision 5: The Quality Ratchet — How Aggressive to Make It

**What I built:** If the best ad in a run scores 1.5+ points above the current threshold, the threshold rises by 0.25 points, capped at 9.5.

**Why 1.5 points above threshold:** I wanted the ratchet to fire only when the system is genuinely performing well, not on every successful generation. A score of 7.0 (the minimum threshold) doesn't deserve a ratchet. A score of 8.5+ (1.5 above the 7.0 starting threshold) means the system is producing genuinely excellent work and can be held to a higher standard.

**Why 0.25 point increments:** Small increments prevent the ratchet from becoming punishing too quickly. If I had used 0.5 point increments, a few excellent runs could push the threshold to 9.0, at which point the system would struggle to produce passing ads at all. The 0.25 increment means the threshold moves slowly and the system has time to adapt.

**Why cap at 9.5 and not 10.0:** A threshold of 10.0 would be impossible to meet — the evaluator almost never gives perfect scores. 9.5 is ambitious but achievable for genuinely exceptional copy.

**What I'm uncertain about:** The ratchet is a one-way door. Once the threshold rises, it never comes back down. This is intentional — the PRD says "standards only go UP" — but it means a campaign that has a few excellent runs early will face a higher bar for all future runs. Whether this is the right long-term behavior depends on whether the goal is to maintain consistent high quality or to keep improving. I chose the former.

---

## Decision 6: Performance-Per-Token Tracking

**What I built:** Every LLM call records its token usage (prompt tokens + completion tokens). The system estimates cost using GPT-4o-mini pricing ($0.15/1K input, $0.60/1K output). The PerformanceTracker page shows cost per ad, cost per approved ad, and a scatter plot of quality score vs. cost.

**Why this matters:** The PRD's north star metric is "performance per token — how much quality per dollar of API spend." Most ad generation tools ignore this entirely. I wanted to make it visible because it changes how you think about the system. A campaign where you're spending $0.05 per approved ad at 7.5 average quality is better than one where you're spending $0.15 per approved ad at 8.0 quality, depending on your budget constraints.

**The limitation:** My cost estimates are approximations. The actual cost depends on which model is being used, and the Manus Forge API abstracts the underlying model. The estimates are directionally correct but not precise enough to use for actual budget planning.

---

## What Didn't Work

**Attempt 1 — Rules-based quality filtering:** My first instinct was to build a keyword-based filter that would reject ads containing generic phrases like "we have tutors" or "best tutors." This failed immediately because good ads sometimes contain those phrases in context, and bad ads can avoid them while still being terrible. Abandoned after 30 minutes.

**Attempt 2 — Single-prompt generation + evaluation:** I tried combining generation and evaluation into a single LLM call to save tokens. The model would generate an ad and then score it in the same response. The scores were consistently inflated — the model was grading its own work too generously. Separated them into two distinct calls with different system prompts.

**Attempt 3 — Aggressive improvement suggestions:** Early versions of the self-healing prompt gave very prescriptive improvement instructions ("Change the first sentence to start with a question"). This produced ads that followed the instruction literally but lost coherence. Switched to principle-based suggestions ("The primary text needs more emotional urgency — connect with the parent's fear of their child falling behind").

**Attempt 4 — Streaming generation:** I built a streaming version of the generation pipeline so users could watch tokens appear in real time. The streaming worked, but the structured JSON output (required for reliable parsing) is incompatible with streaming in a clean way. The UI shows a live pipeline animation instead, which communicates the same "watch it work" feeling without the parsing complexity.

---

## Where the System Breaks

**Vague briefs produce mediocre ads:** If the audience segment is "people who want tutoring" and the product is "tutoring services," the system will generate technically passing ads (7.0+) that are completely generic. The quality of the output is bounded by the quality of the input brief. The system has no way to detect a bad brief — it just generates the best ad it can for whatever it's given.

**The evaluator can be gamed:** Because the same model generates and evaluates, a clever generation prompt can produce ads that score well on the evaluation rubric without being genuinely good ads. I mitigated this with harsh scoring instructions, but it's a real limitation. An independent human evaluation of a sample of "approved" ads would likely find some that scored 7.5+ but wouldn't actually perform well in a real campaign.

**Emotional Resonance scoring is inconsistent:** Of the five dimensions, Emotional Resonance has the highest variance in scores across runs. The same ad can score 6.5 on one evaluation and 7.8 on another. This is because emotional resonance is genuinely subjective, and the LLM's assessment varies with context. I haven't found a good solution to this.

**The quality ratchet has no memory of why it ratcheted:** If the threshold rises to 7.5 because of a few excellent runs, and then the campaign brief changes to target a harder audience, the system will struggle to meet the higher threshold without any awareness of why it was raised. A smarter ratchet would track the conditions under which it ratcheted and be more conservative about raising the bar for campaigns with harder briefs.

**No real reference ad calibration:** The PRD mentions that real Varsity Tutors ads and performance data would be provided via the Gauntlet/Nerdy Slack channel. I built the evaluation framework without access to those reference ads. The scoring rubric is based on general Meta ad best practices and the brand context in the PRD, not on calibration against actual high-performing Varsity Tutors ads. This is probably the biggest gap in the evaluation quality.

---

## What I'd Do Differently

**With one more week:** I would implement the Meta Ad Library competitive intelligence feature. Pulling real competitor ads from Princeton Review, Khan Academy, Chegg, and Kaplan and analyzing their patterns would dramatically improve the quality of the generation prompts. The best ad systems don't invent new formats — they study what works and iterate on it.

**With one more month:** I would build a proper multi-agent architecture where a researcher agent gathers competitor intelligence and audience insights, a writer agent generates copy, an editor agent refines it, and an evaluator agent scores it. Each agent would have a specialized prompt and potentially a different underlying model. The current single-pipeline architecture works well but doesn't scale to the complexity of a real production ad engine.

**The thing I'm most proud of:** The iteration log. Every time the system rewrites an ad, it records exactly what it was trying to fix, what the score was before, and what it became after. This creates a traceable history of improvement that you can actually learn from. Most AI tools are black boxes. This one shows its work.

---

## Honest Assessment of the System

This system does what the PRD asked: it generates ads, evaluates them with structured scoring, self-heals when quality falls below threshold, and tracks improvement over time. The quality ratchet and performance-per-token tracking are genuine additions beyond the minimum requirements.

The system is not production-ready. It lacks reference ad calibration, the emotional resonance scoring is inconsistent, and the evaluation model is the same as the generation model. A production system would need human review of a sample of approved ads to validate that the LLM judge's scores correlate with actual campaign performance.

But as a proof of concept for autonomous ad generation with measurable quality improvement, it works. The iteration logs show real improvement across cycles. The quality ratchet is doing what it's supposed to do. And the performance-per-token tracking makes the cost of quality visible in a way that most ad tools don't.
