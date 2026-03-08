import { useEffect, useRef } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { sendNotification, getNotificationPermission } from "@/lib/notifications";

// Spaced repetition intervals (same as Revision page)
const REVISION_INTERVALS = [1, 3, 7, 14, 30];

export const NotificationScheduler = () => {
  const { state, getTodayMinutes } = useStudy();
  const hasCheckedRevision = useRef(false);
  const reminderInterval = useRef<ReturnType<typeof setInterval>>();

  // Check revision due on app load
  useEffect(() => {
    if (hasCheckedRevision.current) return;
    if (getNotificationPermission() !== "granted") return;
    hasCheckedRevision.current = true;

    // Delay to not overwhelm on load
    const timer = setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let dueCount = 0;

      state.subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          chapter.topics
            .filter(t => t.completed && t.completedAt)
            .forEach(topic => {
              const completedDate = new Date(topic.completedAt!);
              const revisionsDone = topic.revisionDates?.length || 0;
              const nextInterval = REVISION_INTERVALS[Math.min(revisionsDone, REVISION_INTERVALS.length - 1)];

              const nextReviewDate = new Date(completedDate);
              if (revisionsDone > 0 && topic.revisionDates.length > 0) {
                const lastRevision = new Date(topic.revisionDates[topic.revisionDates.length - 1]);
                nextReviewDate.setTime(lastRevision.getTime() + nextInterval * 86400000);
              } else {
                nextReviewDate.setDate(completedDate.getDate() + nextInterval);
              }
              nextReviewDate.setHours(0, 0, 0, 0);

              if (nextReviewDate <= today) {
                dueCount++;
              }
            });
        });
      });

      if (dueCount > 0) {
        sendNotification("📚 Revision Due!", {
          body: `${dueCount}টি topic আজকে review করতে হবে। Revision page এ যাও!`,
          tag: "revision-due-check",
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [state.subjects]);

  // Periodic study reminder (every 2 hours while app is open)
  useEffect(() => {
    if (getNotificationPermission() !== "granted") return;

    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const lastReminder = sessionStorage.getItem("last-study-reminder");
    const now = Date.now();

    // Don't remind if recently reminded
    if (lastReminder && now - Number(lastReminder) < TWO_HOURS) return;

    reminderInterval.current = setInterval(() => {
      const todayMin = getTodayMinutes();
      const goal = state.settings.dailyGoalMinutes;

      if (todayMin < goal) {
        const remaining = goal - todayMin;
        sendNotification("⏰ পড়ার সময় হয়েছে!", {
          body: `আজকের goal এর জন্য আরো ${remaining} মিনিট বাকি আছে। চলো শুরু করি! 💪`,
          tag: "study-reminder",
        });
        sessionStorage.setItem("last-study-reminder", String(Date.now()));
      }
    }, TWO_HOURS);

    return () => {
      if (reminderInterval.current) clearInterval(reminderInterval.current);
    };
  }, [state.settings.dailyGoalMinutes, getTodayMinutes]);

  return null; // No UI - background scheduler
};
