"use client";

import { useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";

type Category = keyof typeof CAT;
type PriKey   = keyof typeof PRI;

interface ScheduleItem { time: string; duration: number; task: string; category: Category; priority: PriKey; tip: string; }
interface PriorityItem { rank: number; label: string; reason: string; emoji: string; }
interface PlanResult {
    summary: string; dailyMantra: string;
    priorities: PriorityItem[];
    schedule: ScheduleItem[];
    energyMap: { peak: string; low: string; advice: string };
    promptTemplate: string;
}

const CAT = { 집중: "#6366f1", 루틴: "#10b981", 휴식: "#f59e0b", 운동: "#ef4444", 학습: "#3b82f6", 업무: "#8b5cf6" } as const;
const PRI = { high: ["높음", "#ef4444"], medium: ["중간", "#f59e0b"], low: ["낮음", "#9ca3af"] } as const;

export default function App() {
    const [step, setStep] = useState("input");
    const [mode, setMode] = useState("daily");
    const [form, setForm] = useState({ role: "", goals: "", personality: "", constraints: "", wakeTime: "07:00", sleepTime: "23:00", energyType: "아침형", stressLevel: "3" });
    const [result, setResult] = useState<PlanResult | null>(null);
    const [error, setError] = useState("");
    const [errDetail, setErrDetail] = useState("");
    const [tab, setTab] = useState("schedule");
    const [copied, setCopied] = useState(false);

    const upd = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const generate = async () => {
        if (!form.role && !form.goals) { setError("직업/역할 또는 목표를 입력해주세요."); return; }
        setError(""); setErrDetail(""); setStep("loading");
        const msg = `[${mode === "daily" ? "오늘" : "이번주"} 스케줄]\n직업:${form.role || "미입력"}\n목표:${form.goals || "미입력"}\n성향:${form.personality || "없음"}\n제약:${form.constraints || "없음"}\n기상:${form.wakeTime}/취침:${form.sleepTime}\n에너지:${form.energyType}/스트레스:${form.stressLevel}/5\nJSON만 반환`;
        try {
            const res = await fetch("/api/plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg, mode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
            setResult(data); setTab("schedule"); setStep("result");
        } catch (e) {
            setError("스케줄 생성 중 오류가 발생했습니다.");
            setErrDetail(e instanceof Error ? e.message : String(e));
            setStep("input");
        }
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(result?.promptTemplate || "");
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const inp: CSSProperties = { padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", color: "#1e1b4b", background: "#fff", outline: "none" };
    const lbl: CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };

    if (step === "loading") return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "sans-serif" }}>
            <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 44, height: 44, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "sp .8s linear infinite" }} />
            <p style={{ color: "#6366f1", fontWeight: 600, marginTop: 18 }}>AI가 맞춤 스케줄 생성 중…</p>
        </div>
    );

    if (step === "result" && result) {
        const TABS = [["schedule", "📅 스케줄"], ["priority", "🎯 우선순위"], ["energy", "⚡ 에너지"], ["reuse", "🔁 재사용"]];
        return (
            <div style={{ maxWidth: 640, margin: "0 auto", padding: 16, fontFamily: "'Apple SD Gothic Neo',Arial,sans-serif", color: "#1e1b4b" }}>
                <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius: 16, padding: 20, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                        <div style={{ fontSize: 11, color: "#a5b4fc", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{mode === "daily" ? "오늘의 플랜" : "주간 플랜"}</div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{result.dailyMantra}</h2>
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#c7d2fe", lineHeight: 1.5 }}>{result.summary}</p>
                    </div>
                    <button onClick={() => setStep("input")} style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>새 플랜</button>
                </div>

                <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
                    {TABS.map(([id, l]) => (
                        <button key={id} onClick={() => setTab(id)} style={{
                            flex: 1, padding: "8px 2px", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                            background: tab === id ? "#fff" : "transparent", color: tab === id ? "#4f46e5" : "#6b7280",
                            boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,.08)" : "none"
                        }}>{l}</button>
                    ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1.5px solid #e0e7ff", minHeight: 200 }}>
                    {tab === "schedule" && (result.schedule || []).map((it, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 48 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>{it.time}</span>
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>{it.duration}분</span>
                            </div>
                            <div style={{ flex: 1, borderLeft: `3px solid ${CAT[it.category] || "#6366f1"}`, paddingLeft: 12, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{it.task}</span>
                                    {it.category && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: (CAT[it.category] || "#6366f1") + "22", color: CAT[it.category] || "#6366f1" }}>{it.category}</span>}
                                    {it.priority && PRI[it.priority] && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: PRI[it.priority][1] + "22", color: PRI[it.priority][1] }}>{PRI[it.priority][0]}</span>}
                                </div>
                                {it.tip && <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0", lineHeight: 1.5 }}>💡 {it.tip}</p>}
                            </div>
                        </div>
                    ))}

                    {tab === "priority" && (
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>핵심 우선순위</p>
                            {(result.priorities || []).map((p, i) => (
                                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, background: "#f8fafc", borderRadius: 12, marginBottom: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{p.rank}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.emoji} {p.label}</div>
                                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{p.reason}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "energy" && result.energyMap && (
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>에너지 관리 전략</p>
                            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                                {[["🔥 최고조 시간", result.energyMap.peak], ["🌙 저조 시간", result.energyMap.low]].map(([l, v]) => (
                                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
                                        <span style={{ fontSize: 14, color: "#6b7280" }}>{l}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 14 }}>
                                <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>💬 {result.energyMap.advice}</p>
                            </div>
                        </div>
                    )}

                    {tab === "reuse" && (
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>매일 재사용하는 방법</p>
                            {[["1", "새 플랜 버튼", "달라진 목표/상황만 수정 후 재생성"], ["2", "프롬프트 복사", "아래 템플릿 복사 → Claude 새 대화에 붙여넣기"], ["3", "Projects 저장", "Claude Projects에 기본 프로필 저장 후 목표만 매일 입력"]].map(([n, t, d]) => (
                                <div key={n} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{n}</div>
                                    <div><strong style={{ fontSize: 14 }}>{t}</strong><p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{d}</p></div>
                                </div>
                            ))}
                            {result.promptTemplate && <>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "16px 0 8px" }}>📋 내일 사용할 프롬프트</p>
                                <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0", marginBottom: 10 }}>
                                    <pre style={{ margin: 0, fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "monospace" }}>{result.promptTemplate}</pre>
                                </div>
                                <button onClick={copyPrompt} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                                    {copied ? "✅ 복사됨!" : "📋 프롬프트 복사"}
                                </button>
                            </>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 16, fontFamily: "'Apple SD Gothic Neo',Arial,sans-serif", color: "#1e1b4b" }}>
            <div style={{ textAlign: "center", padding: "20px 0 14px" }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#3730a3" }}>🤖 AI 맞춤 플래너</h1>
                <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 13 }}>Claude가 나의 상황에 맞는 최적 스케줄을 만들어드립니다</p>
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
                {[["daily", "📅 하루 플랜"], ["weekly", "📆 주간 플랜"]].map(([m, l]) => (
                    <button key={m} onClick={() => setMode(m)} style={{
                        flex: 1, padding: 10, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
                        background: mode === m ? "#fff" : "transparent", color: mode === m ? "#4f46e5" : "#6b7280",
                        boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,.1)" : "none"
                    }}>{l}</button>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label style={lbl}>직업 / 역할 <span style={{ color: "#ef4444" }}>*</span></label>
                    <input name="role" value={form.role} onChange={upd} placeholder="예: 프리랜서 개발자, 대학원생, 취준생" style={inp} /></div>
                <div><label style={lbl}>오늘/이번 주 목표 <span style={{ color: "#ef4444" }}>*</span></label>
                    <textarea name="goals" value={form.goals} onChange={upd} placeholder="예: 프로젝트 완성, 운동 습관, 영어 공부" rows={3} style={{ ...inp, resize: "vertical" }} /></div>
                <div><label style={lbl}>나의 성향 / 특성</label>
                    <input name="personality" value={form.personality} onChange={upd} placeholder="예: 집중력 짧음, 완벽주의, 저녁형" style={inp} /></div>
                <div><label style={lbl}>제약 사항</label>
                    <input name="constraints" value={form.constraints} onChange={upd} placeholder="예: 오후 2-4시 회의, 허리 통증" style={inp} /></div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}><label style={lbl}>기상 시간</label><input name="wakeTime" value={form.wakeTime} onChange={upd} type="time" style={inp} /></div>
                    <div style={{ flex: 1 }}><label style={lbl}>취침 시간</label><input name="sleepTime" value={form.sleepTime} onChange={upd} type="time" style={inp} /></div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}><label style={lbl}>에너지 유형</label>
                        <select name="energyType" value={form.energyType} onChange={upd} style={inp}>
                            <option>아침형</option><option>저녁형</option><option>중간형</option>
                        </select></div>
                    <div style={{ flex: 1 }}><label style={lbl}>스트레스 수준 {form.stressLevel}/5</label>
                        <input type="range" min="1" max="5" name="stressLevel" value={form.stressLevel} onChange={upd} style={{ width: "100%", marginTop: 10 }} /></div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12 }}>
                        <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p>
                        {errDetail && <p style={{ margin: "6px 0 0", color: "#991b1b", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{errDetail}</p>}
                    </div>
                )}

                <button onClick={generate} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    ✨ {mode === "daily" ? "오늘 하루" : "주간"} 스케줄 생성하기
                </button>
            </div>
        </div>
    );
}