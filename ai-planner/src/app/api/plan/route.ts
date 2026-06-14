import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAILY_PROMPT = `전문 생산성 코치. 순수 JSON만 반환. 마크다운/설명 절대 금지.
schedule 최대 8개. tip/reason 15자 이내. category: 집중|루틴|휴식|운동|학습|업무. priority: high|medium|low.
{"summary":"...","dailyMantra":"...","priorities":[{"rank":1,"label":"...","reason":"...","emoji":"🎯"}],"schedule":[{"time":"07:00","duration":30,"task":"...","category":"집중","priority":"high","tip":"..."}],"energyMap":{"peak":"...","low":"...","advice":"..."},"promptTemplate":"..."}`;

const WEEKLY_PROMPT = `전문 생산성 코치. 순수 JSON만 반환. 마크다운/설명 절대 금지.
7일(월~일) 주간 목표 분배 계획. 시간표 아님 — 요일별 집중 테마와 할 일 목록.
각 day의 tasks 최대 4개. tip 15자 이내. category: 집중|루틴|휴식|운동|학습|업무. priority: high|medium|low. energy: high|medium|low.
{"summary":"...","weeklyMantra":"...","weekGoals":[{"rank":1,"label":"...","reason":"...","emoji":"🎯"}],"days":[{"day":"월","focus":"이날의 테마","energy":"high","tasks":[{"label":"...","category":"집중","priority":"high"}],"tip":"..."},{"day":"화","focus":"...","energy":"medium","tasks":[{"label":"...","category":"루틴","priority":"medium"}],"tip":"..."},{"day":"수","focus":"...","energy":"high","tasks":[{"label":"...","category":"집중","priority":"high"}],"tip":"..."},{"day":"목","focus":"...","energy":"medium","tasks":[{"label":"...","category":"학습","priority":"medium"}],"tip":"..."},{"day":"금","focus":"...","energy":"medium","tasks":[{"label":"...","category":"업무","priority":"high"}],"tip":"..."},{"day":"토","focus":"...","energy":"low","tasks":[{"label":"...","category":"휴식","priority":"low"}],"tip":"..."},{"day":"일","focus":"...","energy":"low","tasks":[{"label":"...","category":"루틴","priority":"low"}],"tip":"..."}],"energyMap":{"peak":"...","low":"...","advice":"..."},"promptTemplate":"..."}`;

function repairJson(raw: string): string {
    let text = raw.replace(/```[\w]*\n?/g, "").trim();
    const last = text.lastIndexOf("}");
    if (last > 0 && !text.endsWith("}")) text = text.slice(0, last + 1);
    text = text.replace(/,(\s*[}\]])/g, "$1");
    const opens = (text.match(/\[/g) ?? []).length - (text.match(/\]/g) ?? []).length;
    const objs  = (text.match(/\{/g) ?? []).length - (text.match(/\}/g) ?? []).length;
    for (let i = 0; i < opens; i++) text += "]";
    for (let i = 0; i < objs;  i++) text += "}";
    return text;
}

export async function POST(req: NextRequest) {
    try {
        const { message, mode } = await req.json() as { message: string; mode: string };

        if (!message) {
            return NextResponse.json({ error: "message 필드가 없습니다" }, { status: 400 });
        }

        const systemPrompt = mode === "weekly" ? WEEKLY_PROMPT : DAILY_PROMPT;

        const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: "user", content: message }],
        }, { timeout: 55_000 });

        if (!response.content?.length) {
            return NextResponse.json(
                { error: `빈 응답 (stop_reason: ${response.stop_reason})` },
                { status: 500 }
            );
        }

        const raw = response.content
            .map((b) => (b.type === "text" ? b.text : ""))
            .join("")
            .trim();

        if (!raw) {
            return NextResponse.json(
                { error: `빈 텍스트 (stop_reason: ${response.stop_reason})` },
                { status: 500 }
            );
        }

        try {
            const parsed = JSON.parse(repairJson(raw));
            return NextResponse.json(parsed);
        } catch {
            return NextResponse.json(
                { error: "JSON 파싱 실패", raw: raw.slice(0, 300) },
                { status: 500 }
            );
        }
    } catch (err: unknown) {
        const status = (err as { status?: number }).status ?? 500;
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        return NextResponse.json({ error: message }, { status });
    }
}
