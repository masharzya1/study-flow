import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");
  return initializeApp({ credential: cert(serviceAccount) });
}

const adminApp = getAdminApp();
const adminAuth = getAuth(adminApp);
const adminMessaging = getMessaging(adminApp);
const adminFirestore = getFirestore(adminApp);

const STALE_TOKEN_ERRORS = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userDoc = await adminFirestore.collection("users").doc(uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    return res.status(403).json({ error: "Not admin" });
  }

  const { targetUid, title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body required" });

  try {
    let tokenDocs: any[];

    if (targetUid) {
      const doc = await adminFirestore.collection("fcmTokens").doc(targetUid).get();
      tokenDocs = doc.exists ? [doc] : [];
    } else {
      const snap = await adminFirestore.collection("fcmTokens").get();
      tokenDocs = snap.docs;
    }

    const targets = tokenDocs.map((d: any) => ({
      uid: d.id,
      token: d.data()?.token || null,
    }));

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const target of targets) {
      if (!target.token) {
        failureCount++;
        errors.push(`${target.uid}: no token stored`);
        continue;
      }
      try {
        await adminMessaging.send({
          token: target.token,
          notification: { title, body },
          webpush: {
            headers: { Urgency: "high", TTL: "86400" },
            notification: {
              title,
              body,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              vibrate: [200, 100, 200] as any,
              requireInteraction: true,
            },
            fcmOptions: { link: "/" },
          },
        });
        successCount++;
        console.log(`FCM: sent to ${target.uid} OK`);
      } catch (err: any) {
        const code = err?.code || err?.errorInfo?.code || "";
        const msg = err?.message || String(err);
        console.error(`FCM send error for ${target.uid}: [${code}] ${msg}`);
        errors.push(`${target.uid}: ${code || msg}`);
        failureCount++;

        if (STALE_TOKEN_ERRORS.some((e) => code.includes(e) || msg.includes(e))) {
          console.log(`FCM: deleting stale token for ${target.uid}`);
          try {
            await adminFirestore.collection("fcmTokens").doc(target.uid).delete();
          } catch (delErr: any) {
            console.error(`FCM: failed to delete stale token for ${target.uid}:`, delErr?.message);
          }
        }
      }
    }

    await adminFirestore.collection("notifications").add({
      sentBy: uid,
      targetUid: targetUid || null,
      title,
      body,
      sentAt: new Date(),
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : null,
    });

    return res.status(200).json({ ok: true, successCount, failureCount, errors });
  } catch (e: any) {
    console.error("Notify handler error:", e);
    return res.status(500).json({ error: e.message });
  }
}
