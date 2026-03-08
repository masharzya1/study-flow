import confetti from "canvas-confetti";

export function fireSessionComplete() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"],
  });
}

export function fireStreakCelebration(streak: number) {
  const duration = streak >= 7 ? 3000 : 1500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#f59e0b", "#ef4444", "#8b5cf6"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#10b981", "#3b82f6", "#f59e0b"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
