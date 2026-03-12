import { useEffect, useState, useCallback, useRef } from "react";
import { getToken, deleteToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { firestoreService } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) {
    console.log("FCM: using existing SW at /", existing.active.scriptURL);
    return existing;
  }

  console.log("FCM: no active SW at /, registering firebase-messaging-sw.js");
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });

  if (reg.active) return reg;

  await new Promise<void>((resolve, reject) => {
    const sw = reg.installing || reg.waiting;
    if (!sw) { resolve(); return; }
    const timeout = setTimeout(() => resolve(), 10000);
    sw.addEventListener("statechange", () => {
      if (sw.state === "activated") { clearTimeout(timeout); resolve(); }
      else if (sw.state === "redundant") { clearTimeout(timeout); reject(new Error("SW redundant")); }
    });
  });

  return reg;
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
        console.warn("FCM: VAPID key not configured (VITE_FIREBASE_VAPID_KEY)");
        return;
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn("FCM: messaging not supported on this browser");
        return;
      }

      console.log("FCM: getting service worker registration...");
      const swReg = await getOrRegisterSW();
      console.log("FCM: SW ready, scope:", swReg.scope, "active:", !!swReg.active);

      let token: string | null = null;
      try {
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
      } catch (e: any) {
        console.warn("FCM: initial getToken failed:", e?.message, "— force-refreshing");
        try { await deleteToken(messaging); } catch {}
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
      }

      if (token) {
        console.log("FCM: token obtained:", token.slice(0, 20) + "..." + token.slice(-10));
        await firestoreService.saveFcmToken(user.uid, token);
        setFcmReady(true);
        console.log("FCM: token saved for uid:", user.uid);
      } else {
        console.warn("FCM: no token received — check VAPID key and browser support");
      }

      if (!listenerSet.current) {
        listenerSet.current = true;
        onMessage(messaging, (payload) => {
          console.log("FCM: foreground message:", JSON.stringify(payload));
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
