import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fetchContentCards, fetchLessons, type LegacyLesson } from '@/lib/supabase';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface StepIssue {
  lessonId: string;
  stepIndex: number;
  message: string;
}

interface LessonIssue {
  lessonId: string;
  message: string;
}

function validateLesson(lesson: LegacyLesson): LessonIssue[] {
  const issues: LessonIssue[] = [];
  if (!lesson.id) issues.push({ lessonId: 'unknown', message: 'Missing lesson.id' });
  if (!lesson.title) issues.push({ lessonId: lesson.id, message: 'Missing title' });
  if (!lesson.pillar_id) issues.push({ lessonId: lesson.id, message: 'Missing pillar_id' });
  if (!lesson.unit_id) issues.push({ lessonId: lesson.id, message: 'Missing unit_id' });
  if (!Array.isArray(lesson.steps)) issues.push({ lessonId: lesson.id, message: 'steps is not an array' });
  return issues;
}

function validateStep(lesson: LegacyLesson, rawStep: unknown, index: number): StepIssue[] {
  const issues: StepIssue[] = [];
  if (!rawStep || typeof rawStep !== 'object') {
    issues.push({ lessonId: lesson.id, stepIndex: index, message: 'Step is not an object' });
    return issues;
  }

  const step = rawStep as Record<string, unknown>;
  const stepType = (step.step_type ?? step.type) as string | undefined;
  const uiVariant = step.ui_variant as string | undefined;
  const hasContent = typeof step.content === 'string' || typeof step.text === 'string' || typeof step.body === 'string';
  const hasPrompt = typeof step.prompt === 'string' || typeof step.question === 'string';
  const hasData = typeof step.data === 'object' && step.data !== null;

  if (!stepType && !uiVariant) {
    issues.push({ lessonId: lesson.id, stepIndex: index, message: 'Missing both step_type/type and ui_variant' });
  }

  if (uiVariant && !hasData) {
    issues.push({ lessonId: lesson.id, stepIndex: index, message: `ui_variant="${uiVariant}" is missing data object` });
  }

  const textLikeStep = ['spark', 'story', 'reflection', 'cue'];
  if (stepType && textLikeStep.includes(stepType) && !hasContent && !hasPrompt) {
    issues.push({ lessonId: lesson.id, stepIndex: index, message: `step_type="${stepType}" is missing content/prompt` });
  }

  if (!stepType && !hasContent && !hasPrompt && !hasData) {
    issues.push({ lessonId: lesson.id, stepIndex: index, message: 'Step has no content, prompt, or data' });
  }

  return issues;
}

export default function DevQAScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LegacyLesson[]>([]);
  const [contentCount, setContentCount] = useState(0);
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!__DEV__) return;
    (async () => {
      setLoading(true);
      const errors: string[] = [];
      try {
        const data = await fetchLessons({ limit: 500 });
        setLessons(data);
      } catch (err) {
        errors.push(`Lessons fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        const cards = await fetchContentCards({ limit: 500 });
        setContentCount(cards.length);
      } catch (err) {
        errors.push(`Locker content fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      setFetchErrors(errors);
      setLoading(false);
    })();
  }, []);

  const report = useMemo(() => {
    const completedIds = athleteState?.completed_lessons ?? [];
    const ids = lessons.map((l) => l.id);
    const idSet = new Set(ids);
    const unmatchedCompleted = completedIds.filter((id) => !idSet.has(id));
    const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);

    const lessonIssues = lessons.flatMap((l) => validateLesson(l));
    const emptyStepLessons = lessons.filter((l) => Array.isArray(l.steps) && l.steps.length === 0).map((l) => l.id);
    const stepIssues = lessons.flatMap((lesson) =>
      Array.isArray(lesson.steps) ? lesson.steps.flatMap((step, idx) => validateStep(lesson, step, idx)) : []
    );

    return {
      completedCount: completedIds.length,
      unmatchedCompleted,
      duplicateIds: Array.from(new Set(duplicateIds)),
      lessonIssues,
      stepIssues,
      emptyStepLessons,
    };
  }, [athleteState?.completed_lessons, lessons]);

  if (!__DEV__) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}> 
        <Text style={styles.blocked}>Dev QA is only available in development builds.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DEV QA / CONTENT TESTER</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Close</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Stat label="Fetched lessons" value={String(lessons.length)} />
          <Stat label="Fetched Locker cards" value={String(contentCount)} />
          <Stat label="Completed lesson IDs" value={String(report.completedCount)} />
          <Stat label="Completed IDs not in fetched lessons" value={String(report.unmatchedCompleted.length)} />
          <Stat label="Lessons missing required fields" value={String(report.lessonIssues.length)} />
          <Stat label="Step-level issues" value={String(report.stepIssues.length)} />
          <Stat label="Lessons with empty steps" value={String(report.emptyStepLessons.length)} />
          <Stat label="Duplicate lesson IDs" value={String(report.duplicateIds.length)} />
          <Stat label="Fetch errors" value={String(fetchErrors.length)} />

          <Section title="Athlete Snapshot">
            <Text style={styles.row}>Role: {athleteState?.primary_role ?? 'n/a'}</Text>
            <Text style={styles.row}>Season phase: {athleteState?.season_phase ?? 'n/a'}</Text>
            <Text style={styles.row}>XP: {athleteState?.total_xp ?? 0}</Text>
            <Text style={styles.row}>Streak: {athleteState?.streak_count ?? 0}</Text>
            <Text style={styles.row}>Current phase: {(athleteState?.current_phase ?? 0) + 1}</Text>
          </Section>

          <Section title="Unmatched completed IDs">{report.unmatchedCompleted.map((id) => <Text key={id} style={styles.issue}>{id}</Text>)}</Section>
          <Section title="Duplicate lesson IDs">{report.duplicateIds.map((id) => <Text key={id} style={styles.issue}>{id}</Text>)}</Section>
          <Section title="Lesson issues">{report.lessonIssues.map((i, idx) => <Text key={`${i.lessonId}-${idx}`} style={styles.issue}>{i.lessonId}: {i.message}</Text>)}</Section>
          <Section title="Empty-step lessons">{report.emptyStepLessons.map((id) => <Text key={id} style={styles.issue}>{id}</Text>)}</Section>
          <Section title="Step issues">{report.stepIssues.map((i, idx) => <Text key={`${i.lessonId}-${i.stepIndex}-${idx}`} style={styles.issue}>{i.lessonId} [step {i.stepIndex + 1}]: {i.message}</Text>)}</Section>
          <Section title="Fetch errors">{fetchErrors.map((e, idx) => <Text key={`${e}-${idx}`} style={styles.issue}>{e}</Text>)}</Section>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children || <Text style={styles.ok}>None</Text>}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.6 },
  link: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  loader: { flex: 1, justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.sm },
  statCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  statLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  statValue: { color: Colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 20 },
  section: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  sectionTitle: { color: Colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: Spacing.sm },
  sectionBody: { gap: 6 },
  row: { color: Colors.textPrimary },
  issue: { color: Colors.warning, fontSize: 12 },
  ok: { color: Colors.textSecondary, fontSize: 12 },
  blocked: { color: Colors.textPrimary, textAlign: 'center' },
});
