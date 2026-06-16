"use client"

import { useEffect } from "react"
import type { TimerState } from "@/hooks/useTimer"
import s from "./timer-bar.module.css"

function fmt(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0")
  const ss = (sec % 60).toString().padStart(2, "0")
  return `${m}:${ss}`
}

interface Props {
  state:    TimerState
  onPause:  () => void
  onResume: () => void
  onStop:   () => void
}

export default function TimerBar({ state, onPause, onResume, onStop }: Props) {
  // "done" 상태 3초 후 자동 닫기
  useEffect(() => {
    if (state.phase !== "done") return
    const id = setTimeout(onStop, 3000)
    return () => clearTimeout(id)
  }, [state.phase, onStop])

  if (state.phase === "idle") return null

  const isWork  = state.phase === "work"
  const isBreak = state.phase === "break"
  const isDone  = state.phase === "done"

  const progress = state.phaseTotal > 0 ? state.phaseSec / state.phaseTotal : 0
  // 0 = 시작 직후, 1 = 페이즈 시작 → 진행률은 1-progress
  const filled = 1 - progress

  const phaseLabel = isDone ? "완료" : isBreak ? "휴식" : "집중"
  const phaseClass = isDone ? s.phaseDone : isBreak ? s.phaseBreak : s.phaseWork
  const fillClass  = isBreak ? s.progressFillBreak : s.progressFillWork

  const icon = isDone ? "✅" : isBreak ? "☕" : "🎯"

  return (
    <div className={s.bar}>
      {/* 태스크 정보 */}
      <div className={s.info}>
        <div className={s.taskName}>{icon} {state.task?.name}</div>
        <div className={s.meta}>
          <span className={phaseClass}>{phaseLabel}</span>
          <span className={s.pomos}>
            {Array.from({ length: state.pomoTotal }).map((_, i) => (
              <span key={i} className={i < state.pomoDone ? s.pomoDotDone : s.pomoDot}>●</span>
            ))}
          </span>
        </div>
      </div>

      {/* 진행 바 */}
      <div className={s.progressWrap}>
        <div className={s.progressTrack}>
          <div
            className={`${s.progressFill} ${fillClass}`}
            style={{ width: `${filled * 100}%` }}
          />
        </div>
      </div>

      {/* 시간 + 컨트롤 */}
      <div className={s.controls}>
        <span className={s.time}>{fmt(state.phaseSec)}</span>
        {!isDone && (
          state.running
            ? <button className={s.btn} onClick={onPause} aria-label="일시정지">⏸</button>
            : <button className={s.btn} onClick={onResume} aria-label="재개">▶</button>
        )}
        <button className={s.btnStop} onClick={onStop} aria-label="타이머 종료">✕</button>
      </div>
    </div>
  )
}
