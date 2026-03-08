import { useStudy } from "@/contexts/StudyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, ArrowRight, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubjectIcon } from "@/components/SubjectIcon";

export function TodayTasks() {
  const { state, toggleTopicComplete } = useStudy();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const plannedTasks = state.studyPlans.flatMap(plan =>
    plan.tasks.filter(task => task.date === today && !task.completed).map(task => {
      const subject = state.subjects.find(s => s.id === task.subjectId);
      let topicName = "Topic"; let chapterId = "";
      for (const s of state.subjects) { for (const c of s.chapters) { const tp = c.topics.find(tp => tp.id === task.topicId); if (tp) { topicName = tp.name; chapterId = c.id; break; } } }
      return { ...task, topicName, chapterId, subjectName: subject?.name || "", subjectColor: subject?.color || "220 15% 25%", subjectIcon: subject?.icon || "book-open" };
    })
  );

  const fallbackTopics = state.subjects.flatMap(s =>
    s.chapters.flatMap(c => c.topics.filter(t => !t.completed).map(t => ({ ...t, subjectName: s.name, subjectColor: s.color, subjectIcon: s.icon, subjectId: s.id, chapterId: c.id })))
  ).slice(0, 5);

  const tasks = plannedTasks.length > 0 ? plannedTasks : fallbackTopics;
  const isFromPlan = plannedTasks.length > 0;

  const recentComplete = state.subjects.flatMap(s =>
    s.chapters.flatMap(c => c.topics.filter(t => t.completed && t.completedAt?.startsWith(today)).map(t => ({ ...t, subjectName: s.name, subjectId: s.id, chapterId: c.id })))
  ).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="section-header">{isFromPlan ? t("comp.todayPlan") : t("comp.upNext")}</h2>
          {isFromPlan && <span className="chip-accent"><CalendarDays className="w-2.5 h-2.5 inline mr-0.5" />{plannedTasks.length} {t("plan.tasks")}</span>}
        </div>
        {isFromPlan && (
          <button onClick={() => navigate("/plan")} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
            {t("comp.viewPlan")} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {tasks.length === 0 && recentComplete.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">{t("comp.noTasks")}</p>
          <button onClick={() => navigate("/plan")} className="text-xs text-accent hover:underline mt-1">{t("comp.generatePlan")}</button>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.slice(0, 5).map((task: any) => (
            <button key={task.id || task.topicId} onClick={() => toggleTopicComplete(task.subjectId, task.chapterId, task.id || task.topicId)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-left group">
              <Circle className="w-[18px] h-[18px] text-muted-foreground/40 group-hover:text-foreground transition-colors flex-shrink-0" strokeWidth={1.8} />
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(${task.subjectColor})` }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.topicName || task.name}</p>
                <p className="text-[10px] text-muted-foreground">{task.subjectName}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{task.estimatedMinutes}m</span>
              {(task as any).type === "revision" && <span className="chip-accent">{t("timer.review")}</span>}
            </button>
          ))}
          {recentComplete.map(topic => (
            <div key={topic.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-40">
              <CheckCircle2 className="w-[18px] h-[18px] text-success flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm line-through truncate flex-1">{topic.name}</p>
              <span className="chip-success">{t("dash.done")}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
