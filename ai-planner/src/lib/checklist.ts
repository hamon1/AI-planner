export interface ChecklistItem {
  id: string
  label: string
  category: string
  done: boolean
}

export interface DailyChecklist {
  planId: string
  date: string
  items: ChecklistItem[]
}

export interface DayStats {
  date: string
  label: string
  total: number
  done: number
  rate: number
  byCategory: Record<string, { total: number; done: number }>
}

const CL_KEY   = "ai-planner-checklists"
const ROLE_KEY = "ai-planner-role"

export type UserRole = "free" | "pro" | "dev"

const DAY_LABELS: Record<number, string> = { 0: "일", 1: "월", 2: "화", 3: "수", 4: "목", 5: "금", 6: "토" }

export function getRole(): UserRole {
  try {
    // dev는 sessionStorage만 — 탭 닫으면 해제
    if (sessionStorage.getItem(ROLE_KEY) === "dev") return "dev"
    // localStorage에 남은 과거 "dev" 값 정리
    if (localStorage.getItem(ROLE_KEY) === "dev") localStorage.removeItem(ROLE_KEY)
    // pro는 localStorage — 영구 유지
    if (localStorage.getItem(ROLE_KEY) === "pro") return "pro"
    return "free"
  } catch { return "free" }
}

export function setRole(role: UserRole): void {
  try {
    if (role === "dev") {
      sessionStorage.setItem(ROLE_KEY, "dev")
    } else {
      sessionStorage.removeItem(ROLE_KEY)
      if (role === "free") localStorage.removeItem(ROLE_KEY)
      else localStorage.setItem(ROLE_KEY, role)  // "pro"
    }
  } catch { /* noop */ }
}

export function getIsPro(): boolean {
  const r = getRole()
  return r === "pro" || r === "dev"
}

export function isDev(): boolean {
  return getRole() === "dev"
}

/** @deprecated use setRole("pro") */
export function setIsPro(v: boolean): void {
  setRole(v ? "pro" : "free")
}

function all(): Record<string, DailyChecklist> {
  try { return JSON.parse(localStorage.getItem(CL_KEY) ?? "{}") as Record<string, DailyChecklist> }
  catch { return {} }
}

export function getChecklist(date: string): DailyChecklist | null {
  return all()[date] ?? null
}

export function saveChecklist(cl: DailyChecklist): void {
  const store = all()
  store[cl.date] = cl
  localStorage.setItem(CL_KEY, JSON.stringify(store))
}

export function createChecklist(
  planId: string,
  schedule: { task: string; category: string }[]
): DailyChecklist {
  const date = new Date().toISOString().slice(0, 10)
  return {
    planId,
    date,
    items: schedule.map((s, i) => ({ id: `${planId}-${i}`, label: s.task, category: s.category, done: false })),
  }
}

export function toggleItem(date: string, itemId: string): DailyChecklist | null {
  const cl = getChecklist(date)
  if (!cl) return null
  const updated: DailyChecklist = {
    ...cl,
    items: cl.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it),
  }
  saveChecklist(updated)
  return updated
}

export function getWeekStats(): DayStats[] {
  const store = all()
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const date  = d.toISOString().slice(0, 10)
    const label = DAY_LABELS[d.getDay()] ?? "-"
    const cl    = store[date]
    if (!cl || cl.items.length === 0) return { date, label, total: 0, done: 0, rate: 0, byCategory: {} }
    const byCategory: Record<string, { total: number; done: number }> = {}
    cl.items.forEach(it => {
      if (!byCategory[it.category]) byCategory[it.category] = { total: 0, done: 0 }
      byCategory[it.category].total++
      if (it.done) byCategory[it.category].done++
    })
    const done = cl.items.filter(it => it.done).length
    return { date, label, total: cl.items.length, done, rate: Math.round((done / cl.items.length) * 100), byCategory }
  })
}
