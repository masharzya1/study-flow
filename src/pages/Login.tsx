import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SiGoogle } from "react-icons/si";
import { BookOpen } from "lucide-react";
import penzoLogo from "@/assets/penzo-logo.png";
import { useState } from "react";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center overflow-hidden shadow-lg">
            <img src={penzoLogo} alt="Penzó" className="w-10 h-10 object-contain invert dark:invert-0" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Penzó</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.tagline")}</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("auth.welcome")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.signInDesc")}</p>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            data-testid="button-google-signin"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-foreground text-primary-foreground font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <SiGoogle className="w-4 h-4" />
            )}
            {loading ? t("auth.signingIn") : t("auth.continueWithGoogle")}
          </button>
        </div>

        <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground">
          <BookOpen className="w-3 h-3" />
          <span>{t("auth.freeForever")}</span>
        </div>
      </motion.div>
    </div>
  );
}
