import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Sparkles, ExternalLink } from "lucide-react";
import { useFCM } from "@/hooks/useFCM";
import { useState } from "react";

export function NotificationPrompt() {
  const { permission, requestPermission } = useFCM();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const key = permission === "denied" ? "penzo_notif_denied_dismissed" : "penzo_notif_dismissed";
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  });

  if (permission === "granted" || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const key = permission === "denied" ? "penzo_notif_denied_dismissed" : "penzo_notif_dismissed";
      localStorage.setItem(key, "true");
    } catch {}
  };

  const handleEnable = async () => {
    await requestPermission();
  };

  const isDenied = permission === "denied";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="overflow-hidden"
      >
        {isDenied ? (
          <div className="glass-card-elevated p-4 flex items-start gap-3 border border-red-500/20 bg-red-500/5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BellOff className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Notifications are Blocked</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Your browser is blocking notifications from Penzó. You won't get study reminders, revision alerts, or messages from your admin.
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                <span className="font-medium text-foreground">To fix:</span> Tap the lock icon (🔒) in your browser's address bar → find "Notifications" → change to "Allow" → then reload the page.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => window.location.reload()}
                  data-testid="button-reload-notif"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Reload Page
                </button>
                <button
                  onClick={handleDismiss}
                  data-testid="button-dismiss-notif-denied"
                  className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="glass-card-elevated p-4 flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Enable Push Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Get study reminders, revision alerts, and messages from your admin — even when the app is closed. Never miss a study session!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnable}
                  data-testid="button-enable-notif-banner"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500 text-yellow-950 text-xs font-semibold hover:bg-yellow-400 active:scale-[0.97] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Turn On Notifications
                </button>
                <button
                  onClick={handleDismiss}
                  data-testid="button-dismiss-notif-banner"
                  className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
