import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_KEY = "penzo_splashed";

export function SplashScreen() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(SPLASH_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
        localStorage.setItem(SPLASH_KEY, "true");
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <img
                src="/icon-192.png"
                alt="Penzó"
                className="w-14 h-14 object-contain"
              />
            </div>
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.3, 1.5] }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              style={{
                border: "2px solid hsl(var(--primary) / 0.3)",
              }}
            />
          </motion.div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 text-3xl font-bold tracking-tight text-foreground"
          >
            Penzó
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            Think. Plan. Master.
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-8 flex gap-1.5"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/40"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
