import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') return null;

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;
  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders & Delivery',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return token;

  await supabase.from('notification_devices').upsert(
    {
      user_id: user.id,
      expo_push_token: token,
      platform: Platform.OS,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  return token;
}

export async function disableCurrentPushToken() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await supabase
    .from('notification_devices')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('expo_push_token', token);
}

export function subscribeToNotificationEvents(
  onReceive?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const receiveSubscription = onReceive
    ? Notifications.addNotificationReceivedListener(onReceive)
    : null;
  const responseSubscription = onResponse
    ? Notifications.addNotificationResponseReceivedListener(onResponse)
    : null;

  return () => {
    receiveSubscription?.remove();
    responseSubscription?.remove();
  };
}

/**
 * Subscribe to notifications created for the currently signed-in user.
 * This provides immediate in-app delivery while the app is active; remote
 * push delivery is handled separately by the trusted server dispatcher.
 */
export function subscribeToRealtimeNotifications(
  onInsert?: (notification: Record<string, unknown>) => void,
) {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  void supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user || cancelled) return;

    channel = supabase
      .channel(`gwalawala-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => onInsert?.(payload.new as Record<string, unknown>),
      )
      .subscribe();
  });

  return () => {
    cancelled = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
