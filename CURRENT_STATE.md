# CLUTCHR — CURRENT-STATE README
Per the Execution Roadmap doc's Tier 2 template. Supersedes all prior
status snapshots, including the "Aug 2026 Current-State Intelligence
Report," on every point where they conflict — everything below is either
directly observed in this session or confirmed by Jon in real time.

**Update this after every major sprint. Keep it under 3 pages. Link commit
hashes as they happen.**

---

## Branch / build environment
- Latest confirmed commits: BUG-012 (identity linking), BUG-013 (RevenueCat
  init race), BUG-014 (entitlement key fix, `PRO_ENTITLEMENT_ID = 'Clutchr
  Pro'`), plus paywall bug fixes (stale $39.99, hardcoded savings %) in
  progress as of this session.
- Both local (`npx expo run:ios` — currently blocked by a CocoaPods/Ruby
  toolchain issue on this Mac, unresolved, not urgent) and EAS cloud builds
  are in use. EAS is the reliable path for anything needing a real purchase
  test.

## Active sprint
**Sprint 3 (Sandbox Payments QA) — verified closed on the Pro side.**
Real sandbox purchase confirmed unlocking Career/Game Mode/Locker/Playbook
on-device. **One item still open:** free-tier (non-Pro) verification on
the second test account (`8e459ce5...`) has not been re-confirmed since
the BUG-014 fix landed. Small, low-risk, but technically still open.

**Sprint 4 (Home hero card) — prep complete, implementation not started.**
Full build brief, 6-session Claude Code prompt pack, image generation
prompts, and QA tracker all exist and are ready. A strong full-screen
mockup was generated and approved as a visual reference. No Claude Code
session for Sprint 4 has actually been run yet — this is genuinely next,
not yet in progress, matching the "one active sprint" rule (Sprint 3's
last item should close before Sprint 4 code starts).

**Sprints 5–9** — briefed only (build briefs + trackers exist), zero
implementation.

## Open P0 / P1
- **P1 (in progress this session):** Paywall audit — stale $39.99 pricing,
  incorrect "Save %" math, unclear "THAT'S YOU" tag, sticky-CTA layout
  change pending a plan review. Claude Code session dispatched, results
  not yet confirmed.
- **P2 (not urgent):** Assessment quiz prototype uses "Summative
  Assessment / Question 1/6" language — flagged by the Aug 2026 synthesis
  as a voice conflict with the brand's anti-quiz/anti-classroom standard.
  Needs reframing (Checkpoint / Coach Cap Review) before any real content
  uses that pattern. Not blocking anything currently.
- **P2:** `dev-qa.tsx` route exists in the production bundle, inert but
  unnecessary. Post-launch cleanup.

## Current navigation (confirmed via live screenshots, not documents)
Five tabs: **Home, Career, Game Mode, Locker, Profile.** This supersedes
any older two-screen (Home + Profile) product documents — those describe
an earlier product shape, not the live app.

## Payment/monetization status
- RevenueCat project: **"Clutchr" (109d6f93)** is correct/active. **"Clutchr
  Baseball" (468254ab)** is an unused duplicate — ignore, clean up later.
- Real product IDs: `com.clutchr.baseball.sub.monthly` ($9.99),
  `com.clutchr.baseball.sub.annual` ($59.99).
- Entitlement identifier is **`Clutchr Pro`** (capital, with a space) —
  not `pro`. This was the root cause of the multi-day BUG-012/013/014
  saga and is now the single source of truth in `ProContext.tsx`.
- **The $39.99 "founder annual" price is a marketing offer concept only —
  not a configured product/offer in App Store Connect or RevenueCat.**
  Confirmed matching the Aug 2026 synthesis's own caution on this point.
  Do not reference it in live paywall copy until it's actually built as a
  real offer.

## Known schema/content risks (flagged by synthesis, not yet independently verified against live Supabase)
- Locker taxonomy: confirmed real via direct SQL query earlier in Sprint 3
  — 278 cards, 15 categories across 2 incompatible naming systems, UI tabs
  driven by fuzzy token-scoring rather than `content_category`. A full,
  tested migration script now exists (not yet run against production).
- `resource_group` column referenced in code does not exist in Supabase —
  confirmed dead code.
- 858-lesson count shown in Career UI has not been quality-audited. Per
  the synthesis's own recommendation, treat "quantity" as unverified until
  a sampled QA pass runs.

## Documents authoritative for current work
- This README (supersedes the Aug 2026 Current-State report on every
  point above)
- Sprint 3 QA Tracker / Bug Triage Board (payments)
- Sprint 4 Build Brief + Prompt Pack (next up)
- Locker taxonomy migration SQL (ready, not yet run)

## Exact next session
**Confirm the paywall audit results, then do the free-tier re-check on
the second test account. Once both are done, Sprint 3 is closed with zero
caveats — then Sprint 4 Session 1 (hero card reconnaissance) starts.**
