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
        console.warn("FCM: VAPID key not configured");
        return;
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn("FCM: messaging not supported on this browser");
        return;
      }

      const fcmSwRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/firebase-cloud-messaging-push-scope" }
      );

      await fcmSwRegistration.update();

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: fcmSwRegistration,
      });

      if (token) {
        await firestoreService.saveFcmToken(user.uid, token);
        setFcmReady(true);
        console.log("FCM: token registered successfully");
      } else {
        console.warn("FCM: no token received");
      }

      onMessage(messaging, (payload) => {
        const notif = payload.notification || {};
        const data = payload.data || {};
        const title = notif.title || data.title;
        const body = notif.body || data.body;

        if (title) {
          toast({ title, description: body });
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
