"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getWeekStats, type DayStats } from "@/lib/checklist";
import s from "./stats.module.css";

const CAT_COLOR: Record<string, string> = {
  집중: "#5046e4", 루틴: "#059669", 휴식: "#d97706",
  운동: "#dc2626", 학습: "#2563eb", 업무: "#7c3aed",
};

interface FeedbackResult { summary: string; insights: string[]; tips: string[] }

export default function StatsPage() {
  const [mounted, setMounted]     = useState(false);
  const [stats, setStats]         = useState<DayStats[]>([]);
  const [feedback, setFeedback]   = useState<FeedbackResult | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError]     = useState("");

  useEffect(() => {
    setStats(getWeekStats());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const today        = new Date().toISOString().slice(0, 10);
  const todayStat    = stats.find(s => s.date === today);
  const weeklyTotal  = stats.reduce((a, s) => a + s.total, 0);
  const weeklyDone   = stats.reduce((a, s) => a + s.done, 0);
  const weeklyRate   = weeklyTotal > 0 ? Math.round((weeklyDone / weeklyTotal) * 100) : 0;

  const allCategories = Array.from(
    new Set(stats.flatMap(s => Object.keys(s.byCategory)))
  );

  const catTotals: Record<string, { total: number; done: number }> = {};
  stats.forEach(day => {
    Object.entries(day.byCategory).forEach(([cat, v]) => {
      if (!catTotals[cat]) catTotals[cat] = { total: 0, done: 0 };
      catTotals[cat].total += v.total;
      catTotals[cat].done  += v.done;
    });
  });

  const handleFeedback = async () => {
    setFbLoading(true);
    setFbError("");
    setFeedback(null);
    try {
      const res  = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      const data = await res.json() as FeedbackResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setFeedback(data);
    } catch (e) {
      setFbError(e instanceof Error ? e.message : "피드백 생성 실패");
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <Link href="/planner" className={s.back}>← 플래너로 돌아가기</Link>

        <div className={s.header}>
          <span className={s.eyebrow}>Stats</span>
          <h1 className={s.title}>실행률 분석</h1>
        </div>

        <hr className={s.divider} />

        {/* Weekly bar chart */}
        <p className={s.sectionTitle}>이번 주 달성률</p>
        {weeklyTotal === 0 ? (
          <div className={s.emptyState}>
            <p className={s.emptyTitle}>아직 체크리스트 데이터가 없어요</p>
            <p>플래너에서 하루 플랜을 생성하고<br />체크리스트 탭에서 항목을 완료해보세요.</p>
          </div>
        ) : (
          <div className={s.barChart}>
            {stats.map(d => {
              const isToday = d.date === today;
              const pct     = d.total > 0 ? d.rate : 0;
              return (
                <div key={d.date} className={s.barRow}>
                  <span className={s.barDayLabel} style={isToday ? { color: "var(--accent-ink)", fontWeight: 900 } : {}}>
                    {d.label}
                  </span>
                  <div className={s.barTrack}>
                    {d.total > 0 ? (
                      <div
                        className={isToday ? s.barFillToday : s.barFill}
                        style={{ width: `${pct}%` }}
                      />
                    ) : (
                      <div className={s.barFillEmpty} style={{ width: "0%" }} />
                    )}
                  </div>
                  <span className={s.barPct}>
                    {d.total > 0 ? `${pct}%` : "—"}
                  </span>
                  <span className={s.barCount}>
                    {d.total > 0 ? `${d.done}/${d.total}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Today summary */}
        {todayStat && todayStat.total > 0 && (
          <>
            <p className={s.sectionTitle}>오늘 요약</p>
            <div className={s.todaySummary}>
              <div className={s.todayHeader}>
                <div>
                  <div className={s.todayRate}>{todayStat.rate}%</div>
                  <div className={s.todayRateLabel}>달성률</div>
                </div>
                <div className={s.todayCount}>
                  <div className={s.todayCountNum}>{todayStat.done}/{todayStat.total}</div>
                  <div className={s.todayCountLabel}>완료 / 전체</div>
                </div>
              </div>

              {Object.keys(todayStat.byCategory).length > 0 && (
                <div className={s.catList}>
                  {Object.entries(todayStat.byCategory).map(([cat, v]) => (
                    <div key={cat} className={s.catRow}>
                      <span className={s.catLabel}>
                        <span className={s.catDot} style={{ background: CAT_COLOR[cat] ?? "#666" }} />
                        {cat}
                      </span>
                      <div className={s.barTrack}>
                        <div
                          className={s.barFill}
                          style={{
                            width: `${v.total > 0 ? Math.round((v.done / v.total) * 100) : 0}%`,
                            background: CAT_COLOR[cat] ?? "var(--accent-hover)",
                          }}
                        />
                      </div>
                      <span className={s.catPct}>
                        {v.total > 0 ? `${Math.round((v.done / v.total) * 100)}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Weekly category breakdown */}
        {allCategories.length > 0 && (
          <>
            <p className={s.sectionTitle}>주간 카테고리별</p>
            <div className={s.catList} style={{ marginBottom: 28 }}>
              {allCategories.map(cat => {
                const v   = catTotals[cat] ?? { total: 0, done: 0 };
                const pct = v.total > 0 ? Math.round((v.done / v.total) * 100) : 0;
                return (
                  <div key={cat} className={s.catRow}>
                    <span className={s.catLabel}>
                      <span className={s.catDot} style={{ background: CAT_COLOR[cat] ?? "#666" }} />
                      {cat}
                    </span>
                    <div className={s.barTrack}>
                      <div
                        className={s.barFill}
                        style={{ width: `${pct}%`, background: CAT_COLOR[cat] ?? "var(--accent-hover)" }}
                      />
                    </div>
                    <span className={s.catPct}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <hr className={s.divider} />

        {/* AI Feedback */}
        <div className={s.feedbackSection}>
          <p className={s.sectionTitle}>AI 주간 피드백</p>
          <button className={s.feedbackBtn} onClick={handleFeedback} disabled={fbLoading || weeklyTotal === 0}>
            {fbLoading ? "분석 중..." : "주간 피드백 받기 →"}
          </button>
          {weeklyTotal === 0 && (
            <p style={{ marginTop: 8, fontSize: 12, color: "var(--ink-subtle)" }}>
              이번 주 체크리스트 데이터가 있어야 피드백을 받을 수 있어요.
            </p>
          )}

          {fbError && <p className={s.feedbackError}>{fbError}</p>}

          {feedback && (
            <div className={s.feedbackCard}>
              <div className={s.feedbackSummary}>{feedback.summary}</div>
              <div className={s.feedbackGroup}>
                <p className={s.feedbackGroupLabel}>패턴 분석</p>
                <ul className={s.feedbackList}>
                  {feedback.insights.map((ins, i) => (
                    <li key={i} className={s.feedbackListItem}>{ins}</li>
                  ))}
                </ul>
              </div>
              <div className={s.feedbackGroup}>
                <p className={s.feedbackGroupLabel}>다음 주 제안</p>
                <ul className={s.feedbackList}>
                  {feedback.tips.map((tip, i) => (
                    <li key={i} className={s.feedbackListItem}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
