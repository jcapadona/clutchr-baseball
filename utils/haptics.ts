import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS !== 'web';

/** Light tap — button press, navigation */
function tap() {
  if (!native) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Selection — choice made, checklist toggle */
function select() {
  if (!native) return;
  Haptics.selectionAsync();
}

/** Medium impact — acceptable answer, slider, radio pick */
function medium() {
  if (!native) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy impact — used inside sequences; prefer lessonComplete() */
function heavy() {
  if (!native) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — correct answer, checkpoint cleared */
function success() {
  if (!native) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — approaching a limit, soft fail */
function warn() {
  if (!native) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Error notification — wrong answer, failed action */
function error() {
  if (!native) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Boss / checkpoint completion — success pulse followed by two echo impacts */
async function lessonComplete() {
  if (!native) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 350);
}

export const H = { tap, select, medium, heavy, success, warn, error, lessonComplete };
