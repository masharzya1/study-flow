// Browser Notification utilities

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

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  
  try {
    const notification = new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
    
    // Focus window on click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Fallback for environments that don't support Notification constructor
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
