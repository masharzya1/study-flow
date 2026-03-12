import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { firestoreService } from "@/lib/firestoreService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          const profile = await firestoreService.syncUser({
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
          });
          setIsAdmin(profile?.isAdmin || false);
        } catch (e) {
          console.warn("Could not sync user to Firestore:", e);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    let interval: ReturnType<typeof setInterval> | null = null;

    const startHeartbeat = () => {
      if (interval) return;
      firestoreService.updateLastActive().catch(() => {});
      interval = setInterval(() => {
        firestoreService.updateLastActive().catch(() => {});
      }, 120000);
    };

    const stopHeartbeat = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    };

    startHeartbeat();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
