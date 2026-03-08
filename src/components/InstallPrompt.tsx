import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const INSTALL_DISMISSED_KEY = "penzo_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or already installed
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) return;

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Detect iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // On iOS, show custom prompt after delay
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[100] glass-card-elevated p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{t("install.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {isIOS ? t("install.iosDesc") : t("install.desc")}
              </p>
            </div>
            <button onClick={dismiss} className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={dismiss} className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t("install.later")}
            </button>
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-foreground text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" /> {t("install.install")}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
