import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `전문 생산성 코치. 순수 JSON만 반환. 마크다운/설명 절대 금지.
schedule 최대 8개. tip/reason 15자 이내. category: 집중|루틴|휴식|운동|학습|업무. priority: high|medium|low.
{"summary":"...","dailyMantra":"...","priorities":[{"rank":1,"label":"...","reason":"...","emoji":"🎯"}],"schedule":[{"time":"07:00","duration":30,"task":"...","category":"집중","priority":"high","tip":"..."}],"energyMap":{"peak":"...","low":"...","advice":"..."},"promptTemplate":"..."}`;

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

        const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 3000,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: message }],
        });

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
