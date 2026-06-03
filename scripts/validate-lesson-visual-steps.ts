/**
 * Validate visual lesson steps (snapshot_read and film_room) in the Supabase
 * legacy_lessons_staging table.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/validate-lesson-visual-steps.ts
 *
 * Or point to a local JSON fixture:
 *   FIXTURE=./scripts/fixtures/sample-lessons.json npx ts-node scripts/validate-lesson-visual-steps.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types (minimal, mirrors lesson step schema) ───────────────────────────────

interface Step {
  type?: string;
  ui_variant?: string;
  data?: Record<string, any>;
  responses?: Record<string, any>;
  feedback?: Record<string, any>;
  [key: string]: any;
}

interface Lesson {
  id?: string;
  legacy_lesson_id?: string;
  title?: string;
  steps?: Step[];
}

// ─── Validation flags ─────────────────────────────────────────────────────────

const SUPPORTED_UI_VARIANTS = new Set([
  'strike_zone_visualizer',
  'pitch_sequence_chess',
  'field_iq_board',
  'throw_decision_board',
  'leverage_ladder',
  'routine_card_builder',
  'pressure_replay',
  'snapshot_read',
  'jump_read',
  'timing_track',
  'confidence_slider',
  'pitch_count_board',
  'diamond_cursor',
  'film_room',
]);

const GENERIC_QUESTIONS = new Set([
  'what do you notice?',
  'what do you see?',
  'what happened?',
  'what is this?',
]);

interface Violation {
  lesson: string;
  stepIndex: number;
  field: string;
  message: string;
}

function flagGenericQuestion(q: string): boolean {
  return GENERIC_QUESTIONS.has((q ?? '').toLowerCase().trim());
}

function validateSnapshotRead(step: Step, stepIndex: number, lessonLabel: string): Violation[] {
  const violations: Violation[] = [];
  const data = step.data ?? step;
  const responses = step.responses ?? {};
  const flag = (field: string, message: string) =>
    violations.push({ lesson: lessonLabel, stepIndex, field, message });

  if (!data.situation && !data.prompt) {
    flag('data.situation', 'snapshot_read is missing both situation and prompt');
  }
  if (!data.cues || !Array.isArray(data.cues) || data.cues.length === 0) {
    flag('data.cues', 'snapshot_read has no cues array or empty cues');
    return violations; // can't validate further without cues
  }
  if (!data.question) {
    flag('data.question', 'snapshot_read is missing question');
  } else if (flagGenericQuestion(data.question)) {
    flag('data.question', `snapshot_read question is too generic: "${data.question}" — needs a specific cue lens`);
  }

  for (const [i, cue] of (data.cues as any[]).entries()) {
    if (!cue.id) flag(`data.cues[${i}].id`, 'cue missing id');
    if (!cue.label) flag(`data.cues[${i}].label`, 'cue missing label');
    const hasQuality = !!cue.quality;
    const hasResponsesFallback =
      responses.correct_id === cue.id ||
      (Array.isArray(responses.acceptable_ids) && responses.acceptable_ids.includes(cue.id));
    if (!hasQuality && !hasResponsesFallback) {
      flag(
        `data.cues[${i}]`,
        `cue "${cue.id ?? i}" has no quality and is not listed in responses.correct_id or acceptable_ids`,
      );
    }
  }

  return violations;
}

function validateFilmRoom(step: Step, stepIndex: number, lessonLabel: string): Violation[] {
  const violations: Violation[] = [];
  const data = step.data ?? step;
  const flag = (field: string, message: string) =>
    violations.push({ lesson: lessonLabel, stepIndex, field, message });

  if (!data.canonical_url && !data.youtube_id && !data.fallback_url) {
    flag('data.canonical_url', 'film_room has no canonical_url, youtube_id, or fallback_url');
  }
  if (!data.fallback_url && (!Array.isArray(data.backup_urls) || data.backup_urls.length === 0)) {
    flag('data.fallback_url', 'film_room has no fallback_url or backup_urls — video unavailability leaves step unplayable');
  }
  if (!data.question && !data.prompt) {
    flag('data.question', 'film_room is missing question');
  } else if (flagGenericQuestion(data.question ?? data.prompt ?? '')) {
    flag('data.question', `film_room question is too generic: "${data.question ?? data.prompt}"`);
  }
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    flag('data.choices', 'film_room has no choices');
  }
  if (!data.coach_breakdown && !data.coach_feedback) {
    flag('data.coach_breakdown', 'film_room is missing coach_breakdown (and no legacy coach_feedback fallback)');
  }
  if (!data.takeaway) {
    flag('data.takeaway', 'film_room is missing takeaway');
  }

  return violations;
}

function validateStep(step: Step, stepIndex: number, lessonLabel: string): Violation[] {
  const variant = step.ui_variant;
  const type = step.type;

  if (variant) {
    if (!SUPPORTED_UI_VARIANTS.has(variant)) {
      return [{
        lesson: lessonLabel,
        stepIndex,
        field: 'ui_variant',
        message: `Unknown ui_variant "${variant}" — will render fallback card in the lesson player`,
      }];
    }
    if (variant === 'snapshot_read') return validateSnapshotRead(step, stepIndex, lessonLabel);
    if (variant === 'film_room')     return validateFilmRoom(step, stepIndex, lessonLabel);
    return [];
  }

  if (type === 'snapshot_read') return validateSnapshotRead(step, stepIndex, lessonLabel);
  if (type === 'film_room')     return validateFilmRoom(step, stepIndex, lessonLabel);
  return [];
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function run(lessons: Lesson[]): void {
  const allViolations: Violation[] = [];

  for (const lesson of lessons) {
    const label = lesson.title ?? lesson.legacy_lesson_id ?? lesson.id ?? '(unknown)';
    const steps: Step[] = Array.isArray(lesson.steps) ? lesson.steps : [];
    for (const [i, step] of steps.entries()) {
      allViolations.push(...validateStep(step, i, label));
    }
  }

  if (allViolations.length === 0) {
    console.log('✅  All visual steps valid.');
    return;
  }

  console.log(`\n⚠️  Found ${allViolations.length} violation(s):\n`);
  for (const v of allViolations) {
    console.log(`  [${v.lesson}] step ${v.stepIndex} › ${v.field}`);
    console.log(`    → ${v.message}\n`);
  }
  process.exitCode = 1;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const fixturePath = process.env['FIXTURE'];
if (fixturePath) {
  const abs = path.resolve(fixturePath);
  if (!fs.existsSync(abs)) {
    console.error(`FIXTURE not found: ${abs}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
  const lessons: Lesson[] = Array.isArray(raw) ? raw : [raw];
  run(lessons);
} else {
  console.log('No FIXTURE env set — provide FIXTURE=path/to/lessons.json to validate local data.');
  console.log('For Supabase validation, export rows to JSON and pass via FIXTURE.');
}
