import { NextResponse } from "next/server"
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase-server"

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = createAdminSupabase()
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single()

  if (!existing) {
    await admin.from("users").insert({ id: user.id, email: user.email!, role: "free" })
  }

  return NextResponse.json({ ok: true })
}
