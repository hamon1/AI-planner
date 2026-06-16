"use client"

import { useState, useRef, useCallback, useEffect } from "react"

const WORK_SEC  = 25 * 60
const BREAK_SEC = 5 * 60

export type TimerPhase = "idle" | "work" | "break" | "done"

export interface TimerTask {
  name:     string
  category: string
}

export interface TimerState {
  task:          TimerTask | null
  phase:         TimerPhase
  phaseSec:      number  // 현재 페이즈 남은 초
  phaseTotal:    number  // 현재 페이즈 전체 초 (진행률 계산용)
  workRemainSec: number  // 남은 작업 시간 초
  workTotalSec:  number  // 전체 작업 시간 초
  pomoDone:      number
  pomoTotal:     number
  running:       boolean
}

const IDLE: TimerState = {
  task: null, phase: "idle",
  phaseSec: 0, phaseTotal: 0,
  workRemainSec: 0, workTotalSec: 0,
  pomoDone: 0, pomoTotal: 0,
  running: false,
}

function askNotifPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {})
  }
}

function notify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  try { new Notification(title, { body }) } catch {}
}

function beep(freq: number) {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(IDLE)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  const tick = useCallback(() => {
    setState(prev => {
      if (!prev.running || prev.phase === "idle" || prev.phase === "done") return prev

      const nextPhaseSec   = prev.phaseSec - 1
      const nextWorkRemain = prev.phase === "work"
        ? prev.workRemainSec - 1
        : prev.workRemainSec

      // 페이즈 진행 중
      if (nextPhaseSec > 0) {
        return { ...prev, phaseSec: nextPhaseSec, workRemainSec: nextWorkRemain }
      }

      // 휴식 종료 → 다음 작업 세션
      if (prev.phase === "break") {
        const workSec = Math.min(WORK_SEC, nextWorkRemain)
        return { ...prev, phase: "work", phaseSec: workSec, phaseTotal: workSec, workRemainSec: nextWorkRemain }
      }

      // 작업 세션 종료
      const nextPomoDone = prev.pomoDone + 1

      if (nextWorkRemain <= 0) {
        notify("✅ 완료!", `${prev.task?.name ?? "작업"} 완료! 수고하셨습니다.`)
        beep(880)
        return { ...prev, phase: "done", phaseSec: 0, workRemainSec: 0, pomoDone: nextPomoDone, running: false }
      }

      // 휴식 시작
      notify("☕ 휴식 시간", "5분 쉬어요. 곧 다시 시작합니다.")
      beep(660)
      return {
        ...prev,
        phase: "break",
        phaseSec: BREAK_SEC,
        phaseTotal: BREAK_SEC,
        workRemainSec: nextWorkRemain,
        pomoDone: nextPomoDone,
      }
    })
  }, [])

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearTick()
    }
    return clearTick
  }, [state.running, tick])

  const start = useCallback((name: string, category: string, durationMin: number) => {
    clearTick()
    askNotifPermission()
    const workTotalSec = durationMin * 60
    const firstWorkSec = Math.min(WORK_SEC, workTotalSec)
    beep(440)
    setState({
      task: { name, category },
      phase: "work",
      phaseSec: firstWorkSec,
      phaseTotal: firstWorkSec,
      workRemainSec: workTotalSec,
      workTotalSec,
      pomoDone: 0,
      pomoTotal: Math.ceil(durationMin / 25),
      running: true,
    })
  }, [])

  const pause  = useCallback(() => setState(p => ({ ...p, running: false })), [])
  const resume = useCallback(() => setState(p =>
    p.phase !== "idle" && p.phase !== "done" ? { ...p, running: true } : p
  ), [])
  const stop   = useCallback(() => { clearTick(); setState(IDLE) }, [])

  return { state, start, pause, resume, stop }
}
