import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
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

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch {
      // ignore
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const { data: vapidData } = await supabase
        .from('vapid_keys')
        .select('public_key')
        .single();

      if (!vapidData?.public_key) {
        // Try to generate VAPID keys
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        await fetch(`https://${projectId}.supabase.co/functions/v1/generate-vapid-keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const { data: retryData } = await supabase
          .from('vapid_keys')
          .select('public_key')
          .single();

        if (!retryData?.public_key) {
          console.error('VAPID keys not available');
          return false;
        }

        return await doSubscribe(reg, retryData.public_key);
      }

      return await doSubscribe(reg, vapidData.public_key);
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, [isSupported]);

  const doSubscribe = async (reg: ServiceWorkerRegistration, publicKey: string) => {
    const sub = await reg.pushManager.subscribe({
      userApplicationServerKey: urlBase64ToUint8Array(publicKey),
      applicationServerKey: urlBase64ToUint8Array(publicKey),
      userVisibleOnly: true,
    });

    const subJson = sub.toJSON();

    // Save to database
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }

    setIsSubscribed(true);
    return true;
  };

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    }
  }, []);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
