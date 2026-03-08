import { useStudy } from "@/contexts/StudyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { SubjectIcon } from "@/components/SubjectIcon";

export function SubjectCards() {
  const { state, getSubjectProgress } = useStudy();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t("dash.subjects")}</h2>
        <button onClick={() => navigate("/subjects")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <Plus className="w-3.5 h-3.5" /> {t("comp.addSubjects")}
        </button>
      </div>
      {state.subjects.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">{t("comp.noSubjectsYet")}</p>
      ) : (
        <div className="space-y-2">
          {state.subjects.map(subject => {
            const progress = getSubjectProgress(subject.id);
            return (
              <button key={subject.id} onClick={() => navigate("/subjects")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `hsl(${subject.color} / 0.12)` }}>
                  <SubjectIcon name={subject.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{subject.name}</p>
                  <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: `hsl(${subject.color})` }} />
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
