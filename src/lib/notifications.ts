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
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  
  try {
    const notification = new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
    setTimeout(() => notification.close(), 5000);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch {
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
