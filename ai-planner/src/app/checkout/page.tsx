"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import s from "./checkout.module.css";

const FEATURES = [
  "무제한 플랜 생성",
  "체크리스트 자동 생성",
  "실행률 분석",
  "AI 주간 피드백",
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const plan         = searchParams.get("plan") === "annual" ? "annual" : "monthly";

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/login?redirect=/pricing"); return; }
      setUserEmail(user.email ?? null);
      setMounted(true);
    });
  }, [router]);

  if (!mounted) return null;

  const monthlyPrice = 4900;
  const annualTotal  = 39000;
  const price        = plan === "monthly" ? monthlyPrice : Math.round(annualTotal / 12);
  const priceSub     = plan === "monthly" ? "/ 월" : `/ 월 · 연 ₩${annualTotal.toLocaleString()} 청구`;

  return (
    <div className={s.wrap}>
      <Link href="/pricing" className={s.back}>← 요금제로 돌아가기</Link>

      <div className={s.header}>
        <span className={s.eyebrow}>결제</span>
        <h1 className={s.title}>Pro 플랜 구독</h1>
      </div>

      <div className={s.summary}>
        <div className={s.summaryHeader}>
          <p className={s.summaryLabel}>주문 요약</p>
          <div className={s.summaryPlan}>
            <span className={s.summaryPlanName}>AI Planner Pro · {plan === "monthly" ? "월간" : "연간"}</span>
            <div>
              <div className={s.summaryPrice}>₩{price.toLocaleString()}</div>
              <div className={s.summaryPriceSub}>{priceSub}</div>
            </div>
          </div>
        </div>
        <div className={s.summaryFeatures}>
          {FEATURES.map(f => (
            <div key={f} className={s.summaryFeature}>
              <span className={s.summaryCheck}>✓</span>{f}
            </div>
          ))}
        </div>
      </div>

      <div className={s.pendingBox}>
        <p className={s.pendingTitle}>결제 시스템 연동 준비 중</p>
        <p className={s.pendingDesc}>
          Stripe 결제 연동이 곧 완료될 예정입니다.<br />
          출시 알림을 받고 싶으시면 아래 이메일로 문의해주세요.
        </p>
      </div>

      <div className={s.ctaBtn} aria-disabled="true">결제하기 — 준비 중</div>

      <Link href="/pricing" className={s.backBtn}>요금제 다시 보기</Link>

      {userEmail && <p className={s.userInfo}>{userEmail} 으로 로그인됨</p>}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className={s.page}>
      <Suspense>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
