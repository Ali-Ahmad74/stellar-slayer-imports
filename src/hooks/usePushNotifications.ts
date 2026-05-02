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
    // Don't register SW in iframe/preview environments
    const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    const isPreview = window.location.hostname.includes('id-preview--') || window.location.hostname.includes('lovableproject.com');
    
    if (isInIframe || isPreview) {
      // Unregister any stale SWs in preview
      navigator.serviceWorker?.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      return;
    }

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

      // Get VAPID public key via edge function (private key is admin-only in DB)
      const { data: vapidResp, error: vapidErr } = await supabase.functions.invoke(
        'generate-vapid-keys',
        { body: {} }
      );

      const publicKey = (vapidResp as any)?.publicKey;
      if (vapidErr || !publicKey) {
        console.error('VAPID public key not available', vapidErr);
        return false;
      }

      return await doSubscribe(reg, publicKey);
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, [isSupported]);

  const doSubscribe = async (reg: ServiceWorkerRegistration, publicKey: string) => {
    const sub = await reg.pushManager.subscribe({
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
