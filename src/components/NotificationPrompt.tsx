import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from "@/lib/notifications";

export const NotificationPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const perm = getNotificationPermission();
    const dismissed = sessionStorage.getItem("notif-prompt-dismissed");
    if (perm === "default" && !dismissed) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    await requestNotificationPermission();
    setShow(false);
    sessionStorage.setItem("notif-prompt-dismissed", "1");
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("notif-prompt-dismissed", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="glass-card p-4 flex items-start gap-3 shadow-lg border border-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Notification চালু করো 🔔</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Timer শেষ হলে, revision due হলে আর streak milestone এ notify করবো!
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAllow}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Allow করো
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-1.5 rounded-xl bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  পরে
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
