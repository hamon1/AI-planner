import Link from "next/link";
import s from "./features.module.css";

const FEATURES = [
  {
    icon: "✦",
    title: "AI 하루 플랜",
    desc: "직업·목표·성향·제약을 입력하면 Claude AI가 시간대별 맞춤 일정을 설계합니다. 에너지 곡선까지 고려한 스케줄.",
  },
  {
    icon: "◈",
    title: "AI 주간 플랜",
    desc: "월요일부터 일요일까지 요일별 집중 테마와 할 일을 전략적으로 배분합니다.",
  },
  {
    icon: "◻",
    title: "체크리스트",
    desc: "생성된 하루 플랜이 자동으로 할 일 목록으로 변환됩니다. 항목을 체크하며 실행을 추적하세요.",
  },
  {
    icon: "◉",
    title: "뽀모도로 타이머",
    desc: "스케줄 항목을 클릭하면 해당 작업의 집중 타이머가 바로 시작됩니다. 25분 집중 / 5분 휴식 사이클.",
  },
  {
    icon: "◈",
    title: "실행률 통계",
    desc: "지난 7일간의 달성률을 카테고리별로 시각화합니다. 어떤 영역에서 성과를 내고 있는지 파악하세요.",
  },
  {
    icon: "▣",
    title: "플랜 히스토리",
    desc: "최근 20개의 플랜이 기기에 저장됩니다. 이전 플랜을 불러와 참고하거나 다시 사용할 수 있습니다.",
  },
];

export default function FeaturesPage() {
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <Link href="/planner" className={s.back}>← 플래너로 돌아가기</Link>

        <header className={s.header}>
          <span className={s.eyebrow}>AI Planner</span>
          <h1 className={s.title}>하루를 설계하는<br />가장 스마트한 방법.</h1>
          <p className={s.subtitle}>목표와 성향을 입력하면 AI가 당신만을 위한 일정을 만들어드립니다.</p>
        </header>

        <div className={s.grid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={s.card}>
              <span className={s.cardIcon}>{f.icon}</span>
              <h2 className={s.cardTitle}>{f.title}</h2>
              <p className={s.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className={s.limitBox}>
          <div className={s.limitLabel}>사용 제한</div>
          <p className={s.limitText}>
            하루 <strong>3회</strong> 생성 가능 — 매일 자정에 초기화됩니다.
            <br />모든 기능은 추가 설치 없이 브라우저에서 바로 사용할 수 있습니다.
          </p>
        </div>

        <Link href="/planner" className={s.cta}>
          지금 시작하기 →
        </Link>
      </div>
    </div>
  );
}
