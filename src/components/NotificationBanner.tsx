import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellOff, Bell } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from "@/lib/notifications";

interface NotificationBannerProps {
  featureName: string; // e.g. "Timer শেষ হলে notify"
}

export const NotificationBanner = ({ featureName }: NotificationBannerProps) => {
  const [, forceUpdate] = useState(0);

  if (!isNotificationSupported()) return null;

  const perm = getNotificationPermission();
  if (perm === "granted") return null;

  const handleEnable = async () => {
    await requestNotificationPermission();
    forceUpdate(n => n + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
        <BellOff className="w-4 h-4 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-destructive font-medium">
            Notification {perm === "denied" ? "blocked" : "off"} — {featureName} পাবে না
          </p>
          {perm === "denied" && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Browser settings → Site settings থেকে notification allow করো
            </p>
          )}
        </div>
        {perm !== "denied" && (
          <button
            onClick={handleEnable}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shrink-0 hover:opacity-90 transition-opacity"
          >
            <Bell className="w-3 h-3" /> On করো
          </button>
        )}
      </div>
    </motion.div>
  );
};
