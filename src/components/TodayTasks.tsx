import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export function TodayTasks() {
  const { state, toggleTopicComplete } = useStudy();

  const allTopics = state.subjects.flatMap(s =>
    s.chapters.flatMap(c =>
      c.topics.map(t => ({ ...t, subjectName: s.name, subjectColor: s.color, subjectId: s.id, chapterId: c.id }))
    )
  );

  const incomplete = allTopics.filter(t => !t.completed).slice(0, 5);
  const recentComplete = allTopics.filter(t => t.completed).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-5"
    >
      <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Tasks</h2>
      {incomplete.length === 0 && recentComplete.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Add subjects to see tasks here.
        </p>
      ) : (
        <div className="space-y-1">
          {incomplete.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopicComplete(topic.subjectId, topic.chapterId, topic.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left group"
            >
              <Circle className="w-[18px] h-[18px] text-muted-foreground/50 group-hover:text-foreground transition-colors flex-shrink-0" strokeWidth={1.8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{topic.name}</p>
                <p className="text-[11px] text-muted-foreground">{topic.subjectName}</p>
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {topic.estimatedMinutes}m
              </span>
            </button>
          ))}
          {recentComplete.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopicComplete(topic.subjectId, topic.chapterId, topic.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl opacity-40 text-left"
            >
              <CheckCircle2 className="w-[18px] h-[18px] text-foreground flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm line-through truncate">{topic.name}</p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
