# Brand System UI Audit — Step 9

## 1. Audit date
- 2026-05-13

## 2. Current branch
- `work` in this workspace. The requested sprint branch was `stable-good-ui`; this checkout reports `work`, so changes were made on the current checked-out branch per environment state.

## 3. Files inspected
- `app/(tabs)/index.tsx`
- `app/(tabs)/career.tsx`
- `app/(tabs)/gamemode.tsx`
- `app/(tabs)/locker.tsx`
- `app/(tabs)/profile.tsx`
- `app/lesson/[id].tsx`
- `app/upgrade.tsx`
- `components/ClutchrHeader.tsx`
- `components/ClutchrLogo.tsx`
- `components/EmblemBadge.tsx`
- `components/CompletionInteraction.tsx`
- `components/MyPlaybook.tsx`
- `components/ToolShelfModal.tsx`
- `components/MarkdownRenderer.tsx`
- `constants/theme.ts`
- `lib/progressionRanks.ts`
- `context/AthleteContext.tsx`
- `brand/CLUTCHR_BRAND_BIBLE_v1.md`
- `assets/`
- Product audits in `product/` from earlier sprint steps.

## 4. Brand source summary
- Source direction combines the selected identity sheet, Coach Cap sheet, and `brand/CLUTCHR_BRAND_BIBLE_v1.md`.
- Core visual lane: dark premium baseball operating system; sharp typography; restrained Kelly Green action/progress/success; gold only for earned/premium/rank; purple only for intentional utility/reset/advanced states; red only for caution/wrong.
- Primary mark direction: angular Clutchr C-mark. Wordmark direction: `CLUTCHR` with the terminal `R` accented green. Secondary mark direction: plate/three-stripe geometry for rank, progression, and baseball identity.
- Voice direction: short, direct, baseball-native, serious, and useful. Coach Cap should add identity through guidance moments, not mascot overload.

## 5. Current UI consistency findings
- The app already had a stable dark UI and several strong signature surfaces: Home Next Rep, Career climb, Game Mode tools, and completion payoff.
- Green, gold, orange, blue, and purple were generally meaningful, but the central theme still used the older `#22CC5E` green instead of the selected `#00FF66` identity green.
- Header language had converged in several screens through `ClutchrHeader`, but Home still used a standalone text wordmark and Locker used confusing `C / LOCKER` kicker language.
- Many cards already shared dark surfaces, rounded corners, and border treatments. The main risk was random-but-close dark values rather than behavior or structure.

## 6. Header findings
- `ClutchrHeader` is the correct controlled system for top-level tabs and lesson flows.
- Career, Game Mode, Locker, Profile, and Lesson Player already use the shared header component.
- Home intentionally remains custom because it has a command-dashboard layout, but its wordmark needed to match the selected identity treatment.
- Upgrade is a modal/paywall flow with its own top bar; it should stay distinct but keep gold/premium semantics.

## 7. Button findings
- Primary CTAs are already mostly green-filled: Start Next Rep, Continue Career, completion advance, drill actions.
- Secondary CTAs are mostly dark/outline: Open Playbook, back actions, restore/fine-print actions.
- Premium/Pro uses gold in Upgrade. This aligns with the brand rule that gold is earned/premium/rank only.
- Completion interaction still used older green literals and was updated to theme tokens so Finish/Complete interactions stay aligned with the brand palette.

## 8. Card/surface findings
- Home Next Rep, Game Mode panels, Profile identity cards, and lesson completion payoff use strong card hierarchy.
- Career cards intentionally use phase colors, including orange for The Grind/body/recovery; this should remain because it is semantically intentional.
- Several components still contain local hard-coded surfaces. A full refactor was intentionally deferred to avoid random redesign risk.
- Theme tokens were tightened so new and touched surfaces have a clearer source of truth.

## 9. Typography findings
- Headline direction is already bold, high-contrast, and athletic.
- Section labels are generally uppercase with letter spacing, which matches the selected identity direction.
- Home and shared headers now have a more consistent wordmark treatment.
- Locker internal language was clarified without changing the bottom-nav label.

## 10. Icon/accent findings
- Icons generally map to intent: flash for Game Mode/XP, books for Locker, rank shield/plate language for identity.
- The previous Home wordmark had no green `R` accent, and the header C-mark was a plain text `C`. These were tightened using repo-native vector/text components rather than adding unsafe screenshot assets.
- No full contact-sheet screenshots were wired as production assets.

## 11. Coach Cap usage findings
- Completion already had a restrained `CC` payoff treatment and `CC'S TAKE`, which fits the brand direction.
- Profile had a useful Player OS surface where a small guide callout could add identity without mascot overload.
- No app-ready Coach Cap image asset exists in the repo, so this pass used a small `CC` badge/cap fallback instead of importing or cropping brand-sheet images.

## 12. Screen-by-screen consistency notes
- Home: preserved layout and Next Rep hero; swapped the plain text brand for the reusable wordmark with green `R`.
- Career: preserved world visibility, tabs, XP, and climb behavior; benefits from shared header token updates.
- Game Mode: preserved Pre/Live/Post, Pregame/Postgame, Rapid Rep, and tool behavior; benefits from shared header and theme token updates.
- Locker: bottom nav remains Locker; screen header now says `Locker` with `/ RESOURCES` language to clarify internal resource/tool purpose.
- Profile: preserved rank/emblem/Player OS structure; added a small Coach Cap guide callout.
- Lesson Player: preserved lesson logic, audio, answer/completion behavior, and fallback paths; completion/payoff surfaces benefit from token alignment.
- Upgrade: preserved pricing/paywall placeholder behavior and premium gold hierarchy.

## 13. Safe changes made
- Tightened `constants/theme.ts` around the selected palette, semantic accent roles, surfaces, button tokens, card tokens, and typography section-label helper.
- Rebuilt `components/ClutchrLogo.tsx` as a repo-native wordmark/C-mark treatment instead of using image screenshots.
- Updated `components/ClutchrHeader.tsx` to use theme-driven brand color values and the angular C-mark component.
- Updated Home to use the shared wordmark treatment.
- Updated Locker header language to `Locker` with `/ RESOURCES`.
- Updated completion interaction button colors/borders to use theme tokens.
- Added a restrained Coach Cap guide callout to Profile.

## 14. Asset integration status
- No app-ready `assets/brand` production assets were present.
- Existing assets were limited to app icons/splash plus `volt` images; none matched the selected Clutchr mark/wordmark/Coach Cap production needs.
- No contact-sheet screenshots were imported or wired.
- Current mark/wordmark usage is vector/text-based and safe for production until final brand PNG/SVG assets are supplied.

## 15. Deferred brand asset needs
Recommended production assets to add later, individually exported and optimized:
- `assets/brand/clutchr-mark.png` or SVG-compatible component
- `assets/brand/clutchr-wordmark.png` or SVG-compatible component
- `assets/brand/plate-mark.png`
- `assets/brand/coach-cap-tip.png`
- `assets/brand/coach-cap-completion.png`
- `assets/brand/plate-watermark.png`
- App icon foreground/background exports matching the selected dark textured square and C-mark direction

## 16. Future App Store screenshot prep notes
- Do not build screenshot files in the app codebase until the screenshot story is locked.
- Strong candidate screenshot beats: Home Next Rep, Career climb, Game Mode Pre/Live/Post, Rapid Rep drill, completion payoff with CC's Take, Player OS/Profile, Locker/Resources, Upgrade/Pro.
- Before screenshot capture, add final production mark/wordmark/Coach Cap assets, verify safe-area spacing on target iPhone sizes, and freeze demo account state.
- Screenshot copy should stay short and use brand taglines such as `Train. Track. Clutch.` or `Prepare. Compete. Reset.` outside the app UI, not as extra in-app clutter.

## 17. QA checklist
- Open Home and confirm the screen still feels like the same screen, just more branded/consistent.
- Confirm Home Next Rep still routes to the selected lesson.
- Open Career and confirm current worlds/tabs remain intact and all 30 worlds are not exposed.
- Open Game Mode and confirm Pre/Live/Post, Pregame/Postgame, and Rapid Rep still work.
- Open a Rapid Rep drill and confirm choices, result state, Run It Back, and Back to Game Mode still work.
- Open a lesson and confirm lesson player header, content, audio, interactions, and finish/complete behavior still work.
- Complete a lesson and confirm XP/rank/replay behavior and Continue Career/Open Playbook routes still work.
- Open Profile and confirm rank/emblem/Player OS plus the small Coach Cap callout render correctly.
- Open Locker and confirm bottom nav still says Locker while the screen language reads clearly as resources/tools.
- Open Upgrade/Signal and confirm gold premium treatment remains consistent and subscription placeholders are unchanged.
- Confirm no crashes or console errors in Expo Go.
