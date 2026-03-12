import { useEffect, useState, useCallback, useRef } from "react";
import { getToken, deleteToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { firestoreService } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function waitForSwActive(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    if (reg.active) {
      resolve(reg);
      return;
    }
    const sw = reg.installing || reg.waiting;
    if (!sw) {
      resolve(reg);
      return;
    }
    const timeout = setTimeout(() => {
      resolve(reg);
    }, 10000);
    sw.addEventListener("statechange", () => {
      if (sw.state === "activated") {
        clearTimeout(timeout);
        resolve(reg);
      } else if (sw.state === "redundant") {
        clearTimeout(timeout);
        reject(new Error("Service worker became redundant"));
      }
    });
  });
}

export function useFCM() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [fcmReady, setFcmReady] = useState(false);
  const listenerSet = useRef(false);

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

      const rawReg = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/firebase-cloud-messaging-push-scope" }
      );

      await rawReg.update();
      const fcmSwRegistration = await waitForSwActive(rawReg);
      console.log("FCM: service worker active, state:", fcmSwRegistration.active?.state);

      let token: string | null = null;
      try {
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: fcmSwRegistration,
        });
      } catch (e: any) {
        console.warn("FCM: initial getToken failed, force-refreshing:", e?.message);
        try {
          await deleteToken(messaging);
        } catch {}
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: fcmSwRegistration,
        });
      }

      if (token) {
        console.log("FCM: token obtained:", token.slice(0, 20) + "...");
        await firestoreService.saveFcmToken(user.uid, token);
        setFcmReady(true);
        console.log("FCM: token saved to Firestore for uid:", user.uid);
      } else {
        console.warn("FCM: no token received — check VAPID key and browser support");
      }

      if (!listenerSet.current) {
        listenerSet.current = true;
        onMessage(messaging, (payload) => {
          console.log("FCM: foreground message received:", payload);
          const notif = payload.notification || {};
          const data = payload.data || {};
          const title = notif.title || data.title;
          const body = notif.body || data.body;

          if (title) {
            toast({ title, description: body });
          }
        });
      }
    } catch (e) {
      console.error("FCM registration error:", e);
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
