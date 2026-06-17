"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import s from "./login.module.css";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [redirectTo, setRedirectTo] = useState("/planner");
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setRedirectTo(params.get("redirect") ?? "/planner");
        if (params.get("error") === "auth_failed") setError("로그인에 실패했습니다. 다시 시도해주세요.");

        // 이미 로그인된 경우 플래너로 이동
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) router.replace(params.get("redirect") ?? "/planner");
        });
    }, [router]);

    const handleGoogle = async () => {
        const supabase = createClient();
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
            },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    return (
        <div className={s.page}>
            <div className={s.wrap}>
                <Link href="/planner" className={s.back}>← 플래너로 돌아가기</Link>

                <div className={s.header}>
                    <span className={s.eyebrow}>AI Planner</span>
                    <h1 className={s.title}>시작해볼까요.</h1>
                </div>

                {error && (
                    <p className={s.errorMsg}>{error}</p>
                )}

                <button className={s.googleBtn} onClick={handleGoogle} disabled={loading}>
                    {loading ? (
                        <span className={s.loadingDots}>로그인 중<span>.</span><span>.</span><span>.</span></span>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                            </svg>
                            Google로 계속하기
                        </>
                    )}
                </button>

                <p className={s.notice}>
                    로그인하면 <span className={s.noticeLink}>이용약관</span> 및 <span className={s.noticeLink}>개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
                </p>
            </div>
        </div>
    );
}
