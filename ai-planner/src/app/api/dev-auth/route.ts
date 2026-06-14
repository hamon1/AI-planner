import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const secret = process.env.DEV_PASSPHRASE
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "DEV_PASSPHRASE가 서버에 설정되지 않았습니다." },
      { status: 500 }
    )
  }
  const { passphrase } = await req.json() as { passphrase?: string }
  if (!passphrase || passphrase !== secret) {
    return NextResponse.json({ ok: false, error: "패스프레이즈가 올바르지 않습니다." }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
