import { useMemo, useState } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Clock, BookOpen, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SubjectIcon } from "@/components/SubjectIcon";
import { toast } from "@/hooks/use-toast";

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

const Revision = () => {
  const { state, markTopicReviewed } = useStudy();
  const maxDifficulty = state.settings.difficultyLevels?.length || 5;

  const revisionItems = useMemo(() => {
    const items: {
      topicId: string;
      chapterId: string;
      subjectId: string;
      topicName: string;
      subjectName: string;
      subjectIcon: string;
      subjectColor: string;
      completedAt: string;
      daysSinceComplete: number;
      nextReview: string;
      urgency: "overdue" | "today" | "upcoming" | "done";
      difficulty: number;
      revisionsCompleted: number;
    }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    state.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.topics
          .filter(t => t.completed && t.completedAt)
          .forEach(topic => {
            const completedDate = new Date(topic.completedAt!);
            const daysSince = Math.floor((today.getTime() - completedDate.getTime()) / 86400000);
            const revisionsDone = topic.revisionDates.length;
            const nextInterval = REVISION_INTERVALS[Math.min(revisionsDone, REVISION_INTERVALS.length - 1)];
            const nextReviewDate = new Date(completedDate);

            if (revisionsDone > 0) {
              const lastRevision = new Date(topic.revisionDates[topic.revisionDates.length - 1]);
              nextReviewDate.setTime(lastRevision.getTime() + nextInterval * 86400000);
            } else {
              nextReviewDate.setDate(completedDate.getDate() + nextInterval);
            }

            const daysUntilReview = Math.floor((nextReviewDate.getTime() - today.getTime()) / 86400000);

            let urgency: "overdue" | "today" | "upcoming" | "done";
            if (revisionsDone >= REVISION_INTERVALS.length) {
              urgency = "done";
            } else if (daysUntilReview < 0) {
              urgency = "overdue";
            } else if (daysUntilReview === 0) {
              urgency = "today";
            } else {
              urgency = "upcoming";
            }

            items.push({
              topicId: topic.id,
              chapterId: chapter.id,
              subjectId: subject.id,
              topicName: topic.name,
              subjectName: subject.name,
              subjectIcon: subject.icon,
              subjectColor: subject.color,
              completedAt: topic.completedAt!,
              daysSinceComplete: daysSince,
              nextReview: nextReviewDate.toISOString().split("T")[0],
              urgency,
              difficulty: topic.difficulty,
              revisionsCompleted: revisionsDone,
            });
          });
      });
    });

    const order = { overdue: 0, today: 1, upcoming: 2, done: 3 };
    items.sort((a, b) => order[a.urgency] - order[b.urgency] || b.difficulty - a.difficulty);
    return items;
  }, [state.subjects]);

  const overdue = revisionItems.filter(i => i.urgency === "overdue");
  const todayItems = revisionItems.filter(i => i.urgency === "today");
  const upcoming = revisionItems.filter(i => i.urgency === "upcoming").slice(0, 10);
  const mastered = revisionItems.filter(i => i.urgency === "done").length;

  const handleMarkReviewed = (item: typeof revisionItems[0]) => {
    markTopicReviewed(item.subjectId, item.chapterId, item.topicId);
    const newCount = item.revisionsCompleted + 1;
    toast({
      title: "✅ Revision recorded!",
      description: newCount >= REVISION_INTERVALS.length
        ? `${item.topicName} is now mastered!`
        : `${item.topicName} — ${newCount}/${REVISION_INTERVALS.length} revisions done`,
    });
  };

  const urgencyStyles = {
    overdue: "bg-destructive/10 text-destructive",
    today: "bg-accent/15 text-accent-foreground",
    upcoming: "bg-secondary text-muted-foreground",
    done: "bg-success/10 text-success",
  };

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto space-y-6 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Revision</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Spaced repetition scheduler</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-semibold text-destructive">{overdue.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Overdue</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-semibold">{todayItems.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Today</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-semibold text-success">{mastered}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Mastered</p>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-accent" />
          <p className="text-xs font-medium">Spaced Repetition</p>
        </div>
        <div className="flex items-center gap-1">
          {REVISION_INTERVALS.map((d, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                Day {d}
              </span>
              {i < REVISION_INTERVALS.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
            </div>
          ))}
        </div>
      </div>

      {revisionItems.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <RotateCcw className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No completed topics to revise</p>
          <p className="text-xs mt-1">Complete topics in Subjects to start revision</p>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section title="Overdue" icon={<AlertTriangle className="w-3.5 h-3.5 text-destructive" />} count={overdue.length}>
          {overdue.map(item => (
            <RevisionCard key={item.topicId} item={item} styles={urgencyStyles} maxDifficulty={maxDifficulty} onMarkReviewed={handleMarkReviewed} />
          ))}
        </Section>
      )}

      {/* Today */}
      {todayItems.length > 0 && (
        <Section title="Review Today" icon={<Clock className="w-3.5 h-3.5" />} count={todayItems.length}>
          {todayItems.map(item => (
            <RevisionCard key={item.topicId} item={item} styles={urgencyStyles} maxDifficulty={maxDifficulty} onMarkReviewed={handleMarkReviewed} />
          ))}
        </Section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section title="Coming Up" icon={<BookOpen className="w-3.5 h-3.5 text-muted-foreground" />} count={upcoming.length}>
          {upcoming.map(item => (
            <RevisionCard key={item.topicId} item={item} styles={urgencyStyles} maxDifficulty={maxDifficulty} onMarkReviewed={handleMarkReviewed} />
          ))}
        </Section>
      )}
    </div>
  );
};

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <span className="text-[10px] text-muted-foreground">({count})</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function RevisionCard({ item, styles, maxDifficulty, onMarkReviewed }: {
  item: any;
  styles: Record<string, string>;
  maxDifficulty: number;
  onMarkReviewed: (item: any) => void;
}) {
  const canReview = item.urgency === "overdue" || item.urgency === "today";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 flex items-center gap-3"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `hsl(${item.subjectColor} / 0.12)` }}
      >
        <SubjectIcon name={item.subjectIcon} className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.topicName}</p>
        <p className="text-[10px] text-muted-foreground">
          {item.subjectName} • {item.revisionsCompleted}/{REVISION_INTERVALS.length} reviews
        </p>
      </div>
      <span className={`text-[10px] px-2 py-1 rounded-md font-medium ${styles[item.urgency]}`}>
        {item.urgency === "overdue" ? "Overdue" : item.urgency === "today" ? "Today" :
          new Date(item.nextReview).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: maxDifficulty }).map((_, i) => (
          <div key={i} className={`w-1 h-1 rounded-full ${i < item.difficulty ? "bg-foreground/50" : "bg-secondary"}`} />
        ))}
      </div>
      {canReview && (
        <button
          onClick={() => onMarkReviewed(item)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-foreground text-primary-foreground text-[10px] font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <CheckCircle2 className="w-3 h-3" />
          Done
        </button>
      )}
    </motion.div>
  );
}

export default Revision;
