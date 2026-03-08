import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ArrowRight, BookOpen, Sparkles, Timer, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPortal } from "react-dom";

const ONBOARDING_KEY = "paideia_onboarded";

interface TourStep {
  selector: string;
  titleKey: string;
  descKey: string;
  position: "bottom" | "top" | "left" | "right";
  icon: React.ElementType;
}

const tourSteps: TourStep[] = [
  {
    selector: '[data-tour="nav-subjects"]',
    titleKey: "onboard.step1Title",
    descKey: "onboard.step1Desc",
    position: "top",
    icon: BookOpen,
  },
  {
    selector: '[data-tour="nav-plan"]',
    titleKey: "onboard.step2Title",
    descKey: "onboard.step2Desc",
    position: "top",
    icon: Sparkles,
  },
  {
    selector: '[data-tour="focus-btn"]',
    titleKey: "onboard.step3Title",
    descKey: "onboard.step3Desc",
    position: "top",
    icon: Timer,
  },
  {
    selector: '[data-tour="nav-analytics"]',
    titleKey: "onboard.step4Title",
    descKey: "onboard.step4Desc",
    position: "top",
    icon: BarChart3,
  },
];

export function OnboardingTour() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const measureElement = useCallback(() => {
    if (!show) return;
    const el = document.querySelector(tourSteps[step]?.selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [step, show]);

  useEffect(() => {
    measureElement();
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureElement);
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measureElement]);

  const close = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else close();
  };

  if (!show) return null;

  const currentStep = tourSteps[step];
  const StepIcon = currentStep.icon;
  const padding = 6;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const gap = 14;
    const pos = currentStep.position;

    if (pos === "top") {
      return {
        bottom: `${window.innerHeight - rect.top + gap}px`,
        left: `${Math.max(12, Math.min(rect.left + rect.width / 2 - 150, window.innerWidth - 312))}px`,
      };
    }
    if (pos === "bottom") {
      return {
        top: `${rect.bottom + gap}px`,
        left: `${Math.max(12, Math.min(rect.left + rect.width / 2 - 150, window.innerWidth - 312))}px`,
      };
    }
    if (pos === "right") {
      return { top: `${rect.top + rect.height / 2 - 50}px`, left: `${rect.right + gap}px` };
    }
    return { top: `${rect.top + rect.height / 2 - 50}px`, right: `${window.innerWidth - rect.left + gap}px` };
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
          {/* Overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <defs>
              <mask id="tour-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <rect
                    x={rect.left - padding}
                    y={rect.top - padding}
                    width={rect.width + padding * 2}
                    height={rect.height + padding * 2}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0" y="0" width="100%" height="100%"
              fill="hsl(var(--background))"
              fillOpacity="0.85"
              mask="url(#tour-mask)"
              style={{ pointerEvents: "auto" }}
              onClick={close}
            />
          </svg>

          {/* Highlight pulse */}
          {rect && (
            <motion.div
              layoutId="tour-highlight"
              className="absolute rounded-xl"
              style={{
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
                pointerEvents: "none",
                border: "2px solid hsl(var(--accent))",
                boxShadow: "0 0 0 3px hsl(var(--accent) / 0.12), 0 0 20px hsl(var(--accent) / 0.08)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute w-[300px] glass-card-elevated p-4 space-y-3"
            style={getTooltipStyle()}
          >
            {/* Progress dots + close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {tourSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ width: i === step ? 20 : 6 }}
                    className={`h-1.5 rounded-full transition-colors duration-300 ${
                      i === step ? "bg-accent" : i < step ? "bg-accent/40" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
              <button onClick={close} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <StepIcon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{t(currentStep.titleKey)}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(currentStep.descKey)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">
                {t("onboard.skip")}
              </button>
              <button
                onClick={next}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-foreground text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {step < tourSteps.length - 1 ? (
                  <>{t("onboard.next")} <ChevronRight className="w-3 h-3" /></>
                ) : (
                  <>{t("onboard.getStarted")} <ArrowRight className="w-3 h-3" /></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
