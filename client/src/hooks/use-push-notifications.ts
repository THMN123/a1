import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const { data: publicKeyData } = useQuery<{ publicKey: string }>({
    queryKey: ['/api/push/public-key'],
    retry: false,
    staleTime: Infinity,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      const subJson = subscription.toJSON();
      return apiRequest('POST', '/api/push/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      return apiRequest('POST', '/api/push/unsubscribe', { endpoint });
    },
  });

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          setRegistration(reg);

          const existingSub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!existingSub);
        } catch (err) {
          console.error('Service worker registration failed:', err);
        }
      }
    };

    checkSupport();
  }, []);

  const subscribe = useCallback(async () => {
    if (!registration || !publicKeyData?.publicKey) {
      console.error('Cannot subscribe: missing registration or public key');
      return false;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyData.publicKey)
      });

      await subscribeMutation.mutateAsync(subscription);
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, [registration, publicKeyData, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return false;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeMutation.mutateAsync(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
      return false;
    }
  }, [registration, unsubscribeMutation]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending
  };
}
