Codex Implementation Prompt

Patch Snapshot Read+ Add Film Room Safely

How to Use This Prompt

 Paste the full prompt below into Codex/Claude Code from a clean branch. The goal is not to import content yet. The goal is to make visual steps safe, renderable, and validated.

Prompt

You are working in the Clutchr Baseball repo.

TASK:

Patch and upgrade the visual learning layer: Snapshot Read( snapshot read)and$$\text{ new Film Room(`film room`). Do not}$$generate large content packs yet. First make the app schema-safe, playable, and resilient.

PRODUCT CONTEXT:

Clutchr Baseball is a baseball-first career-path operating system. Lessons must feel like playable baseball reps, not lectures, quizzes, courses, or generic sports psychology. Snapshot Read is still-image/freeze-frame analysis. Film Room is video analysis. Both can appear as standalone lessons, steps inside larger lessons, checkpoints, or boss support moments.

CURRENT KNOWN TRUTH:

- snapshot read already exists and should be repaired/upgraded, not replaced blindly.

- Existing Snapshot Read content may be broken because rows can lack image_uri, question, choices/cues, correct answers, or answers, or feedback.

- Current Snapshot Read appears to grade from each cue's quality field, while content and may'responses.correct_id' and'acceptable_ids'.

- Unsupported`ui_variant' content is dangerous because it can render a blank step.

- Live code wins over docs. Inspect current files before changing anything.

FILES TO INSPECT FIRST:

- app/lesson/[id].tsx

- components/SnapshotRead.tsx

- components/lesson-steps/* if variants live there

- any VariantRenderer file or variant switch inside lesson player player

- lib/supabase.ts

- lib/lessonRouter.ts

- current accepted step type/ ui_variant validation SQL if present

- any recently added OneWordLock, DiamondCursor, DragSequence components patterns

 PHASE 1- SAFETY PATCHES:

1. Add or verify a safe unsupported-ui-variant fallback. Unknown`ui_variant` must never return null or blank the lesson.

2. Add missing-data fallback for known variants. If snapshot_read data is malformed, show a clear card:"This rep an update." Include a safe continue/skip path.

3. Ensure malformed visual steps do not trigger accidental completion/mastery.

4. Add development logging for malformed visual steps without exposing stack traces to athletes.

5. Keep existing lesson completion, XP, checkpoint, and boss logic unchanged unless a bug is directly tied to visual steps.to steps.

PHASE 2- SNAPSHOT READ CONTRACT:

Normalize Snapshot Read to support this data shape:

...ts

 export type SnapshotCueQuality='correct'|'acceptable'|'poor';

export type SnapshotCue={

id: string;

label: string;

description?: string;

quality?: SnapshotCueQuality;

};

export type SnapshotReadData={

prompt?: string;

situation: string;

cue_description?: string;

image uri?: string;

diagram_mode?:'pitcher_delivery'|'hand_break'|'release_point'|'batter_stance'|'field_map'|'runner_read';overlay_labels?: Array  $<\{$  id: string; label: string; x: number; y: number  $\}>$  ;

cues: SnapshotCue[];

question: string;

\};

export type SnapshotResponses={

correct_id?: string;

acceptable_ids?: string[];

\};

export type SnapshotFeedback={

correct?: string;

acceptable?: string;

wrong?: string;

};

Grading rule:

- Primary: use cue.quality if present.

- Secondary fallback: if cue.quality missing, derive quality from responses.correct id/ acceptable ids.

- If neither exists, mark cue as poor and show malformed content warning in dev.

UI requirements:

- Display data.prompt when present.

- Display data.situation compactly.

- Display image when image_uri exists.

- If image missing but diagram mode exists, render diagram placeholder/fallback.

- If both image and diagram missing, render a premium placeholder card but keep the step playable.

- Show selected answer feedback immediately.

- Correct and acceptable answers can advance.

- Poor answers show feedback and Try Again.

- Never use generic button text like Submit. Prefer"Check Read","Try Again","Finish Rep", or existing app language.

PHASE 3- FILM ROOM COMPONENT:

Add new supported`ui_variant':`film_room'.

Film Room purpose:

- Watch clip.

- Analyze one baseball decision/read.

- Answer one interpretation question.

- Receive Coach Cap-style breakdown.

- End with one sharp takeaway.

- No default save-cue/apply-cue flow.

Suggested data contract:

...ts

 export type FilmRoomProvider='youtube'|'external_video'|'mlb'|'ncaa'|'hosted';

export type FilmRoomChoice={

id: string;

label: string;

quality?:'correct'|'acceptable'|'poor';

};

export type FilmRoomData={

provider: FilmRoomProvider;

youtube_id?: string| null;

canonical_url: string;

fallback_url?: string;

backup_urls?: string[];

start_sec?: number;

end_sec?: number;

reliability_rating?:'A'|'B'|'C'|'A/B'

event?: string;

year?: number;

athletes?: string;

setup: string;

question: string;

choices: FilmRoomChoice[];

coach_breakdown: string;

takeaway: string;

};

Playback rules:

- If youtube_id exists, use embedded YouTube player if available in the repo$$\text{ or add}\text{ react-native-youtube-iframe}\text{ if}$$project patterns allow.

- If no youtube_id, use a WebView/external link card for canonical_url.

- Always show fallback button:"Open Video".

- If embed fails, the lesson must still allow answer and completion after showing fallback instructions.

- Start/end timestamps should be respected for YouTube embeds when possible. For external URLs, show timestamp$$\text{ text}$$$$\text{ to}$$athlete.

- Do not auto-award success the clip opened. Athlete must answer must answer the Film Room question.

PHASE 4- VARIANT REGISTRY/ VALIDATION:

- Add‘film_room’ to supported ui_variant registry.

- Add snapshot read and film room to any accepted Supabase constraints or validation SQL if applicable.

- Add content validator script if the repo has a scripts directory,or create a simple'scripts/validate-lesson-visual-steps.ts if appropriate.

- Validator should flag:

- unknown ui_variant

- snapshot_read missing cues/question/situation

- snapshot_read snapshot_read cues missing id/label/quality or missing responses fallback

- film_room missing canonical_url/question/choices/coach_breakdown/takeaway

- film_room with no fallback_url or backup_urls

- any visual step with generic question such as and no cue lens

 PHASE 5- TEST DATA ONLY:

Add no more than two local/sample lessons if needed:

1. one snapshot_read sample using diagram fallback

2. one film_room sample using a safe external URL placeholder or known official URL

 Do not import the full 25/25 content pack yet.

ACCEPTANCE TESTS:

- Existing lesson types still

- Existing snapshot_read rows render even when image_uri missing.

- Missing question/cues produces safe fallback, not blank screen.

- Unknown ui_variant produces safe fallback, not blank screen.

- film_room renders embedded video when possible.

-film_room renders Open Video fallback when embedding is blocked.

- film_room answer feedback works.

- Correct/acceptable visual answers can advance; poor answers retry.

-No XP/checkpoint/boss logic regression.

- TypeScript passes.

- Lint passes if project lint exists.

-‘git diff--check passes.

OUTPUT EXPECTED:

1. Summary of files changed.

2. Confirmation of supported variants updated.

3. Validation command(s) run.

4. Notes on whether Film Room embed uses YouTube iframe, WebView, or external-link fallback.

5. Any remaining risks before importing content.

Post-Codex Review Checklist

.Run app and manually open one existing Snapshot Read row with missing image.

.Open malformed visual sample and confirm safe fallback renders.

.Open Film Room sample and test embed+ Open Video fallback.

.Run TypeScript/lint/diff-check.

.Commit only after safe fallback behavior is confirmed.
