import { Moon, Sun, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";

export function HeaderControls({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const { state, updateSettings } = useStudy();
  const isDark = state.settings.theme === "dark";

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      {/* Language toggle */}
      <button
        onClick={() => setLanguage(language === "en" ? "bn" : "en")}
        className="relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
        title={language === "en" ? "বাংলায় পরিবর্তন করুন" : "Switch to English"}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold uppercase">{language === "en" ? "BN" : "EN"}</span>
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all overflow-hidden"
        title={isDark ? "Light mode" : "Dark mode"}
      >
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ y: -16, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 16, opacity: 0, rotate: 45 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </motion.div>
      </button>
    </div>
  );
}
