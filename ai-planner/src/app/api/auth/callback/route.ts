import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase-server"

const DEV_EMAILS = (process.env.DEV_EMAILS ?? "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get("code")
  const redirect = searchParams.get("redirect") ?? "/planner"

  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`)

  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  const admin = createAdminSupabase()

  const { data: existing } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const isDevEmail = DEV_EMAILS.includes(user.email?.toLowerCase() ?? "")
  const role =
    existing?.role === "pro" ? "pro" :
    isDevEmail              ? "dev" :
                              "free"

  await admin.from("users").upsert({ id: user.id, email: user.email!, role })

  return NextResponse.redirect(`${origin}${redirect}`)
}
