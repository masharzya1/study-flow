import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Sparkles } from "lucide-react";
import { useFCM } from "@/hooks/useFCM";
import { useState } from "react";

export function NotificationPrompt() {
  const { permission, requestPermission } = useFCM();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("penzo_notif_dismissed") === "true";
    } catch {
      return false;
    }
  });

  if (permission !== "default" || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("penzo_notif_dismissed", "true");
    } catch {}
  };

  const handleEnable = async () => {
    await requestPermission();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="overflow-hidden"
      >
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
      </motion.div>
    </AnimatePresence>
  );
}
