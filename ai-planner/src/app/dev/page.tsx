"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRole, setRole } from "@/lib/checklist";
import s from "./dev.module.css";

export default function DevPage() {
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [currentRole, setCurrentRole] = useState<string>("free");
  const router = useRouter();

  useEffect(() => { setCurrentRole(getRole()); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/dev-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "인증 실패");
      setRole("dev");
      router.push("/planner");
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    setRole("free");
    setCurrentRole("free");
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div className={s.header}>
          <span className={s.eyebrow}>Developer Access</span>
          <h1 className={s.title}>개발자 인증</h1>
        </div>

        {currentRole === "dev" ? (
          <div>
            <p className={s.statusActive}>● DEV 모드 활성화됨</p>
            <div className={s.exitWrap}>
              <span className={s.exitLabel}>현재 세션 제어</span>
              <button className={s.exitBtn} onClick={handleExit}>DEV 모드 해제 →</button>
            </div>
          </div>
        ) : (
          <form className={s.form} onSubmit={handleSubmit}>
            <div>
              <label className={s.label} htmlFor="passphrase">패스프레이즈</label>
              <input
                id="passphrase"
                type="password"
                className={s.input}
                placeholder="••••••••"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>
            {error && <p className={s.error}>{error}</p>}
            <button type="submit" className={s.submitBtn} disabled={loading || !passphrase}>
              {loading ? "확인 중..." : "인증 →"}
            </button>
          </form>
        )}

        <Link href="/planner" className={s.backLink}>← 플래너로 돌아가기</Link>
      </div>
    </div>
  );
}
