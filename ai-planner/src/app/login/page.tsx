"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./login.module.css";

export default function LoginPage() {
    const [tab, setTab]           = useState<"login" | "signup">("login");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    return (
        <div className={s.page}>
            <div className={s.wrap}>
                <Link href="/planner" className={s.back}>← 플래너로 돌아가기</Link>

                <div className={s.header}>
                    <span className={s.eyebrow}>AI Planner</span>
                    <h1 className={s.title}>
                        {tab === "login" ? <>다시 만나서<br />반가워요.</> : <>시작해볼까요.</>}
                    </h1>
                </div>

                <div className={s.tabRow}>
                    <button className={tab === "login" ? s.tabActive : s.tab} onClick={() => setTab("login")}>로그인</button>
                    <div className={s.tabDivider} />
                    <button className={tab === "signup" ? s.tabActive : s.tab} onClick={() => setTab("signup")}>회원가입</button>
                </div>

                <div className={s.form}>
                    <div className={s.field}>
                        <label className={s.label}>이메일</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" className={s.input} />
                    </div>
                    <div className={s.field}>
                        <label className={s.label}>비밀번호</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상" className={s.input} />
                    </div>
                    {tab === "signup" && (
                        <div className={s.field}>
                            <label className={s.label}>비밀번호 확인</label>
                            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="비밀번호 재입력" className={s.input} />
                        </div>
                    )}
                    <button className={s.submitBtn}>
                        {tab === "login" ? "로그인하기 →" : "가입하기 →"}
                    </button>
                    {tab === "login" && (
                        <button className={s.forgotBtn}>비밀번호를 잊으셨나요?</button>
                    )}
                </div>

                <div className={s.orRow}>
                    <hr className={s.orLine} />
                    <span className={s.orText}>또는</span>
                    <hr className={s.orLine} />
                </div>

                <button className={s.googleBtn}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Google로 계속하기
                </button>

                <p className={s.footer}>
                    {tab === "login" ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                    <button className={s.footerLink} onClick={() => setTab(tab === "login" ? "signup" : "login")}>
                        {tab === "login" ? "회원가입" : "로그인"}
                    </button>
                </p>
            </div>
        </div>
    );
}
