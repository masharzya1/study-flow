import { useState, useCallback } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, Check, Trash2, X } from "lucide-react";
import { SUBJECT_COLORS, SUBJECT_ICONS } from "@/types/study";
import { SubjectIcon } from "@/components/SubjectIcon";
import { VictoryScreen } from "@/components/VictoryScreen";
import type { Subject, Chapter, Topic } from "@/types/study";

const Subjects = () => {
  const { state, addSubject, updateSubject, deleteSubject, toggleTopicComplete, getSubjectProgress, gainXp } = useStudy();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SUBJECT_COLORS[0]);
  const [newIcon, setNewIcon] = useState(SUBJECT_ICONS[0]);
  const [addingChapter, setAddingChapter] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState("");
  const [addingTopic, setAddingTopic] = useState<string | null>(null);
  const [topicName, setTopicName] = useState("");
  const levels = state.settings.difficultyLevels || [];
  const [topicDifficulty, setTopicDifficulty] = useState<number>(levels.length > 0 ? levels[Math.floor(levels.length / 2)]?.id || 3 : 3);
  
  // Victory screen state
  const [victoryData, setVictoryData] = useState<{
    show: boolean;
    topicName: string;
    xpGained: number;
    newLevel: number;
    isLevelUp: boolean;
  }>({ show: false, topicName: "", xpGained: 0, newLevel: 0, isLevelUp: false });

  const handleTopicToggle = useCallback((subjectId: string, chapterId: string, topicId: string, topicName: string, difficulty: number) => {
    const wasCompleted = toggleTopicComplete(subjectId, chapterId, topicId);
    if (wasCompleted) {
      const xpGained = difficulty * 25; // 25-125 XP based on difficulty
      const { newLevel, isLevelUp } = gainXp(xpGained);
      setVictoryData({ show: true, topicName, xpGained, newLevel, isLevelUp });
    }
  }, [toggleTopicComplete, gainXp]);

  const createSubject = () => {
    if (!newName.trim()) return;
    const subject: Subject = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color: newColor,
      icon: newIcon,
      chapters: [],
      createdAt: new Date().toISOString(),
    };
    addSubject(subject);
    setNewName("");
    setShowCreate(false);
  };

  const createChapter = (subjectId: string) => {
    if (!chapterName.trim()) return;
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const chapter: Chapter = {
      id: crypto.randomUUID(),
      subjectId,
      name: chapterName.trim(),
      topics: [],
      priority: "medium",
    };
    updateSubject({ ...subject, chapters: [...subject.chapters, chapter] });
    setChapterName("");
    setAddingChapter(null);
  };

  const createTopic = (subjectId: string, chapterId: string) => {
    if (!topicName.trim()) return;
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const topic: Topic = {
      id: crypto.randomUUID(),
      chapterId,
      subjectId,
      name: topicName.trim(),
      difficulty: topicDifficulty,
      estimatedMinutes: (state.settings.difficultyLevels?.find(d => d.id === topicDifficulty)?.minutes || topicDifficulty * 15),
      completed: false,
      notes: "",
      revisionDates: [],
    };
    updateSubject({
      ...subject,
      chapters: subject.chapters.map(c =>
        c.id === chapterId ? { ...c, topics: [...c.topics, topic] } : c
      ),
    });
    setTopicName("");
    setAddingTopic(null);
  };

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organize your study material</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium hover-lift text-sm"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </motion.div>

      {/* Create Subject */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="glass-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">New Subject</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Subject name"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-foreground/20"
              onKeyDown={e => e.key === "Enter" && createSubject()}
              autoFocus
            />
            <div>
              <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">Icon</p>
              <div className="flex gap-2 flex-wrap">
                {SUBJECT_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      newIcon === icon ? "bg-foreground text-primary-foreground ring-2 ring-foreground" : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    <SubjectIcon name={icon} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">Color</p>
              <div className="flex gap-2 flex-wrap">
                {SUBJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      newColor === color ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : ""
                    }`}
                    style={{ backgroundColor: `hsl(${color})` }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={createSubject}
              className="w-full py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm"
            >
              Create Subject
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject List */}
      <div className="space-y-3">
        {state.subjects.length === 0 && !showCreate && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-base">No subjects yet</p>
            <p className="text-sm mt-1">Create your first subject to get started</p>
          </div>
        )}
        {state.subjects.map((subject, si) => {
          const progress = getSubjectProgress(subject.id);
          const isExpanded = expandedSubject === subject.id;
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.04 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `hsl(${subject.color} / 0.12)` }}
                >
                  <SubjectIcon name={subject.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{subject.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden max-w-[180px]">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: `hsl(${subject.color})` }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{progress}%</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {subject.chapters.map(chapter => {
                        const chapterExpanded = expandedChapter === chapter.id;
                        const chapterTopics = chapter.topics;
                        const chapterComplete = chapterTopics.filter(t => t.completed).length;
                        return (
                          <div key={chapter.id} className="rounded-xl bg-secondary/40">
                            <button
                              onClick={() => setExpandedChapter(chapterExpanded ? null : chapter.id)}
                              className="w-full flex items-center gap-2 p-3 text-left text-sm"
                            >
                              <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${chapterExpanded ? "rotate-90" : ""}`} />
                              <span className="font-medium flex-1">{chapter.name}</span>
                              <span className="text-[11px] text-muted-foreground">{chapterComplete}/{chapterTopics.length}</span>
                            </button>
                            <AnimatePresence>
                              {chapterExpanded && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                  <div className="px-3 pb-3 space-y-0.5">
                                    {chapterTopics.map(topic => (
                                      <button
                                        key={topic.id}
                                        onClick={() => handleTopicToggle(subject.id, chapter.id, topic.id, topic.name, topic.difficulty)}
                                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 transition-colors text-left text-sm"
                                      >
                                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                                          topic.completed ? "border-foreground bg-foreground" : "border-muted-foreground/40"
                                        }`}>
                                          {topic.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                        </div>
                                        <span className={topic.completed ? "line-through text-muted-foreground" : ""}>{topic.name}</span>
                                        <span className="ml-auto text-[11px] text-muted-foreground">{topic.estimatedMinutes}m</span>
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className={`w-1 h-1 rounded-full ${i < topic.difficulty ? "bg-foreground/60" : "bg-secondary"}`} />
                                          ))}
                                        </div>
                                      </button>
                                    ))}
                                    {addingTopic === chapter.id ? (
                                      <div className="flex gap-2 mt-1">
                                        <input
                                          value={topicName}
                                          onChange={e => setTopicName(e.target.value)}
                                          placeholder="Topic name"
                                          className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border-0 outline-none"
                                          autoFocus
                                          onKeyDown={e => e.key === "Enter" && createTopic(subject.id, chapter.id)}
                                        />
                                        <select
                                          value={topicDifficulty}
                                          onChange={e => setTopicDifficulty(Number(e.target.value))}
                                          className="px-2 py-1 text-xs rounded-lg bg-secondary text-foreground border-0"
                                        >
                                          {levels.map(d => (
                                            <option key={d.id} value={d.id}>{d.label}</option>
                                          ))}
                                        </select>
                                        <button onClick={() => createTopic(subject.id, chapter.id)} className="text-foreground text-xs font-medium">Add</button>
                                        <button onClick={() => setAddingTopic(null)} className="text-muted-foreground text-xs">Cancel</button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setAddingTopic(chapter.id)}
                                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors p-1.5"
                                      >
                                        <Plus className="w-3 h-3" /> Add topic
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {addingChapter === subject.id ? (
                        <div className="flex gap-2">
                          <input
                            value={chapterName}
                            onChange={e => setChapterName(e.target.value)}
                            placeholder="Chapter name"
                            className="flex-1 px-3 py-2 text-sm rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-0 outline-none"
                            autoFocus
                            onKeyDown={e => e.key === "Enter" && createChapter(subject.id)}
                          />
                          <button onClick={() => createChapter(subject.id)} className="text-foreground text-sm font-medium">Add</button>
                          <button onClick={() => setAddingChapter(null)} className="text-muted-foreground text-sm">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAddingChapter(subject.id)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors p-1.5"
                          >
                            <Plus className="w-3 h-3" /> Add chapter
                          </button>
                          <button
                            onClick={() => deleteSubject(subject.id)}
                            className="ml-auto flex items-center gap-1 text-[11px] text-destructive/50 hover:text-destructive transition-colors p-1.5"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Victory Screen */}
      <VictoryScreen
        show={victoryData.show}
        onClose={() => setVictoryData(prev => ({ ...prev, show: false }))}
        topicName={victoryData.topicName}
        xpGained={victoryData.xpGained}
        newLevel={victoryData.newLevel}
        isLevelUp={victoryData.isLevelUp}
      />
    </div>
  );
};

export default Subjects;
