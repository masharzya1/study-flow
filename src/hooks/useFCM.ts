import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { firestoreService } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useFCM() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [fcmReady, setFcmReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPermission(Notification.permission);
  }, [user]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await registerFCM();
      }
      return result;
    } catch (e) {
      console.warn("FCM permission error:", e);
      return "denied" as NotificationPermission;
    }
  };

  const registerFCM = async () => {
    try {
      if (!user) return;
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
      });

      if (token) {
        await firestoreService.saveFcmToken(user.uid, token);
        setFcmReady(true);
      }

      onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        if (title && Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/icon-192.png",
          });
        }
      });
    } catch (e) {
      console.warn("FCM registration error:", e);
    }
  };

  useEffect(() => {
    if (!user || Notification.permission !== "granted") return;
    registerFCM();
  }, [user]);

  return { permission, requestPermission, fcmReady };
}
