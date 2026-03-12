import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Bell, Clock, TrendingUp, Send, Search,
  ChevronDown, ChevronUp, Shield, X, CheckCircle,
  BarChart2, Calendar, Zap, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { firestoreService } from "@/lib/firestoreService";
import { useNavigate } from "react-router-dom";

interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  fcmToken: string | null;
  createdAt: string;
  lastActiveAt: string;
  totalSessions: number;
  totalMinutes: number;
  lastSession: string | null;
  avgFocusScore: string;
}

interface NotificationRecord {
  id: string;
  sentBy: string;
  targetUid: string | null;
  title: string;
  body: string;
  sentAt: string;
  successCount: number;
  failureCount: number;
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<Record<string, any[]>>({});
  const [tab, setTab] = useState<"users" | "notify" | "history">("users");

  const [notifTarget, setNotifTarget] = useState<"all" | string>("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: number; failure: number } | null>(null);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, notifsData] = await Promise.all([
        firestoreService.getAllUsers(),
        firestoreService.getNotifications(),
      ]);
      setUsers(usersData);
      setNotifications(notifsData as NotificationRecord[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSessions = async (uid: string) => {
    if (userSessions[uid]) return;
    try {
      const sessions = await firestoreService.getUserSessions(uid);
      setUserSessions(prev => ({ ...prev, [uid]: sessions }));
    } catch {}
  };

  const toggleUser = async (uid: string) => {
    if (expandedUser === uid) {
      setExpandedUser(null);
    } else {
      setExpandedUser(uid);
      await loadUserSessions(uid);
    }
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await firestoreService.sendNotification({
        targetUid: notifTarget === "all" ? undefined : notifTarget,
        title: notifTitle,
        body: notifBody,
      });
      setSendResult({ success: res.successCount, failure: res.failureCount });
      setNotifTitle("");
      setNotifBody("");
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  const toggleAdmin = async (uid: string, current: boolean) => {
    try {
      await firestoreService.setAdmin(uid, !current);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isAdmin: !current } : u));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const totalMinutes = users.reduce((s, u) => s + u.totalMinutes, 0);
  const totalSessions = users.reduce((s, u) => s + u.totalSessions, 0);
  const activeToday = users.filter(u => {
    if (!u.lastActiveAt) return false;
    const diff = Date.now() - new Date(u.lastActiveAt).getTime();
    return diff < 86400000;
  }).length;

  if (!isAdmin) return null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-0.5">{t("admin.subtitle")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: t("admin.totalUsers"), value: totalUsers, color: "text-blue-500" },
          { icon: Clock, label: t("admin.totalStudyTime"), value: formatMinutes(totalMinutes), color: "text-green-500" },
          { icon: BarChart2, label: t("admin.totalSessions"), value: totalSessions, color: "text-purple-500" },
          { icon: Zap, label: t("admin.activeToday"), value: activeToday, color: "text-yellow-500" },
        ].map(item => (
          <div key={item.label} className="glass-card p-4">
            <item.icon className={`w-4 h-4 ${item.color} mb-2`} />
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="flex gap-1 p-1 bg-secondary rounded-xl w-fit">
        {[
          { key: "users", label: t("admin.users"), icon: Users },
          { key: "notify", label: t("admin.sendNotif"), icon: Bell },
          { key: "history", label: t("admin.history"), icon: Calendar },
        ].map(tab_ => (
          <button
            key={tab_.key}
            onClick={() => setTab(tab_.key as any)}
            data-testid={`tab-admin-${tab_.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tab_.key ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab_.icon className="w-3.5 h-3.5" />
            {tab_.label}
          </button>
        ))}
      </motion.div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t("admin.loading")}</span>
        </div>
      )}

      {!loading && tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("admin.searchUsers")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-admin-search"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-secondary border-0 outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.uid} className="glass-card overflow-hidden">
                <button
                  onClick={() => toggleUser(u.uid)}
                  data-testid={`button-user-${u.uid}`}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div className="relative flex-shrink-0">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName || ""} className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                        {u.displayName?.[0] || u.email?.[0] || "?"}
                      </div>
                    )}
                    {u.fcmToken && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" title="Notifications enabled" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.displayName || "No name"}</p>
                      {u.isAdmin && <Shield className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 mr-2">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold">{formatMinutes(u.totalMinutes)}</p>
                      <p className="text-[10px] text-muted-foreground">{u.totalSessions} {t("admin.sessions")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">{t("admin.lastActive")}</p>
                      <p className="text-xs font-medium">{timeAgo(u.lastActiveAt)}</p>
                    </div>
                  </div>
                  {expandedUser === u.uid ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {expandedUser === u.uid && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-secondary/50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold">{formatMinutes(u.totalMinutes)}</p>
                            <p className="text-[10px] text-muted-foreground">{t("admin.totalTime")}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold">{u.totalSessions}</p>
                            <p className="text-[10px] text-muted-foreground">{t("admin.sessions")}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold">{u.avgFocusScore}%</p>
                            <p className="text-[10px] text-muted-foreground">{t("admin.avgFocus")}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">{t("admin.recentSessions")}</p>
                          {!userSessions[u.uid] ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                            </div>
                          ) : userSessions[u.uid].length === 0 ? (
                            <p className="text-xs text-muted-foreground">{t("admin.noSessions")}</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {userSessions[u.uid].slice(0, 10).map((s: any) => (
                                <div key={s.id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded-lg bg-secondary/40">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.sessionType === "focus" ? "bg-green-500" : "bg-blue-400"}`} />
                                  <span className="flex-1 truncate text-muted-foreground">
                                    {s.subjectName || s.topicName || s.sessionType}
                                  </span>
                                  <span className="font-medium">{s.durationMinutes}m</span>
                                  {s.focusScore != null && (
                                    <span className={`font-medium ${s.focusScore >= 80 ? "text-green-500" : s.focusScore >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                                      {s.focusScore}%
                                    </span>
                                  )}
                                  <span className="text-muted-foreground">{timeAgo(s.completedAt)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setNotifTarget(u.uid); setTab("notify"); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" /> {t("admin.sendNotifToUser")}
                          </button>
                          {u.uid !== user?.uid && (
                            <button
                              onClick={() => toggleAdmin(u.uid, u.isAdmin)}
                              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                                u.isAdmin
                                  ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {u.isAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!loading && tab === "notify" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">{t("admin.composeNotif")}</h2>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">{t("admin.recipient")}</label>
              <select
                value={notifTarget}
                onChange={e => setNotifTarget(e.target.value)}
                data-testid="select-notif-target"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary border-0 outline-none"
              >
                <option value="all">{t("admin.allUsers")} ({users.length})</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">{t("admin.notifTitle")}</label>
              <input
                type="text"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                placeholder={t("admin.notifTitlePlaceholder")}
                data-testid="input-notif-title"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary border-0 outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">{t("admin.notifBody")}</label>
              <textarea
                value={notifBody}
                onChange={e => setNotifBody(e.target.value)}
                placeholder={t("admin.notifBodyPlaceholder")}
                rows={3}
                data-testid="input-notif-body"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary border-0 outline-none resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">{t("admin.quickTemplates")}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { title: "Study Reminder", body: "Time to study! Your routine is waiting for you." },
                  { title: "Streak Alert", body: "Don't lose your study streak! Open Penzo now." },
                  { title: "Well done!", body: "Great job this week! Keep up the amazing work." },
                ].map(tpl => (
                  <button
                    key={tpl.title}
                    onClick={() => { setNotifTitle(tpl.title); setNotifBody(tpl.body); }}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-[11px] font-medium hover:bg-secondary/80 transition-colors"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={sendNotification}
              disabled={sending || !notifTitle.trim() || !notifBody.trim()}
              data-testid="button-send-notification"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? t("admin.sending") : t("admin.sendNow")}
            </button>

            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  {t("admin.sent")}: {sendResult.success} {t("admin.delivered")}, {sendResult.failure} {t("admin.failed")}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {!loading && tab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("admin.noNotifHistory")}</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">{timeAgo(n.sentAt)}</p>
                    <p className="text-[10px] mt-0.5">
                      <span className="text-green-500">{n.successCount}</span>
                      {n.failureCount > 0 && <span className="text-red-500 ml-1">{n.failureCount}</span>}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {n.targetUid ? `-> ${users.find(u => u.uid === n.targetUid)?.displayName || n.targetUid}` : `-> ${t("admin.allUsers")}`}
                </p>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
