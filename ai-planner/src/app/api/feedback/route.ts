import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

interface DayStats { label: string; total: number; done: number; rate: number }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `당신은 생산성 코치입니다. 사용자의 지난 7일 실행 데이터를 분석해 한국어로 피드백해주세요.
순수 JSON만 반환. 마크다운/설명 절대 금지.
스키마: {"summary":"한 줄 요약 (30자 이내)","insights":["패턴 분석1","패턴 분석2","패턴 분석3"],"tips":["다음 주 제안1","다음 주 제안2","다음 주 제안3"]}`

export async function POST(req: NextRequest) {
  try {
    const { stats } = await req.json() as { stats: DayStats[] }
    const lines = stats
      .filter(s => s.total > 0)
      .map(s => `${s.label}요일: ${s.done}/${s.total}개 완료 (${s.rate}%)`)
      .join("\n") || "이번 주 기록 없음"

    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: `지난 7일 실행 데이터:\n${lines}` }],
    }, { timeout: 30_000 })

    const raw    = resp.content.map(b => b.type === "text" ? b.text : "").join("").trim()
    const cleaned = raw.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "피드백 생성 실패" },
      { status: 500 }
    )
  }
}
