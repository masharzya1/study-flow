import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fireStreakCelebration } from "@/lib/confetti";
import { Flame, Trophy, Crown, Star, Zap } from "lucide-react";

const MILESTONES = [
  { days: 3, title: "GETTING STARTED", subtitle: "3-Day Streak!", icon: Zap, emoji: "🔥", gradient: "from-orange-500 to-amber-400" },
  { days: 7, title: "ONE WEEK WARRIOR", subtitle: "7-Day Streak!", icon: Flame, emoji: "⚡", gradient: "from-amber-500 to-yellow-400" },
  { days: 14, title: "UNSTOPPABLE", subtitle: "14-Day Streak!", icon: Star, emoji: "🌟", gradient: "from-yellow-400 to-orange-500" },
  { days: 30, title: "MONTHLY LEGEND", subtitle: "30-Day Streak!", icon: Trophy, emoji: "🏆", gradient: "from-yellow-500 to-amber-600" },
  { days: 50, title: "HALF CENTURY", subtitle: "50-Day Streak!", icon: Crown, emoji: "👑", gradient: "from-amber-400 to-yellow-500" },
  { days: 100, title: "CENTURION", subtitle: "100-Day Streak!", icon: Crown, emoji: "💎", gradient: "from-purple-500 to-indigo-500" },
  { days: 200, title: "DOUBLE CENTURY", subtitle: "200-Day Streak!", icon: Crown, emoji: "🔱", gradient: "from-indigo-500 to-purple-600" },
  { days: 365, title: "YEAR OF GLORY", subtitle: "365-Day Streak!", icon: Crown, emoji: "🏅", gradient: "from-yellow-400 to-red-500" },
];

interface StreakMilestoneProps {
  show: boolean;
  streak: number;
  onClose: () => void;
}

export function StreakMilestone({ show, streak, onClose }: StreakMilestoneProps) {
  const milestone = MILESTONES.find(m => m.days === streak) || MILESTONES[0];
  const Icon = milestone.icon;

  useEffect(() => {
    if (show) {
      fireStreakCelebration(streak);
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, streak, onClose]);

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
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.9) 100%)",
            }}
          />

          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: "100%", x: `${10 + Math.random() * 80}%` }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [100, -200],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute text-2xl"
              >
                {["✨", "🔥", "⭐", "💫"][i % 4]}
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 text-center px-6 max-w-md">
            {/* Glowing ring */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.1 }}
              className="mx-auto mb-6 w-28 h-28 rounded-full flex items-center justify-center relative"
            >
              {/* Outer glow */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${milestone.gradient} blur-xl`}
              />
              {/* Inner circle */}
              <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${milestone.gradient} flex items-center justify-center shadow-2xl`}>
                <span className="text-4xl">{milestone.emoji}</span>
              </div>
            </motion.div>

            {/* Streak count */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3, stiffness: 200 }}
              className="mb-2"
            >
              <span
                className="text-6xl md:text-7xl font-black tabular-nums"
                style={{
                  background: "linear-gradient(135deg, hsl(45 93% 58%), hsl(25 80% 50%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 4px 20px hsla(45,93%,58%,0.3))",
                }}
              >
                {streak}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl md:text-4xl font-black tracking-tight"
              style={{
                color: "hsl(45 93% 58%)",
                textShadow: "0 0 30px hsla(45,93%,58%,0.3), 0 4px 0 rgba(0,0,0,0.3)",
              }}
            >
              {milestone.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-lg font-medium mt-2"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {milestone.subtitle}
            </motion.p>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="h-[1px] mx-auto mt-5 mb-5 max-w-[200px]"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)" }}
            />

            {/* Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-4 h-4" style={{ color: "hsl(25 80% 50%)" }} />
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {streak} days of consistent studying
                </p>
                <Flame className="w-4 h-4" style={{ color: "hsl(25 80% 50%)" }} />
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Keep going — you're building something great!
              </p>
            </motion.div>

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3, 0.5] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
              className="mt-8 text-xs tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Tap to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const STREAK_MILESTONES = MILESTONES.map(m => m.days);
