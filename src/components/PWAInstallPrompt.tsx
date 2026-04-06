import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { isSupported: pushSupported, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    if (dismissed || isStandalone) {
      // Still try to subscribe to push if not subscribed
      if (pushSupported && !isSubscribed && Notification.permission === 'default') {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
      return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If no install prompt fires after 5s, still show for notifications
    const fallbackTimer = setTimeout(() => {
      if (pushSupported && !isSubscribed) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, [pushSupported, isSubscribed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        // After install, ask for notification permission
        if (pushSupported && !isSubscribed) {
          await subscribe();
        }
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleEnableNotifications = async () => {
    await subscribe();
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) return null;

  const showInstallButtons = !isIOS && deferredPrompt;
  const showNotificationButton = pushSupported && !isSubscribed && Notification.permission !== 'denied';

  // Nothing to show
  if (!showInstallButtons && !showNotificationButton && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {showInstallButtons ? (
                <Smartphone className="w-6 h-6 text-primary" />
              ) : (
                <Bell className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                {showInstallButtons ? "Install App" : "Enable Notifications"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isIOS
                  ? "Tap Share → Add to Home Screen to install"
                  : showInstallButtons
                  ? "Install for quick access & get match updates"
                  : "Get notified about new matches, rankings & achievements"}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDismiss}
            >
              Not now
            </Button>
            {showInstallButtons ? (
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={handleInstall}
              >
                <Download className="w-4 h-4" />
                Install
              </Button>
            ) : showNotificationButton ? (
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={handleEnableNotifications}
              >
                <Bell className="w-4 h-4" />
                Enable
              </Button>
            ) : null}
          </div>

          {isIOS && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              <span>Tap</span>
              <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/20 rounded">
                ⬆️
              </span>
              <span>then "Add to Home Screen"</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
