import express from "express";
import cors from "cors";
import { adminAuth, adminMessaging, adminFirestore } from "./firebaseAdmin.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const STALE_TOKEN_ERRORS = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
];

async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

async function requireAdmin(req: any, res: any, next: any) {
  const userDoc = await adminFirestore.collection("users").doc(req.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    return res.status(403).json({ error: "Not admin" });
  }
  next();
}

app.post("/api/admin/notify", requireAuth, requireAdmin, async (req: any, res) => {
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
          data: { title, body },
          webpush: {
            headers: { Urgency: "high", TTL: "86400" },
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
      sentBy: req.uid,
      targetUid: targetUid || null,
      title,
      body,
      sentAt: new Date(),
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : null,
    });

    res.json({ ok: true, successCount, failureCount, errors });
  } catch (e: any) {
    console.error("Notify handler error:", e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});
