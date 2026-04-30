/**
 * lessonAudio.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Audio layer for Clutchr Baseball lesson intros.
 *
 * ARCHITECTURE — production-ready from day one:
 *
 *   1. Check if the lesson has a pre-recorded audio_url in Supabase.
 *      If yes → play that. Done. Zero API cost.
 *
 *   2. If no audio_url → build a short spoken intro from the lesson data
 *      and speak it via expo-speech (device TTS, completely free).
 *
 * When you record real coach audio, you simply upload the file to Supabase
 * Storage, set lesson.audio_url, and step 1 catches it. TTS stops firing
 * for that lesson automatically — no code changes ever needed.
 *
 * USAGE:
 *   import { speakLessonIntro, stopSpeech, isSpeechAvailable } from '@/lib/lessonAudio';
 *
 *   // On lesson open:
 *   await speakLessonIntro(lesson, reason);
 *
 *   // On lesson close / step advance:
 *   stopSpeech();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface LessonAudioData {
  id: string;
  title: string;
  subtitle?: string | null;
  audio_url?: string | null;       // pre-recorded coach intro (Supabase Storage URL)
  pillar_id?: string;
  role_tags?: string[];
  difficulty_tier?: string | null;
}

// ─── SOUND INSTANCE ──────────────────────────────────────────────────────────
// We keep one module-level sound ref so we can always stop it cleanly.

let _sound: Audio.Sound | null = null;

// ─── TTS VOICE SETTINGS ──────────────────────────────────────────────────────
// These settings make iOS TTS sound more like a confident coach,
// less like a GPS. Tweak pitch/rate to taste.

const TTS_OPTIONS: Speech.SpeechOptions = {
  language: 'en-US',
  pitch: 0.95,      // Slightly lower = sounds more authoritative
  rate: 0.88,       // Slightly slower = clearer, more deliberate delivery
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Build the spoken intro script from lesson data + optional routing reason.
 *
 * Keeps it under ~15 seconds when spoken. Short, punchy, baseball-native.
 * No "Hello!" no "Welcome to lesson 3!" — just gets right to the point.
 */
function buildIntroScript(lesson: LessonAudioData, reason?: string): string {
  const title = lesson.title ?? '';

  // Use routing reason if it exists — it's always specific to the athlete.
  // Fall back to subtitle, then a minimal default.
  const why = reason?.trim() || lesson.subtitle?.trim() || '';

  if (why) {
    // Format: "[Lesson title]. [Why it matters]."
    // Example: "Next-Pitch Reset. Slumps end when you compete in the process."
    return `${title}. ${why}`;
  }

  return title;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Returns true if TTS is available on this device.
 * Always returns true on physical devices; may return false on simulators.
 */
export async function isSpeechAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}

/**
 * Stop any currently playing lesson audio — both pre-recorded and TTS.
 * Safe to call even if nothing is playing.
 */
export function stopSpeech(): void {
  // Stop TTS
  try { Speech.stop(); } catch { /* noop */ }

  // Stop pre-recorded audio
  if (_sound) {
    _sound.stopAsync().catch(() => {});
    _sound.unloadAsync().catch(() => {});
    _sound = null;
  }
}

/**
 * Play the lesson intro audio.
 *
 * If lesson.audio_url is set → plays that file (pre-recorded coach voice).
 * Otherwise → speaks a generated intro via device TTS (free, zero API calls).
 *
 * @param lesson  The lesson data object (needs title + optionally audio_url)
 * @param reason  The routing reason string from pickNextLesson() — makes TTS
 *                sound specific to the athlete's situation, not generic.
 */
export async function speakLessonIntro(
  lesson: LessonAudioData,
  reason?: string
): Promise<void> {
  // Always stop any previous audio first
  stopSpeech();

  // ── PATH 1: PRE-RECORDED AUDIO ───────────────────────────────────────────
  if (lesson.audio_url) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: lesson.audio_url },
        { shouldPlay: true, volume: 1.0 }
      );
      _sound = sound;

      // Auto-cleanup when it finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          _sound = null;
        }
      });
      return;
    } catch (err) {
      // Pre-recorded file failed — fall through to TTS silently
      console.warn('[lessonAudio] Pre-recorded audio failed, falling back to TTS:', err);
    }
  }

  // ── PATH 2: TTS FALLBACK ─────────────────────────────────────────────────
  try {
    const script = buildIntroScript(lesson, reason);
    if (!script.trim()) return;

    // Small delay so the screen animation completes before speech starts —
    // prevents the "lesson opened and voice immediately fires" jarring feel.
    await new Promise<void>((resolve) => setTimeout(resolve, 600));

    await new Promise<void>((resolve, reject) => {
      Speech.speak(script, {
        ...TTS_OPTIONS,
        onDone: resolve,
        onError: reject,
      });
    });
  } catch (err) {
    // TTS failing should never crash the lesson — just swallow it.
    console.warn('[lessonAudio] TTS failed:', err);
  }
}
