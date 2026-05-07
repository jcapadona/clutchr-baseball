# Clutchr Baseball Badge Touchpoint Map

**Step:** 14 — tie rewards into actual surfaces  
**Controlling source:** `brand/CLUTCHR_BRAND_BIBLE_v1.md`  
**Reward system:** Emblem/rank MVP using `EmblemBadge` and the shared rank helpers.  
**Current rank set:** Foundation, Built, Locked In, Command, Elite.

## Surface Principles

- Badges should feel premium, earned, and baseball-native — not childish decoration.
- Profile is the primary identity home for the rank emblem.
- Lesson completion is the primary feedback moment for rank progress.
- Home should show only a compact progress signal; the header logo row must stay clean.
- Future celebratory surfaces should stay restrained: no confetti, no mascot spam, and no retired mascot references.
- All implementation should reuse `EmblemBadge` and shared progression helpers instead of duplicating rank logic.

## Touchpoint Map

| Touchpoint | Purpose | Priority | Badge size | Behavior | Implementation status | Notes |
|---|---|---:|---|---|---|---|
| Profile | Primary badge identity surface; lets the athlete see their rank as part of their player OS. | High | Medium | Static | MVP now | Keep `EmblemBadge` in the identity card. Use the full rank name, especially “Locked In,” to avoid “Locked” / “Locked In” confusion. Progress to next rank should remain readable beneath the identity row. |
| Lesson completion | Immediate post-rep progress feedback after XP is awarded. | High | Small | Subtle | MVP now | Keep a Rank Progress card. Copy should stay direct: “Rank progress moved. 3,143 XP to Command.” Use restrained progress animation already tied to completion; no confetti or childish effects. |
| Home progress | Compact daily progress signal without crowding the brand header. | High | Small | Static | MVP now | Header top row should stay logo/brand + streak + XP only. Rank/emblem belongs in a compact Current Rank / progress module near the Continue Career card. |
| Career overview | Reinforce long-term path progression and rank context across worlds. | Medium | Small or medium | Static | Later | Defer until the career surface has a deliberate rank placement. Do not add a large emblem to crowded world/timeline headers. |
| World completion | Mark meaningful completion moments without over-celebrating. | Medium | Medium | Subtle/celebratory | Later | Use a restrained badge moment only when a world is completed or rank movement is relevant. Avoid confetti; consider a composed card, glow, or earned-stamp treatment. |
| Milestone screens | Recognize major XP/rank milestones and season achievements. | Medium | Medium or large | Subtle/celebratory | Later | Reserved for explicit milestone surfaces. Behavior should feel premium and earned, not arcade-like. |
| App Store marketing visuals | Communicate the progression system externally. | Low | Large in composed marketing layout | Static | Later | Use badges as visual proof of progression in screenshots or promo art. Keep copy baseball-first and credible for parents/coaches. |
| Coach Cap / CC’s Take moments | Add personality and coaching context around earned progress. | Low | Small accent only if needed | Static/subtle | Later | Badge should not compete with CC’s Take. If used, keep it as a supporting accent tied to a coaching insight, not a mascot-heavy reward moment. |

## MVP Decisions

- **Kept now:** Profile badge identity, Lesson completion rank progress, Home compact progress signal.
- **Removed now:** Oversized or crowded rank chip from the Home header/logo row.
- **Deferred:** Career overview, World completion, Milestone screens, App Store marketing visuals, Coach Cap / CC’s Take badge moments.
