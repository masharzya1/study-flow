import { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

// Ordered routes for swipe navigation (matches nav order)
const SWIPE_ROUTES = [
  "/",
  "/subjects",
  "/timer",
  "/plan",
  "/calendar",
  "/revision",
  "/analytics",
  "/settings",
];

const SWIPE_THRESHOLD = 50;

interface SwipeNavigationProps {
  children: React.ReactNode;
}

export function SwipeNavigation({ children }: SwipeNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const directionRef = useRef(0);

  const currentIndex = SWIPE_ROUTES.indexOf(location.pathname);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (currentIndex === -1) return;

      const { offset, velocity } = info;
      const swipe = Math.abs(offset.x) * velocity.x;

      if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
        // Swiped left → next page
        const nextIndex = currentIndex + 1;
        if (nextIndex < SWIPE_ROUTES.length) {
          directionRef.current = 1;
          navigate(SWIPE_ROUTES[nextIndex]);
        }
      } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
        // Swiped right → previous page
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          directionRef.current = -1;
          navigate(SWIPE_ROUTES[prevIndex]);
        }
      }
    },
    [currentIndex, navigate]
  );

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-30%" : "30%",
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence initial={false} custom={directionRef.current} mode="popLayout">
        <motion.div
          key={location.pathname}
          custom={directionRef.current}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 350, damping: 35 },
            opacity: { duration: 0.2 },
          }}
          drag={currentIndex !== -1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full min-h-full"
          style={{ touchAction: "pan-y" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Hook to get direction for programmatic navigation
export function useSwipeDirection() {
  const location = useLocation();
  const currentIndex = SWIPE_ROUTES.indexOf(location.pathname);

  return {
    currentIndex,
    totalPages: SWIPE_ROUTES.length,
    canSwipeLeft: currentIndex < SWIPE_ROUTES.length - 1,
    canSwipeRight: currentIndex > 0,
  };
}
