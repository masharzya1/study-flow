import { useEffect, useState, useCallback } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { firestoreService } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useFCM() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [fcmReady, setFcmReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, [user]);

  const registerFCM = useCallback(async () => {
    try {
      if (!user) return;
      if (!VAPID_KEY) {
        console.warn("FCM: VAPID key not set");
        return;
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn("FCM: messaging not supported");
        return;
      }

      const swRegistration = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        await firestoreService.saveFcmToken(user.uid, token);
        setFcmReady(true);
        console.log("FCM: token registered successfully");
      } else {
        console.warn("FCM: no token received");
      }

      onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        if (title) {
          toast({
            title,
            description: body,
          });

          if (Notification.permission === "granted") {
            new Notification(title, {
              body: body || "",
              icon: "/icon-192.png",
            });
          }
        }
      });
    } catch (e) {
      console.warn("FCM registration error:", e);
    }
  }, [user, toast]);

  const requestPermission = useCallback(async () => {
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
  }, [registerFCM]);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    registerFCM();
  }, [user, registerFCM]);

  return { permission, requestPermission, fcmReady };
}
