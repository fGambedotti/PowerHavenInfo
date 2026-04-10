# Power Haven — Codex Master Brief (Small Website, 10x Clarity)
## Version 1.0 · April 2026

---

## 1) Mission of This Website
Build a small, exceptionally polished public website for Power Haven.

This page has two jobs only:
1. Help UK datacentre operators immediately understand the value proposition.
2. Make serious people (clients and potential team members) want to start a conversation.

Do not build a “startup marketing page.” Build a calm, high-trust product narrative.

---

## 2) Company Positioning (Use This Exactly)
Power Haven helps UK datacentres under grid capacity pressure reduce risk, cut waiting times, and operate more profitably.

VoltPilot is demand-management software that:
- Optimises energy usage and site flexibility.
- Integrates site assets into flexibility markets.
- Aligns operations with UK grid and regulatory requirements.

Primary benefit: faster and more viable grid connection pathway.
Secondary benefit: recurring flexibility revenue and improved operating performance.

---

## 3) Audience Priorities
Primary audience: UK datacentre operators and infrastructure decision-makers.
Secondary audience: prospective hires and technical collaborators.

The page must answer these questions in under 15 seconds:
1. What do you do?
2. Why does it matter now?
3. Why should I trust you?
4. What should I do next?

---

## 4) Design Direction (Apple WWDC-Inspired)
Reference feeling: Apple WWDC presentation aesthetics.
Not literal Apple cloning. Capture the principles:
- Soft depth
- Precise typography
- Air and spacing
- Elegant hierarchy
- Restraint

### Visual language
- Backgrounds: deep desaturated blue-charcoal + soft neutral layers.
- Surfaces: translucent/soft panels with subtle blur and inner stroke.
- Corners: rounded, consistent radius scale.
- Shadows: broad, low-opacity, feathered shadows (no harsh drops).
- Shapes: clean geometry, no decorative clutter.
- Motion: minimal, smooth, purpose-driven.

### Tone
- Quiet confidence.
- No hype words (e.g. “revolutionary”, “world-class”, “game-changing”).
- Numbers and outcomes over adjectives.

---

## 5) Site Scope (Keep It Small)
Single-page site with five sections only:

1. Hero
2. Vision + Problem Context
3. Product (How VoltPilot Works)
4. Trust (Affiliations + Team)
5. Contact CTA

No blog. No pricing grid. No secondary pages.
No popups, newsletters, chat widgets, or growth hacks.

---

## 6) Information Architecture + Copy Intent

### Section 1 — Hero
Purpose: clarity in one glance.

- Eyebrow: `VoltPilot by Power Haven`
- Headline: `Turn datacentre energy constraints into grid advantage.`
- Subheadline: One sentence, plain English, max 22 words.
- Primary CTA button: `Request Early Access`
- Secondary text link: `See how it works →`

Add one compact proof row directly below CTA:
- `UCL Energy Institute`
- `Mentored by Siemens Energy`

### Section 2 — Vision + Problem Context
Purpose: show urgency without melodrama.

Structure:
- One key macro stat callout (large type).
- One short paragraph on UK grid pressure and datacentre growth.
- One short paragraph on why flexibility is the practical path now.

Design note: keep text width to ~65 characters and break long thoughts into small blocks.

### Section 3 — Product (VoltPilot)
Purpose: show concrete mechanism, not generic claims.

Three capability blocks:
1. **Measure Flexibility**
2. **Optimise Dispatch**
3. **Support Compliance Pathways**

Each block:
- line icon (Lucide, stroke 1.5)
- short heading
- two-sentence explanation

Include one compact “live-style” visual panel with:
- a simple market line chart
- one “current value” tile
- one “potential annual range” tile

No fake metrics. If a value is illustrative, label it clearly.

### Section 4 — Trust
Purpose: answer “why trust this team?”

Subsections:
- Affiliation strip: UCL, Siemens Energy (logo marks or high-quality wordmarks)
- Team mini-cards (3 cards max): name, role, one credibility line
- Short founder quote in a clean block

### Section 5 — Contact CTA
Purpose: one clear action.

- Headline: direct and low-friction
- Short helper text (“30-minute intro”, “no obligation”, etc.)
- Minimal form fields:
  - Name
  - Organisation
  - Email
  - Message (optional)
- Submit button with success state

---

## 7) Interaction Design (Subtle + Useful)
Use motion only where it adds comprehension.

Required interactions:
- Fade-up on section reveal (small offset, 450–500ms).
- Button hover: slight scale + tone shift.
- Card hover: faint border glow and lift.
- Tooltip support where needed (e.g., on chart points or glossary terms like ANM).

Do not animate backgrounds continuously.
Do not use flashy parallax.

---

## 8) Visual System (Practical Tokens)
Define tokens before implementing components.

Suggested base tokens:
- `--bg-base`: deep charcoal-blue
- `--bg-surface`: elevated panel tone
- `--text-primary`: near-white
- `--text-secondary`: muted slate
- `--accent-primary`: cool cyan-mint
- `--border-soft`: low-contrast stroke
- `--shadow-soft`: broad low-opacity shadow

Rule: one primary accent only. Use it sparingly.

---

## 9) Technical Constraints
- Next.js (App Router), TypeScript, Tailwind.
- Fonts via `next/font`.
- `next/image` for all raster images.
- British English spelling throughout.
- Strong accessibility defaults:
  - keyboard focus visible
  - semantic headings
  - labelled form controls
  - contrast checked

Target outcome:
- fast first load
- mobile-first layout
- polished desktop presentation

---

## 10) Build Quality Bar
The site is complete only when all are true:
- Message is understandable in 10 seconds.
- Visual style feels premium but not busy.
- Every section has one clear purpose.
- CTA path is obvious and singular.
- Trust signals are visible before contact.
- Mobile layout feels intentionally designed, not collapsed desktop.

---

## 11) What Not to Do
- No gradient noise, no random glowing blobs.
- No “AI SaaS template” card spam.
- No long wall-of-text sections.
- No unverifiable performance claims.
- No over-animated UI.

---

## 12) Implementation Plan for Codex
1. Create base design tokens and typography scale.
2. Build section scaffolding with final IA.
3. Implement hero + CTA + trust row.
4. Implement product explanation + lightweight data panel.
5. Implement trust section (affiliations + team + quote).
6. Implement contact form + success state.
7. Polish motion/accessibility/performance.
8. Final pass: copy tightening for brevity and clarity.

---

## 13) Success Criteria (Business)
After launch, a qualified visitor should:
- Understand what Power Haven does without technical translation.
- Recognise credible institutional grounding (UCL, Siemens).
- Feel this is a serious, design-mature technical company.
- Know exactly how to get in touch.

