import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fireSessionComplete } from "@/lib/confetti";
import { useLanguage } from "@/contexts/LanguageContext";

// Gaming victory texts inspired by popular games
const VICTORY_TEXTS = [
  // Call of Duty style
  { title: "MISSION COMPLETE", subtitle: "Target Eliminated", style: "cod" },
  { title: "VICTORY", subtitle: "Outstanding Performance", style: "cod" },
  { title: "OBJECTIVE SECURED", subtitle: "Well Done, Soldier", style: "cod" },
  { title: "KILLSTREAK!", subtitle: "Domination Achieved", style: "cod" },
  
  // PUBG style
  { title: "WINNER WINNER", subtitle: "CHICKEN DINNER! 🍗", style: "pubg" },
  { title: "#1 VICTORY", subtitle: "Last One Standing", style: "pubg" },
  { title: "TOP 1", subtitle: "You Outlasted Them All", style: "pubg" },
  
  // Mobile Legends style
  { title: "LEGENDARY!", subtitle: "Unstoppable Force", style: "ml" },
  { title: "SAVAGE!", subtitle: "Absolute Domination", style: "ml" },
  { title: "MANIAC!", subtitle: "They Can't Stop You", style: "ml" },
  { title: "MVP!", subtitle: "Most Valuable Player", style: "ml" },
  { title: "GODLIKE!", subtitle: "Beyond Human", style: "ml" },
  
  // Free Fire style  
  { title: "BOOYAH!", subtitle: "Champion of Champions", style: "ff" },
  { title: "#1 SQUAD", subtitle: "Victory Royale", style: "ff" },
  { title: "HEROIC!", subtitle: "You're a Legend", style: "ff" },
  
  // Valorant/CS style
  { title: "ACE!", subtitle: "Flawless Victory", style: "val" },
  { title: "CLUTCH!", subtitle: "Against All Odds", style: "val" },
  
  // Generic epic
  { title: "UNSTOPPABLE!", subtitle: "Nothing Can Hold You Back", style: "epic" },
  { title: "DOMINATION!", subtitle: "Total Control", style: "epic" },
  { title: "PERFECTION!", subtitle: "Zero Mistakes", style: "epic" },
  { title: "BEAST MODE!", subtitle: "Unleashed", style: "epic" },
  { title: "RAMPAGE!", subtitle: "They Never Saw It Coming", style: "epic" },
];

const XP_MESSAGES = [
  "XP earned — Level up incoming! 🚀",
  "Brain cells activated! 🧠⚡",
  "Knowledge power +100! 💪",
  "Study XP gained! 📚",
  "Skill tree expanded! 🌳",
];

interface VictoryScreenProps {
  show: boolean;
  onClose: () => void;
  topicName: string;
  xpGained: number;
  newLevel?: number;
  isLevelUp?: boolean;
  focusScore?: number;
  distractionCount?: number;
  bonusXp?: number;
}

export const VictoryScreen = ({ show, onClose, topicName, xpGained, newLevel, isLevelUp, focusScore, distractionCount, bonusXp }: VictoryScreenProps) => {
  const { t } = useLanguage();
  const [victory] = useState(() => VICTORY_TEXTS[Math.floor(Math.random() * VICTORY_TEXTS.length)]);
  const [xpMsg] = useState(() => XP_MESSAGES[Math.floor(Math.random() * XP_MESSAGES.length)]);

  useEffect(() => {
    if (show) {
      fireSessionComplete();
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Dark overlay with radial gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.92) 100%)",
            }}
          />

          {/* Animated scan lines */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
            }}
          />

          {/* Horizontal light sweep */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "200%", opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
            className="absolute inset-y-0 w-32"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)",
            }}
          />

          <div className="relative z-10 text-center px-6 max-w-lg">
            {/* Top decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="h-[2px] mx-auto mb-6 max-w-[200px]"
              style={{ background: "linear-gradient(90deg, transparent, hsl(45 93% 58%), transparent)" }}
            />

            {/* Main title */}
            <motion.h1
              initial={{ scale: 3, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.15 }}
              className="text-5xl md:text-7xl font-black tracking-tighter"
              style={{
                color: "hsl(45 93% 58%)",
                textShadow: "0 0 40px hsla(45,93%,58%,0.4), 0 0 80px hsla(45,93%,58%,0.15), 0 4px 0 rgba(0,0,0,0.3)",
                letterSpacing: "-0.04em",
              }}
            >
              {victory.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-lg md:text-xl font-medium mt-3 tracking-wide"
              style={{
                color: "rgba(255,255,255,0.7)",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {victory.subtitle}
            </motion.p>

            {/* Bottom decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="h-[1px] mx-auto mt-6 mb-6 max-w-[300px]"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
            />

            {/* Topic completed */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("comp.topicCompleted")}
              </p>
              <p className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                {topicName}
              </p>
            </motion.div>

            {/* XP Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mt-6 space-y-2"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 1.2, stiffness: 300 }}
                  className="text-2xl font-black"
                  style={{ color: "hsl(45 93% 58%)" }}
                >
                  +{xpGained} XP
                </motion.span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {xpMsg}
              </p>
            </motion.div>

            {/* Focus Score */}
            {focusScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="mt-4 space-y-2"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {t("focus.scoreLabel")}
                    </p>
                    <p className="text-3xl font-black mt-1" data-testid="text-focus-score" style={{
                      color: focusScore === 100 ? "hsl(152 60% 50%)" : focusScore >= 70 ? "hsl(45 93% 58%)" : "hsl(0 70% 60%)",
                    }}>
                      {focusScore}%
                    </p>
                  </div>
                  {(distractionCount ?? 0) > 0 && (
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {t("focus.distractions")}
                      </p>
                      <p className="text-xl font-bold mt-1" style={{ color: "hsl(0 70% 60%)" }}>
                        {distractionCount}
                      </p>
                    </div>
                  )}
                </div>
                {bonusXp && bonusXp > 0 && (
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.5, stiffness: 300 }}
                    className="text-sm font-bold"
                    style={{ color: "hsl(152 60% 50%)" }}
                  >
                    +{bonusXp} XP {t("focus.perfectBonus")}! 🎯
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Level Up */}
            {isLevelUp && newLevel && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 1.5, stiffness: 200 }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(45 93% 58% / 0.2), hsl(340 60% 55% / 0.2))",
                  border: "1px solid hsl(45 93% 58% / 0.3)",
                }}
              >
                <span className="text-xl">⬆️</span>
                <span className="font-bold text-sm" style={{ color: "hsl(45 93% 58%)" }}>
                  LEVEL UP! → Level {newLevel}
                </span>
              </motion.div>
            )}

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3, 0.5] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
              className="mt-8 text-xs tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {t("comp.tapContinue")}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
