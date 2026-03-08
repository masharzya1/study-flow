// Browser Notification utilities with toast fallback
import { toast } from "sonner";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function tryNativeNotification(title: string, options?: NotificationOptions): boolean {
  if (!("Notification" in window)) {
    console.log("[Notif] Notification API not available");
    return false;
  }
  if (Notification.permission !== "granted") {
    console.log("[Notif] Permission not granted:", Notification.permission);
    return false;
  }
  
  try {
    const notification = new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      requireInteraction: false,
      silent: false,
      ...options,
    });
    console.log("[Notif] Native notification sent successfully");
    // Don't auto-close — let OS handle notification duration
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (err) {
    console.error("[Notif] Native notification failed:", err);
    // Fallback: try service worker notification
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          ...options,
        });
        console.log("[Notif] SW notification sent as fallback");
      }).catch(e => console.error("[Notif] SW fallback failed:", e));
    }
    return false;
  }
}

export function sendNotification(title: string, options?: NotificationOptions) {
  // Try native first, fall back to toast
  const sent = tryNativeNotification(title, options);
  if (!sent) {
    toast(title, {
      description: options?.body,
      duration: 5000,
    });
  }
}

export function notifyTimerComplete(mode: "focus" | "break") {
  if (mode === "focus") {
    sendNotification("⏱ Focus Session Complete!", {
      body: "দারুণ! এখন একটু break নাও 🎉",
      tag: "timer-complete",
    });
  } else {
    sendNotification("☕ Break Over!", {
      body: "আবার পড়তে বসো — তুমি পারবে! 💪",
      tag: "break-complete",
    });
  }
}

export function notifyRevisionDue(topicName: string, subjectName: string) {
  sendNotification("📚 Revision Due!", {
    body: `${topicName} (${subjectName}) — আজকে review করতে হবে`,
    tag: `revision-${topicName}`,
  });
}

export function notifyStreak(days: number) {
  sendNotification(`🔥 ${days} Day Streak!`, {
    body: "তোমার consistency অসাধারণ! চালিয়ে যাও!",
    tag: "streak",
  });
}
