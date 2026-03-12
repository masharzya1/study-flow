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
export const adminAuth = getAuth(adminApp);
export const adminMessaging = getMessaging(adminApp);
export const adminFirestore = getFirestore(adminApp);
