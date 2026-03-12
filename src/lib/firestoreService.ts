import {
  doc, setDoc, getDoc, getDocs, collection, query,
  where, orderBy, limit, serverTimestamp, addDoc, updateDoc, Timestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";

export const firestoreService = {
  async syncUser(profile: { displayName?: string | null; photoURL?: string | null; email?: string | null }) {
    const user = auth.currentUser;
    if (!user) return null;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        displayName: profile.displayName || null,
        photoURL: profile.photoURL || null,
        email: profile.email || null,
        lastActiveAt: serverTimestamp(),
      });
      return snap.data();
    } else {
      const data = {
        uid: user.uid,
        displayName: profile.displayName || null,
        photoURL: profile.photoURL || null,
        email: profile.email || null,
        isAdmin: false,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };
      await setDoc(ref, data);
      return data;
    }
  },

  async getUserProfile(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  },

  async getStudyData(uid: string) {
    const snap = await getDoc(doc(db, "studyData", uid));
    return snap.exists() ? snap.data()?.data || null : null;
  },

  async saveStudyData(uid: string, data: any) {
    await setDoc(doc(db, "studyData", uid), { data, updatedAt: serverTimestamp() });
  },

  async logSession(uid: string, session: {
    sessionId: string;
    subjectId?: string;
    topicId?: string;
    durationMinutes: number;
    sessionType?: string;
    focusScore?: number;
    distractionCount?: number;
  }) {
    await addDoc(collection(db, "studySessions"), {
      uid,
      ...session,
      completedAt: serverTimestamp(),
    });
  },

  async saveFcmToken(uid: string, token: string) {
    const ref = doc(db, "fcmTokens", uid);
    const existing = await getDoc(ref);
    if (existing.exists() && existing.data()?.token === token) {
      return;
    }
    await setDoc(ref, {
      uid,
      token,
      updatedAt: serverTimestamp(),
    });
  },

  async getAllUsers() {
    const snap = await getDocs(collection(db, "users"));
    const users: any[] = [];
    for (const d of snap.docs) {
      const u = d.data();
      const sessionsSnap = await getDocs(
        query(collection(db, "studySessions"), where("uid", "==", d.id))
      );
      const sessions = sessionsSnap.docs.map(s => s.data());
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const focusScores = sessions.filter(s => s.focusScore != null).map(s => s.focusScore);
      const avgFocusScore = focusScores.length > 0
        ? Math.round(focusScores.reduce((a: number, b: number) => a + b, 0) / focusScores.length)
        : 0;

      const tokenSnap = await getDoc(doc(db, "fcmTokens", d.id));
      const fcmToken = tokenSnap.exists() ? tokenSnap.data()?.token || null : null;

      const lastSession = sessions.length > 0
        ? sessions.sort((a, b) => {
            const ta = a.completedAt?.toDate?.() || new Date(0);
            const tb = b.completedAt?.toDate?.() || new Date(0);
            return tb.getTime() - ta.getTime();
          })[0]?.completedAt?.toDate?.()?.toISOString() || null
        : null;

      users.push({
        uid: d.id,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        isAdmin: u.isAdmin || false,
        fcmToken,
        createdAt: u.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActiveAt: u.lastActiveAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        totalSessions,
        totalMinutes,
        lastSession,
        avgFocusScore: String(avgFocusScore),
      });
    }
    return users;
  },

  async getUserSessions(uid: string) {
    const snap = await getDocs(
      query(collection(db, "studySessions"), where("uid", "==", uid), orderBy("completedAt", "desc"), limit(20))
    );
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
      };
    });
  },

  async getNotifications() {
    const snap = await getDocs(
      query(collection(db, "notifications"), orderBy("sentAt", "desc"), limit(50))
    );
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        sentAt: data.sentAt?.toDate?.()?.toISOString() || null,
      };
    });
  },

  async setAdmin(targetUid: string, isAdmin: boolean) {
    await updateDoc(doc(db, "users", targetUid), { isAdmin });
  },

  async sendNotification(payload: { targetUid?: string; title: string; body: string }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    const res = await fetch("/api/admin/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
};
