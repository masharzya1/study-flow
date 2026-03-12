import { useEffect, useState, useCallback, useRef } from "react";
import { getToken, deleteToken, onMessage } from "firebase/messaging";
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
        console.error("FCM: VAPID key missing. Set VITE_FIREBASE_VAPID_KEY in env.");
        return;
      }
      console.log("FCM: VAPID key present, length:", VAPID_KEY.length);

      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.error("FCM: messaging not supported in this browser");
        return;
      }

      console.log("FCM: waiting for service worker...");

      let swReg: ServiceWorkerRegistration;

      const existingRegs = await navigator.serviceWorker.getRegistrations();
      console.log("FCM: found", existingRegs.length, "SW registrations:", existingRegs.map(r => r.scope));

      for (const reg of existingRegs) {
        if (reg.scope.includes("firebase-cloud-messaging-push-scope")) {
          console.log("FCM: unregistering old Firebase SW at scope:", reg.scope);
          await reg.unregister();
        }
      }

      const rootReg = await navigator.serviceWorker.getRegistration("/");
      if (rootReg?.active) {
        console.log("FCM: reusing active SW at /:", rootReg.active.scriptURL);
        swReg = rootReg;
      } else {
        console.log("FCM: registering firebase-messaging-sw.js at /");
        swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });

        if (!swReg.active) {
          console.log("FCM: waiting for SW to activate...");
          await new Promise<void>((resolve) => {
            const sw = swReg.installing || swReg.waiting;
            if (!sw) { resolve(); return; }
            const timeout = setTimeout(() => {
              console.log("FCM: SW activation timeout, continuing anyway");
              resolve();
            }, 10000);
            sw.addEventListener("statechange", () => {
              if (sw.state === "activated") { clearTimeout(timeout); resolve(); }
              else if (sw.state === "redundant") { clearTimeout(timeout); resolve(); }
            });
          });
        }
      }

      console.log("FCM: SW ready. scope:", swReg.scope, "active:", swReg.active?.state);

      console.log("FCM: deleting old token to force fresh subscription...");
      try { await deleteToken(messaging); } catch (e) {
        console.log("FCM: no old token to delete (this is fine)");
      }

      console.log("FCM: requesting fresh token...");
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        console.log("FCM: ✅ token obtained:", token);
        await firestoreService.saveFcmToken(user.uid, token);
        setFcmReady(true);
        console.log("FCM: ✅ token saved to Firestore for uid:", user.uid);
      } else {
        console.error("FCM: ❌ no token returned. Check VAPID key and Firebase console Web Push cert.");
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
        console.log("FCM: foreground message listener registered");
      }
    } catch (e) {
      console.error("FCM: registration failed:", e);
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
