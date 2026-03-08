import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Timer, BarChart3, ArrowRight, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ONBOARDING_KEY = "studyforge_onboarded";

const steps = [
  { icon: BookOpen, color: "200 60% 45%", emoji: "📚" },
  { icon: Sparkles, color: "45 93% 58%", emoji: "✨" },
  { icon: Timer, color: "152 60% 42%", emoji: "⏱️" },
  { icon: BarChart3, color: "270 50% 55%", emoji: "📊" },
];

export function OnboardingTour() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  const stepTitles = [
    t("onboard.step1Title"),
    t("onboard.step2Title"),
    t("onboard.step3Title"),
    t("onboard.step4Title"),
  ];
  const stepDescs = [
    t("onboard.step1Desc"),
    t("onboard.step2Desc"),
    t("onboard.step3Desc"),
    t("onboard.step4Desc"),
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-5"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={close}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm glass-card-elevated p-6 space-y-6"
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3 pt-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-foreground mx-auto flex items-center justify-center">
                  <span className="text-primary-foreground text-2xl font-bold">SF</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{t("onboard.welcome")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboard.welcomeDesc")}</p>
              </motion.div>
            )}

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {step > 0 && (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `hsl(${steps[step].color} / 0.15)` }}
                    >
                      <span className="text-2xl">{steps[step].emoji}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{stepTitles[step]}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{stepDescs[step]}</p>
                    </div>
                  </div>
                )}

                {step === 0 && (
                  <div className="space-y-3">
                    {steps.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `hsl(${s.color} / 0.15)` }}
                        >
                          <span className="text-lg">{s.emoji}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{stepTitles[i]}</p>
                          <p className="text-[11px] text-muted-foreground">{stepDescs[i]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step ? "bg-foreground w-5" : i < step ? "bg-foreground/40" : "bg-secondary"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={close}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium"
              >
                {t("onboard.skip")}
              </button>
              <button
                onClick={next}
                className="flex-1 py-2.5 rounded-xl bg-foreground text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
              >
                {step < steps.length - 1 ? t("onboard.next") : t("onboard.getStarted")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
