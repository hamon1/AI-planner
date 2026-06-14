"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./pricing.module.css";

const FREE_FEATURES = [
    "하루 플랜 생성",
    "주간 플랜 생성",
    "히스토리 저장 (로컬)",
    "우선순위 분석",
    "에너지 맵",
];

const PRO_FEATURES = [
    "하루 플랜 생성",
    "주간 플랜 생성",
    "히스토리 저장 (로컬)",
    "우선순위 분석",
    "에너지 맵",
    "클라우드 히스토리 (준비중)",
    "기기 간 동기화 (준비중)",
];

const FAQS = [
    { q: "언제든지 취소할 수 있나요?", a: "네. 구독은 언제든지 취소할 수 있으며, 결제 기간 종료 후 자동으로 무료 플랜으로 전환됩니다." },
    { q: "연간 결제 후 환불이 되나요?", a: "결제 후 7일 이내 미사용 시 전액 환불해 드립니다. 이후에는 남은 기간 비례 환불이 가능합니다." },
    { q: "하루 3회 제한은 어떻게 계산되나요?", a: "매일 자정(00:00 KST) 기준으로 초기화됩니다. 브라우저 로컬에 저장되며, Pro 플랜 구독 시 제한이 사라집니다." },
];

export default function PricingPage() {
    const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const monthlyPrice  = 4900;
    const annualTotal   = 39000;
    const annualMonthly = Math.round(annualTotal / 12);

    const price    = billing === "monthly" ? monthlyPrice : annualMonthly;
    const priceSub = billing === "monthly" ? "/ 월" : `/ 월 · 연 ₩${annualTotal.toLocaleString()} 청구`;

    return (
        <div className={s.page}>
            <div className={s.wrap}>
                <Link href="/planner" className={s.back}>← 플래너로 돌아가기</Link>

                <div className={s.hero}>
                    <span className={s.eyebrow}>AI Planner Pro</span>
                    <h1 className={s.title}>제한 없이,<br />더 스마트하게.</h1>
                    <p className={s.desc}>AI 일정 생성을 하루 3회 제한 없이 무제한으로 사용하세요.</p>
                </div>

                {/* Billing toggle */}
                <div className={s.billingWrap}>
                    <div className={s.billingToggle}>
                        <button
                            className={billing === "monthly" ? s.billingBtnActive : s.billingBtn}
                            onClick={() => setBilling("monthly")}
                        >월간</button>
                        <button
                            className={billing === "annual" ? s.billingBtnActive : s.billingBtn}
                            onClick={() => setBilling("annual")}
                        >
                            연간
                            {billing !== "annual" && <span className={s.saveBadge}>-33%</span>}
                        </button>
                    </div>
                </div>

                {/* Plan cards */}
                <div className={s.cards}>
                    {/* Free */}
                    <div className={s.card}>
                        <div className={s.cardTop}>
                            <div className={s.planLabel}>무료</div>
                            <div className={s.cardPrice}>₩0</div>
                            <div className={s.cardPriceSub}>영원히 무료</div>
                        </div>
                        <ul className={s.features}>
                            <li className={s.featureLimit}>하루 {3}회 생성</li>
                            {FREE_FEATURES.map(f => (
                                <li key={f} className={s.feature}>
                                    <span className={s.check}>✓</span>{f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/planner" className={s.freeBtn}>지금 시작하기</Link>
                    </div>

                    {/* Pro */}
                    <div className={s.cardPro}>
                        <div className={s.proTag}>추천</div>
                        <div className={s.cardTop}>
                            <div className={s.planLabelPro}>Pro</div>
                            <div className={s.cardPricePro}>₩{price.toLocaleString()}</div>
                            <div className={s.cardPriceSubPro}>{priceSub}</div>
                        </div>
                        <ul className={s.featuresPro}>
                            <li className={s.featureLimitPro}>무제한 생성</li>
                            {PRO_FEATURES.map(f => (
                                <li key={f} className={s.featurePro}>
                                    <span className={s.checkPro}>✓</span>{f}
                                </li>
                            ))}
                        </ul>
                        <button className={s.proBtn}>
                            Pro 시작하기 →
                        </button>
                        {billing === "annual" && (
                            <p className={s.annualNote}>월간 대비 ₩{(monthlyPrice * 12 - annualTotal).toLocaleString()} 절약</p>
                        )}
                    </div>
                </div>

                {/* FAQ */}
                <div className={s.faqSection}>
                    <h2 className={s.faqTitle}>자주 묻는 질문</h2>
                    {FAQS.map((faq, i) => (
                        <div key={i} className={s.faqItem}>
                            <button className={s.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <span>{faq.q}</span>
                                <span className={s.faqArrow}>{openFaq === i ? "−" : "+"}</span>
                            </button>
                            {openFaq === i && <p className={s.faqA}>{faq.a}</p>}
                        </div>
                    ))}
                </div>

                <p className={s.legal}>결제는 Stripe를 통해 안전하게 처리됩니다. 언제든 취소 가능.</p>
            </div>
        </div>
    );
}
