import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight, ArrowRight, BookOpen, Sparkles, Timer, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPortal } from "react-dom";

const ONBOARDING_KEY = "penzo_onboarded";

interface TourStep {
  selector: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
}

const tourSteps: TourStep[] = [
  {
    selector: '[data-tour="nav-subjects"]',
    titleKey: "onboard.step1Title",
    descKey: "onboard.step1Desc",
    icon: BookOpen,
  },
  {
    selector: '[data-tour="nav-plan"]',
    titleKey: "onboard.step2Title",
    descKey: "onboard.step2Desc",
    icon: Sparkles,
  },
  {
    selector: '[data-tour="focus-btn"]',
    titleKey: "onboard.step3Title",
    descKey: "onboard.step3Desc",
    icon: Timer,
  },
  {
    selector: '[data-tour="nav-analytics"]',
    titleKey: "onboard.step4Title",
    descKey: "onboard.step4Desc",
    icon: BarChart3,
  },
];

function findVisibleElement(selector: string): Element | null {
  const els = document.querySelectorAll(selector);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    // Element must be visible and on-screen
    if (r.width > 0 && r.height > 0 && r.top >= -10 && r.bottom <= window.innerHeight + 10 && r.left >= -10 && r.right <= window.innerWidth + 10) {
      return el;
    }
  }
  return null; // Return null if no VISIBLE element found — don't fallback to hidden ones
}

export function OnboardingTour() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const delay = localStorage.getItem("penzo_splashed") ? 1200 : 3600;
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, []);

  const measureElement = useCallback(() => {
    if (!show) return;
    const el = findVisibleElement(tourSteps[step]?.selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [step, show]);

  useEffect(() => {
    if (!show) return;
    // Give DOM time to settle, then measure
    const timer = setTimeout(measureElement, 100);
    
    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureElement);
    };
    window.addEventListener("scroll", handleResize, true);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleResize, true);
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measureElement, show]);

  const close = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step < tourSteps.length - 1) {
      const nextStep = step + 1;
      // Skip steps where element isn't visible
      const nextEl = findVisibleElement(tourSteps[nextStep]?.selector);
      if (!nextEl && nextStep < tourSteps.length - 1) {
        setStep(nextStep + 1);
      } else if (!nextEl && nextStep >= tourSteps.length - 1) {
        close();
      } else {
        setStep(nextStep);
      }
    } else {
      close();
    }
  };

  if (!show) return null;

  const currentStep = tourSteps[step];
  const StepIcon = currentStep.icon;
  const pad = 8;

  // Calculate tooltip position relative to element
  const getTooltipPos = (): React.CSSProperties => {
    if (!rect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const leftPos = Math.max(12, Math.min(rect.left + rect.width / 2 - 148, window.innerWidth - 308));

    if (spaceBelow > 120) {
      return { top: `${rect.bottom + 14}px`, left: `${leftPos}px` };
    }
    return { bottom: `${window.innerHeight - rect.top + 14}px`, left: `${leftPos}px` };
  };

  // Count visible steps for progress
  const visibleSteps = tourSteps.filter(s => findVisibleElement(s.selector));
  const currentVisibleIndex = visibleSteps.findIndex(s => s.selector === currentStep.selector);

  return createPortal(
    <div className="fixed inset-0 z-[9999]" onClick={close}>
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-cutout">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - pad}
                y={rect.top - pad}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="black"
          opacity="0.55"
          mask="url(#tour-cutout)"
        />
      </svg>

      {/* Highlight ring around target */}
      {rect && (
        <motion.div
          key={`ring-${step}`}
          className="absolute pointer-events-none rounded-2xl"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 3px hsl(var(--primary) / 0.4), 0 0 20px hsl(var(--primary) / 0.15)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        key={step}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.05 }}
        className="absolute w-[296px] rounded-2xl bg-card border border-border shadow-2xl p-4 space-y-3"
        style={getTooltipPos()}
      >
        {/* Progress + close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {visibleSteps.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === currentVisibleIndex ? 18 : 6 }}
                className={`h-1.5 rounded-full ${
                  i === currentVisibleIndex
                    ? "bg-primary"
                    : i < currentVisibleIndex
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <StepIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{t(currentStep.titleKey)}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(currentStep.descKey)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
          >
            {t("onboard.skip")}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {step < tourSteps.length - 1 ? (
              <>{t("onboard.next")} <ChevronRight className="w-3 h-3" /></>
            ) : (
              <>{t("onboard.getStarted")} <ArrowRight className="w-3 h-3" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
