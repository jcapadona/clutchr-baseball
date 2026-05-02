import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'clutchr_push_token';
const NOTIF_SETUP_KEY = 'clutchr_notifs_setup';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return token;
}

export async function scheduleStreakReminder(streakCount: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const messages =
    streakCount >= 7
      ? { title: `⚡ Day ${streakCount} streak`, body: "Don't break it. Your rep is waiting." }
      : streakCount >= 2
      ? { title: `⚡ ${streakCount}-day streak`, body: 'Keep stacking. Do your rep today.' }
      : { title: '⚡ Clutchr', body: "One rep. That's all it takes today." };

  const trigger = new Date();
  trigger.setHours(17, 0, 0, 0);
  if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: messages.title,
      body: messages.body,
      sound: true,
      data: { screen: 'career' },
    },
    trigger,
  });
}

export async function scheduleMorningGameDayReminder() {
  const trigger = new Date();
  trigger.setHours(8, 30, 0, 0);
  if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Game day.',
      body: 'Run your pregame rep. Lock in before first pitch.',
      sound: true,
      data: { screen: 'gamemode' },
    },
    trigger,
  });
}

export async function setupNotificationsOnce() {
  const alreadySetup = await AsyncStorage.getItem(NOTIF_SETUP_KEY);
  if (alreadySetup) return;
  const token = await registerForPushNotifications();
  if (token) {
    await AsyncStorage.setItem(NOTIF_SETUP_KEY, 'true');
    await scheduleStreakReminder(0);
  }
}
