import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, ArrowRight, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubjectIcon } from "@/components/SubjectIcon";

export function TodayTasks() {
  const { state, toggleTopicComplete } = useStudy();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  // Get today's planned tasks from study plans
  const plannedTasks = state.studyPlans.flatMap(plan =>
    plan.tasks
      .filter(t => t.date === today && !t.completed)
      .map(t => {
        const subject = state.subjects.find(s => s.id === t.subjectId);
        let topicName = "Topic";
        let chapterId = "";
        for (const s of state.subjects) {
          for (const c of s.chapters) {
            const topic = c.topics.find(tp => tp.id === t.topicId);
            if (topic) { topicName = topic.name; chapterId = c.id; break; }
          }
        }
        return {
          ...t,
          topicName,
          chapterId,
          subjectName: subject?.name || "",
          subjectColor: subject?.color || "220 15% 25%",
          subjectIcon: subject?.icon || "book-open",
        };
      })
  );

  // Fallback: if no plan tasks, show incomplete topics
  const fallbackTopics = state.subjects.flatMap(s =>
    s.chapters.flatMap(c =>
      c.topics
        .filter(t => !t.completed)
        .map(t => ({
          ...t,
          subjectName: s.name,
          subjectColor: s.color,
          subjectIcon: s.icon,
          subjectId: s.id,
          chapterId: c.id,
        }))
    )
  ).slice(0, 5);

  const tasks = plannedTasks.length > 0 ? plannedTasks : fallbackTopics;
  const isFromPlan = plannedTasks.length > 0;

  // Recent completed today
  const recentComplete = state.subjects.flatMap(s =>
    s.chapters.flatMap(c =>
      c.topics
        .filter(t => t.completed && t.completedAt?.startsWith(today))
        .map(t => ({ ...t, subjectName: s.name, subjectId: s.id, chapterId: c.id }))
    )
  ).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="section-header">
            {isFromPlan ? "Today's Plan" : "Up Next"}
          </h2>
          {isFromPlan && (
            <span className="chip-accent">
              <CalendarDays className="w-2.5 h-2.5 inline mr-0.5" />
              {plannedTasks.length} tasks
            </span>
          )}
        </div>
        {isFromPlan && (
          <button
            onClick={() => navigate("/plan")}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            View Plan <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {tasks.length === 0 && recentComplete.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No tasks for today</p>
          <button
            onClick={() => navigate("/plan")}
            className="text-xs text-accent hover:underline mt-1"
          >
            Generate a study plan →
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.slice(0, 5).map((task: any) => (
            <button
              key={task.id || task.topicId}
              onClick={() => toggleTopicComplete(
                task.subjectId,
                task.chapterId,
                task.id || task.topicId
              )}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-left group"
            >
              <Circle
                className="w-[18px] h-[18px] text-muted-foreground/40 group-hover:text-foreground transition-colors flex-shrink-0"
                strokeWidth={1.8}
              />
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: `hsl(${task.subjectColor})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {task.topicName || task.name}
                </p>
                <p className="text-[10px] text-muted-foreground">{task.subjectName}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedMinutes}m
              </span>
              {(task as any).type === "revision" && (
                <span className="chip-accent">Review</span>
              )}
            </button>
          ))}
          {recentComplete.map(topic => (
            <div
              key={topic.id}
              className="flex items-center gap-3 p-2.5 rounded-xl opacity-40"
            >
              <CheckCircle2 className="w-[18px] h-[18px] text-success flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm line-through truncate flex-1">{topic.name}</p>
              <span className="chip-success">Done</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
