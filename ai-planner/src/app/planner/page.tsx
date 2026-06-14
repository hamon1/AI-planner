"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import s from "./planner.module.css";
import {
  getRole,
  getIsPro,
  isDev,
  getChecklist,
  createChecklist,
  saveChecklist,
  toggleItem,
  type DailyChecklist,
  type UserRole,
} from "@/lib/checklist";

type Category = keyof typeof CAT;
type PriKey   = keyof typeof PRI;

interface ScheduleItem { time: string; duration: number; task: string; category: Category; priority: PriKey; tip: string; }
interface PriorityItem { rank: number; label: string; reason: string; emoji: string; }
interface WeekTask { label: string; category: Category; priority: PriKey; }
interface WeekDay { day: string; focus: string; energy: "high" | "medium" | "low"; tasks: WeekTask[]; tip: string; }

interface DailyPlan {
  summary: string; dailyMantra: string;
  priorities: PriorityItem[];
  schedule: ScheduleItem[];
  energyMap: { peak: string; low: string; advice: string };
  promptTemplate: string;
}
interface WeeklyPlan {
  summary: string; weeklyMantra: string;
  weekGoals: PriorityItem[];
  days: WeekDay[];
  energyMap: { peak: string; low: string; advice: string };
  promptTemplate: string;
}
type PlanResult = DailyPlan | WeeklyPlan;
function isWeekly(p: PlanResult): p is WeeklyPlan { return "days" in p; }

interface SavedPlan { id: string; createdAt: string; mode: string; role: string; goals: string; plan: PlanResult; }

const STORAGE_KEY = "ai-planner-history";
const USAGE_KEY   = "ai-planner-usage";
const MAX_HISTORY = 20;
const FREE_LIMIT  = 3;

const CAT = { 집중: "#5046e4", 루틴: "#059669", 휴식: "#d97706", 운동: "#dc2626", 학습: "#2563eb", 업무: "#7c3aed" } as const;
const PRI = { high: ["HIGH", "#dc2626"], medium: ["MED", "#d97706"], low: ["LOW", "#9ca3af"] } as const;

function loadHistory(): SavedPlan[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedPlan[]; } catch { return []; }
}
function saveToHistory(entry: SavedPlan): SavedPlan[] {
  const next = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
function deleteFromHistory(id: string): SavedPlan[] {
  const next = loadHistory().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function getTodayCount(): number {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw) as { date: string; count: number };
    return new Date().toISOString().slice(0, 10) === date ? count : 0;
  } catch { return 0; }
}
function incrementCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  const next  = getTodayCount() + 1;
  localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: next }));
  return next;
}

export default function App() {
  const [step, setStep]           = useState("input");
  const [mode, setMode]           = useState("daily");
  const [form, setForm]           = useState({ role: "", goals: "", personality: "", constraints: "", wakeTime: "07:00", sleepTime: "23:00", energyType: "아침형", stressLevel: "3" });
  const [result, setResult]       = useState<PlanResult | null>(null);
  const [error, setError]         = useState("");
  const [errDetail, setErrDetail] = useState("");
  const [tab, setTab]             = useState("schedule");
  const [history, setHistory]     = useState<SavedPlan[]>([]);
  const [copiedDay, setCopiedDay] = useState<string | null>(null);
  const [usageCount, setUsageCount]   = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [role, setRole]               = useState<UserRole>("free");
  const [checklist, setChecklist]     = useState<DailyChecklist | null>(null);

  const isPro = role === "pro" || role === "dev";

  useEffect(() => {
    setHistory(loadHistory());
    setUsageCount(getTodayCount());
    setRole(getRole());
  }, []);

  const upd = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const generate = async () => {
    if (!form.role && !form.goals) { setError("직업/역할 또는 목표를 입력해주세요."); return; }
    if (!isPro && usageCount >= FREE_LIMIT) { setShowUpgrade(true); return; }
    setError(""); setErrDetail(""); setStep("loading");
    const msg = `[${mode === "daily" ? "오늘" : "이번주"} 스케줄]\n직업:${form.role || "미입력"}\n목표:${form.goals || "미입력"}\n성향:${form.personality || "없음"}\n제약:${form.constraints || "없음"}\n기상:${form.wakeTime}/취침:${form.sleepTime}\n에너지:${form.energyType}/스트레스:${form.stressLevel}/5\nJSON만 반환`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60_000);
      try {
        const res  = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, mode }), signal: controller.signal });
        const data = await res.json() as PlanResult & { error?: string };
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        const entry: SavedPlan = { id: Date.now().toString(), createdAt: new Date().toISOString(), mode, role: form.role, goals: form.goals, plan: data };
        setHistory(saveToHistory(entry));
        if (!isPro) setUsageCount(incrementCount());
        setResult(data);
        setChecklist(null);
        setTab("schedule");
        setStep("result");
      } finally { clearTimeout(timer); }
    } catch (e) {
      const isTimeout = e instanceof DOMException && e.name === "AbortError";
      setError(isTimeout ? "요청 시간이 초과되었습니다 (60초). 다시 시도해주세요." : "스케줄 생성 중 오류가 발생했습니다.");
      setErrDetail(!isTimeout && e instanceof Error ? e.message : "");
      setStep("input");
    }
  };

  const copyDay = (d: WeekDay) => {
    const text = `[${d.day}요일] ${d.focus}\n${d.tasks.map(t => `- ${t.label}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedDay(d.day);
    setTimeout(() => setCopiedDay(null), 2000);
  };

  const switchTab = (id: string) => {
    setTab(id);
    if (id === "checklist" && result && !isWeekly(result)) {
      const today = new Date().toISOString().slice(0, 10);
      let cl = getChecklist(today);
      if (!cl) {
        cl = createChecklist(Date.now().toString(), (result as DailyPlan).schedule);
        saveChecklist(cl);
      }
      setChecklist(cl);
    }
  };

  const handleToggle = (itemId: string) => {
    const today   = new Date().toISOString().slice(0, 10);
    const updated = toggleItem(today, itemId);
    if (updated) setChecklist(updated);
  };

  const restorePlan = (saved: SavedPlan) => { setMode(saved.mode); setResult(saved.plan); setChecklist(null); setTab("schedule"); setStep("result"); };
  const removePlan  = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setHistory(deleteFromHistory(id)); };

  const remaining = Math.max(0, FREE_LIMIT - usageCount);

  /* ── Top Bar ── */
  const topBar = (
    <div className={s.topBar}>
      {role === "dev" ? (
        <span className={s.devBadge}>DEV</span>
      ) : role === "pro" ? (
        <span className={s.proBadge}>Pro ✓</span>
      ) : (
        <span className={s.usageBadge}>남은 횟수 {remaining} / {FREE_LIMIT}</span>
      )}
      <div className={s.topActions}>
        {isPro && <Link href="/stats" className={s.topBtn}>통계</Link>}
        {role !== "dev" && <Link href="/login" className={s.topBtn}>로그인</Link>}
        {role === "free" && <Link href="/pricing" className={s.topBtnPro}>Pro</Link>}
      </div>
    </div>
  );

  /* ── Upgrade Modal ── */
  const upgradeModal = showUpgrade && (
    <div className={s.modalOverlay} onClick={() => setShowUpgrade(false)}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <button className={s.modalClose} onClick={() => setShowUpgrade(false)}>×</button>
        <p className={s.modalEyebrow}>무료 횟수 소진</p>
        <h2 className={s.modalTitle}>오늘 무료 생성을<br />모두 사용했어요</h2>
        <div className={s.planCompare}>
          <div className={s.planRow}>
            <span className={s.planName}>무료</span>
            <span className={s.planLimit}>하루 {FREE_LIMIT}회</span>
          </div>
          <div className={s.planRowPro}>
            <span className={s.planName}>Pro</span>
            <span className={s.planLimit}>무제한 ✓</span>
          </div>
        </div>
        <Link href="/pricing" className={s.upgradeCta} style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          Pro 업그레이드 — 월 4,900원
        </Link>
        <button className={s.modalDismiss} onClick={() => setShowUpgrade(false)}>내일 다시 시도하기</button>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (step === "loading") return (
    <div className={s.loadingPage}>
      <div className={s.loadingInner}>
        <div className={s.loadingTitle}>일정 분석 중<span className={s.dot}>.</span><span className={s.dot}>.</span><span className={s.dot}>.</span></div>
        <p className={s.loadingDesc}>{mode === "daily" ? "오늘" : "이번 주"} 하루를 설계하고 있어요</p>
      </div>
    </div>
  );

  /* ── Result ── */
  if (step === "result" && result) {
    const weekly = isWeekly(result);

    const DAILY_TABS: [string, string][] = [
      ["schedule", "스케줄"],
      ["priority", "우선순위"],
      ["energy", "에너지"],
      ...(isPro ? [["checklist", "체크리스트"] as [string, string]] : []),
    ];
    const WEEKLY_TABS: [string, string][] = [["week", "주간 계획"], ["goals", "목표"], ["energy", "에너지"]];
    const TABS = weekly ? WEEKLY_TABS : DAILY_TABS;

    const energyBg:  Record<string, string> = { high: "#dcfce7", medium: "#fef9c3", low: "#f1f5f9" };
    const energyTxt: Record<string, string> = { high: "#166534", medium: "#854d0e", low: "#475569" };

    const doneCount = checklist?.items.filter(it => it.done).length ?? 0;
    const totalCount = checklist?.items.length ?? 0;

    return (
      <div className={s.page}>
        {upgradeModal}
        <div className={s.wrap}>
          {topBar}
          <div className={s.resultMeta}>
            <span className={s.eyebrow}>{weekly ? "Weekly Plan" : "Today's Plan"}</span>
            <button className={s.newPlanBtn} onClick={() => setStep("input")}>새 플랜</button>
          </div>
          <h1 className={s.mantra}>{weekly ? (result as WeeklyPlan).weeklyMantra : (result as DailyPlan).dailyMantra}</h1>
          <p className={s.summary}>{result.summary}</p>
          <hr className={s.divider} />

          <div className={s.tabs}>
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => switchTab(id)} className={tab === id ? s.tabBtnActive : s.tabBtn}>
                {label}
                {id === "checklist" && totalCount > 0 && (
                  <span className={s.clBadge}>{doneCount}/{totalCount}</span>
                )}
              </button>
            ))}
          </div>

          {!weekly && tab === "schedule" && (result as DailyPlan).schedule.map((it, i) => (
            <div key={i} className={s.scheduleItem}>
              <div className={s.timeCol}>
                <div className={s.timeText}>{it.time}</div>
                <div className={s.durationText}>{it.duration}분</div>
              </div>
              <div className={s.taskCol}>
                <div className={s.taskHeader}>
                  <span className={s.catDot} style={{ background: CAT[it.category] ?? "#666" }} />
                  <span className={s.taskName}>{it.task}</span>
                  <span className={s.priLabel} style={{ color: PRI[it.priority]?.[1] ?? "#999" }}>{PRI[it.priority]?.[0]}</span>
                </div>
                {it.tip && <p className={s.taskTip}>→ {it.tip}</p>}
              </div>
            </div>
          ))}

          {weekly && tab === "week" && (result as WeeklyPlan).days.map((d) => (
            <div key={d.day} className={s.weekDayCard}>
              <div className={s.weekDayHeader}>
                <div className={s.weekDayTitle}>
                  <span className={s.weekDayName}>{d.day}요일</span>
                  <span className={s.weekDayFocus}>{d.focus}</span>
                </div>
                <span className={s.weekEnergyBadge} style={{ background: energyBg[d.energy] ?? "#f1f5f9", color: energyTxt[d.energy] ?? "#475569" }}>
                  {d.energy === "high" ? "고에너지" : d.energy === "medium" ? "중에너지" : "저에너지"}
                </span>
              </div>
              <div className={s.weekTaskList}>
                {d.tasks.map((t, i) => (
                  <div key={i} className={s.weekTask}>
                    <span className={s.catDot} style={{ background: CAT[t.category] ?? "#666" }} />
                    <span className={s.weekTaskLabel}>{t.label}</span>
                    <span className={s.priLabel} style={{ color: PRI[t.priority]?.[1] ?? "#999" }}>{PRI[t.priority]?.[0]}</span>
                  </div>
                ))}
              </div>
              <div className={s.weekDayTipRow}>
                {d.tip && <p className={s.weekDayTip}>→ {d.tip}</p>}
                <button className={s.weekCopyBtn} onClick={() => copyDay(d)}>{copiedDay === d.day ? "✓ 복사됨" : "복사"}</button>
              </div>
            </div>
          ))}

          {((!weekly && tab === "priority") || (weekly && tab === "goals")) &&
            (weekly ? (result as WeeklyPlan).weekGoals : (result as DailyPlan).priorities).map((p, i) => (
              <div key={i} className={s.priorityItem}>
                <span className={s.priorityRank}>{String(p.rank).padStart(2, "0")}</span>
                <div>
                  <div className={s.priorityLabel}>{p.emoji} {p.label}</div>
                  <div className={s.priorityReason}>{p.reason}</div>
                </div>
              </div>
            ))
          }

          {tab === "energy" && result.energyMap && (
            <div>
              <div className={s.energyGrid}>
                <div className={s.energyCellBorder}>
                  <div className={s.energyCellLabel}>PEAK</div>
                  <div className={s.energyCellValue}>{result.energyMap.peak}</div>
                </div>
                <div className={s.energyCell}>
                  <div className={s.energyCellLabel}>LOW</div>
                  <div className={s.energyCellValue}>{result.energyMap.low}</div>
                </div>
              </div>
              <div className={s.adviceBox}>
                <div className={s.adviceLabel}>ADVICE</div>
                <p className={s.adviceText}>{result.energyMap.advice}</p>
              </div>
            </div>
          )}

          {!weekly && tab === "checklist" && isPro && (
            <div className={s.clList}>
              {checklist ? (
                <>
                  <div className={s.clProgress}>
                    <div className={s.clProgressBar}>
                      <div
                        className={s.clProgressFill}
                        style={{ width: totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}%` : "0%" }}
                      />
                    </div>
                    <span className={s.clProgressLabel}>{doneCount} / {totalCount} 완료</span>
                  </div>
                  {checklist.items.map(item => (
                    <button key={item.id} className={item.done ? s.clItemDone : s.clItem} onClick={() => handleToggle(item.id)}>
                      <span className={item.done ? s.clCheckDone : s.clCheck}>
                        {item.done ? "✓" : ""}
                      </span>
                      <span className={item.done ? s.clLabelDone : s.clLabel}>{item.label}</span>
                      <span className={s.catDot} style={{ background: CAT[item.category as Category] ?? "#666", flexShrink: 0 }} />
                    </button>
                  ))}
                </>
              ) : (
                <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>체크리스트를 불러오는 중...</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Input Form ── */
  return (
    <div className={s.page}>
      {upgradeModal}
      <div className={s.wrap}>
        {topBar}
        <div className={s.formHeader}>
          <span className={s.eyebrow}>AI Planner</span>
          <h1 className={s.pageTitle}>오늘 하루를<br />설계하세요.</h1>
        </div>

        <hr className={s.divider} />

        <div className={s.modeToggle}>
          <button className={mode === "daily" ? s.modeBtnActive : s.modeBtn} onClick={() => setMode("daily")}>하루 플랜</button>
          <div className={s.modeDivider} />
          <button className={mode === "weekly" ? s.modeBtnActive : s.modeBtn} onClick={() => setMode("weekly")}>주간 플랜</button>
        </div>

        <div className={s.fields}>
          <div className={s.fieldGroup}>
            <label className={s.label}>직업 / 역할 <span className={s.required}>*</span></label>
            <input name="role" value={form.role} onChange={upd} placeholder="예: 프리랜서 개발자, 대학원생, 취준생" className={s.input} />
          </div>
          <div className={s.fieldGroup}>
            <label className={s.label}>오늘의 목표 <span className={s.required}>*</span></label>
            <textarea name="goals" value={form.goals} onChange={upd} placeholder="예: 프로젝트 완성, 운동 습관, 영어 공부" rows={3} className={s.textarea} />
          </div>
          <div className={s.fieldGroup}>
            <label className={s.label}>성향 / 특성</label>
            <input name="personality" value={form.personality} onChange={upd} placeholder="예: 집중력 짧음, 완벽주의" className={s.input} />
          </div>
          <div className={s.fieldGroup}>
            <label className={s.label}>제약 사항</label>
            <input name="constraints" value={form.constraints} onChange={upd} placeholder="예: 오후 2시 회의, 허리 통증" className={s.input} />
          </div>

          <div className={s.fieldRow}>
            <div className={s.fieldGroup}>
              <label className={s.label}>기상 시간</label>
              <input type="time" name="wakeTime" value={form.wakeTime} onChange={upd} className={s.monoInput} />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.label}>취침 시간</label>
              <input type="time" name="sleepTime" value={form.sleepTime} onChange={upd} className={s.monoInput} />
            </div>
          </div>

          <div className={s.fieldRow}>
            <div className={s.fieldGroup}>
              <label className={s.label}>에너지 유형</label>
              <select name="energyType" value={form.energyType} onChange={upd} className={s.selectInput}>
                <option>아침형</option><option>저녁형</option><option>중간형</option>
              </select>
            </div>
            <div className={s.fieldGroup}>
              <label className={s.label}>스트레스 수준 — {form.stressLevel}/5</label>
              <input type="range" min="1" max="5" name="stressLevel" value={form.stressLevel} onChange={upd} className={s.rangeInput} />
            </div>
          </div>

          {error && (
            <div className={s.errorBox}>
              <p className={s.errorMsg}>{error}</p>
              {errDetail && <p className={s.errorDetail}>{errDetail}</p>}
            </div>
          )}

          <button className={s.submitBtn} onClick={generate}>
            {mode === "daily" ? "오늘 하루 설계하기 →" : "주간 일정 설계하기 →"}
          </button>
        </div>

        {history.length > 0 && (
          <div className={s.historySection}>
            <hr className={s.divider} />
            <div className={s.historyHeader}>
              <span className={s.eyebrow}>저장된 플랜 — {history.length}</span>
            </div>
            {history.map(saved => (
              <div key={saved.id} className={s.historyItem} onClick={() => restorePlan(saved)}>
                <div className={s.historyMeta}>
                  <span className={s.historyMode}>{saved.mode === "daily" ? "하루" : "주간"}</span>
                  <span className={s.historyDate}>{formatDate(saved.createdAt)}</span>
                </div>
                <div className={s.historyRole}>{saved.role || "역할 미입력"}</div>
                {saved.goals && <div className={s.historyGoals}>{saved.goals.slice(0, 50)}{saved.goals.length > 50 ? "…" : ""}</div>}
                <button className={s.historyDelete} onClick={e => removePlan(e, saved.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
