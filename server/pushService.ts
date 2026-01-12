import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@a1services.app';

let pushConfigured = false;

export function initPushService() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('Push notifications: VAPID keys not configured, push disabled');
    return;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    pushConfigured = true;
    console.log('Push notifications: Service initialized');
  } catch (error) {
    console.error('Push notifications: Failed to initialize', error);
  }
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

export function isPushConfigured(): boolean {
  return pushConfigured;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  if (!pushConfigured) {
    console.log('Push notifications: Not configured, skipping send');
    return;
  }

  try {
    const subscriptions = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`Push notifications: No subscriptions for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify(payload);

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          notificationPayload
        );
        console.log(`Push sent to ${sub.endpoint.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Push subscription expired, removing: ${sub.id}`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error(`Push failed for subscription ${sub.id}:`, error.message);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Push notifications: Error sending', error);
  }
}

export async function sendPushToVendorOwner(vendorOwnerId: string, payload: PushPayload): Promise<void> {
  await sendPushNotification(vendorOwnerId, payload);
}

initPushService();
