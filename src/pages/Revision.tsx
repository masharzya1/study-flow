import { useMemo } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { RotateCcw, Clock, BookOpen, Zap, AlertTriangle } from "lucide-react";
import { SubjectIcon } from "@/components/SubjectIcon";

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

const Revision = () => {
  const { state } = useStudy();
  const { t } = useLanguage();

  const revisionItems = useMemo(() => {
    const items: any[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    state.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.topics.filter(tp => tp.completed && tp.completedAt).forEach(topic => {
          const completedDate = new Date(topic.completedAt!);
          const daysSince = Math.floor((today.getTime() - completedDate.getTime()) / 86400000);
          const revisionsDone = topic.revisionDates.length;
          const nextInterval = REVISION_INTERVALS[Math.min(revisionsDone, REVISION_INTERVALS.length - 1)];
          const nextReviewDate = new Date(completedDate);
          if (revisionsDone > 0) { const lastRevision = new Date(topic.revisionDates[topic.revisionDates.length - 1]); nextReviewDate.setTime(lastRevision.getTime() + nextInterval * 86400000); }
          else { nextReviewDate.setDate(completedDate.getDate() + nextInterval); }
          const daysUntilReview = Math.floor((nextReviewDate.getTime() - today.getTime()) / 86400000);
          let urgency: "overdue" | "today" | "upcoming" | "done";
          if (revisionsDone >= REVISION_INTERVALS.length) urgency = "done";
          else if (daysUntilReview < 0) urgency = "overdue";
          else if (daysUntilReview === 0) urgency = "today";
          else urgency = "upcoming";
          items.push({ topicId: topic.id, chapterId: chapter.id, subjectId: subject.id, topicName: topic.name, subjectName: subject.name, subjectIcon: subject.icon, subjectColor: subject.color, completedAt: topic.completedAt!, daysSinceComplete: daysSince, nextReview: nextReviewDate.toISOString().split("T")[0], urgency, difficulty: topic.difficulty });
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
  const levels = state.settings.difficultyLevels || [];

  const urgencyStyles = { overdue: "bg-destructive/10 text-destructive", today: "bg-accent/15 text-accent-foreground", upcoming: "bg-secondary text-muted-foreground", done: "bg-success/10 text-success" };

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto space-y-6 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">{t("revision.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("revision.subtitle")}</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center"><p className="text-xl font-semibold text-destructive">{overdue.length}</p><p className="text-[10px] text-muted-foreground mt-0.5">{t("revision.overdue")}</p></div>
        <div className="glass-card p-3 text-center"><p className="text-xl font-semibold">{todayItems.length}</p><p className="text-[10px] text-muted-foreground mt-0.5">{t("revision.today")}</p></div>
        <div className="glass-card p-3 text-center"><p className="text-xl font-semibold text-success">{mastered}</p><p className="text-[10px] text-muted-foreground mt-0.5">{t("revision.mastered")}</p></div>
      </div>
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-accent" /><p className="text-xs font-medium">{t("revision.spacedRepetition")}</p></div>
        <div className="flex items-center gap-1 flex-wrap">
          {REVISION_INTERVALS.map((d, i) => (<div key={i} className="flex items-center gap-1"><span className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground">Day {d}</span>{i < REVISION_INTERVALS.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}</div>))}
        </div>
      </div>
      {revisionItems.length === 0 && (
        <div className="text-center py-16 text-muted-foreground"><RotateCcw className="w-8 h-8 mx-auto mb-3 opacity-40" /><p className="text-sm">{t("revision.noTopics")}</p><p className="text-xs mt-1">{t("revision.completeFirst")}</p></div>
      )}
      {overdue.length > 0 && (<Section title={t("revision.overdue")} icon={<AlertTriangle className="w-3.5 h-3.5 text-destructive" />} count={overdue.length}>{overdue.map(item => <RevisionCard key={item.topicId} item={item} styles={urgencyStyles} levels={levels} t={t} />)}</Section>)}
      {todayItems.length > 0 && (<Section title={t("revision.reviewToday")} icon={<Clock className="w-3.5 h-3.5" />} count={todayItems.length}>{todayItems.map(item => <RevisionCard key={item.topicId} item={item} styles={urgencyStyles} levels={levels} t={t} />)}</Section>)}
      {upcoming.length > 0 && (<Section title={t("revision.comingUp")} icon={<BookOpen className="w-3.5 h-3.5 text-muted-foreground" />} count={upcoming.length}>{upcoming.map(item => <RevisionCard key={item.topicId} item={item} styles={urgencyStyles} levels={levels} t={t} />)}</Section>)}
    </div>
  );
};

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (<div className="space-y-2"><div className="flex items-center gap-2">{icon}<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p><span className="text-[10px] text-muted-foreground">({count})</span></div><div className="space-y-1.5">{children}</div></div>);
}

function RevisionCard({ item, styles, levels, t }: { item: any; styles: Record<string, string>; levels: any[]; t: (key: string) => string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `hsl(${item.subjectColor} / 0.12)` }}><SubjectIcon name={item.subjectIcon} className="w-3.5 h-3.5" /></div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.topicName}</p><p className="text-[10px] text-muted-foreground">{item.subjectName}</p></div>
      <span className={`text-[10px] px-2 py-1 rounded-md font-medium flex-shrink-0 ${styles[item.urgency]}`}>
        {item.urgency === "overdue" ? t("revision.overdue") : item.urgency === "today" ? t("revision.today") : new Date(item.nextReview).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
      <div className="flex gap-0.5 flex-shrink-0">
        {levels.map((_: any, i: number) => (<div key={i} className={`w-1 h-1 rounded-full ${i < item.difficulty ? "bg-foreground/50" : "bg-secondary"}`} />))}
      </div>
    </motion.div>
  );
}

export default Revision;
