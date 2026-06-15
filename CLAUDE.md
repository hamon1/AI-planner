# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 참고하는 컨텍스트입니다.

---

## 서비스 비전

**"사용자가 실제로 목표를 달성하도록 돕는 AI 실행 관리 플랫폼"**

단순 AI 일정 생성 도구가 아니라, 계획 생성 이후의 **실행·추적·피드백**까지 커버하는 서비스를 목표로 한다.
ChatGPT 등 범용 AI와의 차별화는 "계획 생성" 자체가 아니라 **실행 관리 흐름 전체**에서 만들어진다.

---

## 타겟 사용자

- 방학을 효율적으로 보내고 싶은 학생 (주말/방학 갓생 플래너)
- 취업 준비생
- 자기계발·생산성 향상에 관심 있는 사용자
- 주말 프로젝트, 공부, 운동 계획이 필요한 사용자

---

## 핵심 가설 (검증 우선순위 1순위)

> "사용자가 한 번 계획만 생성하고 떠나는가, 아니면 매주/매달 반복 방문하는가?"

- **반복 방문이 발생한다** → 유료화 전환 가능성 높음. 실행 관리 기능 강화.
- **반복 방문이 발생하지 않는다** → 결제 기능보다 **재방문 유도 기능** 개발이 먼저.

이 가설이 검증되기 전까지 결제 전환율보다 **리텐션 지표**를 우선 관찰한다.

---

## 차별화 전략

| 범용 AI (ChatGPT 등) | 이 서비스 |
|---|---|
| 계획 텍스트 생성 | 계획 + 실행 체크리스트 자동화 |
| 일회성 대화 | 주간/월간 목표 추적 |
| 구조 없음 | 실행률 분석 + AI 피드백 |
| 저장 없음 | 이력 관리 + 재조정 |

---

## 기능 로드맵

### Phase 1 — 현재 (MVP)
- AI 하루/주간 플랜 생성
- 로컬 히스토리 저장
- 하루 3회 무료 생성 제한 (localStorage)
- PWA (홈 화면 설치)

### Phase 2 — 실행 관리 핵심
- 체크리스트 자동 생성 (생성된 플랜 → 할 일 목록)
- 일일/주간 목표 달성률 추적
- 계획 실패 시 AI 자동 재조정
- AI 주간 리뷰 & 피드백

### Phase 3 — 플랫폼화
- 장기 목표 → 일별/주별 자동 분해
- 캘린더 연동 (Google Calendar)
- PDF 내보내기
- 클라우드 히스토리 (Supabase)
- 기기 간 동기화

---

## 무료 / Pro 플랜

| | 무료 | Pro |
|---|---|---|
| AI 플랜 생성 | 하루 3회 | 무제한 |
| 플랜 저장 | 로컬 20개 | 로컬 20개 |
| 체크리스트 자동 생성 | — | ✓ |
| 실행률 분석 | — | ✓ |
| AI 주간 피드백 | — | ✓ |
| 장기 목표 관리 | — | ✓ (Phase 3) |
| 캘린더 연동 | — | ✓ (Phase 3) |
| PDF 내보내기 | — | ✓ (Phase 3) |

**가격**: 월 4,900원 / 연 39,000원 (33% 할인)

---

## 프로젝트 개요 (기술)

**AI 맞춤 일정 플래너** — 사용자의 직업/역할, 목표, 성향, 제약사항, 생활 패턴을 입력받아 Claude API로 맞춤형 하루/주간 스케줄을 생성하는 웹앱.

## 기술 스택

- **프론트엔드**: Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **AI**: @anthropic-ai/sdk — 반드시 서버사이드(API Route)에서만 호출, API 키 클라이언트 노출 절대 금지
- **인증/DB**: Supabase (이메일/Google 로그인, 사용량 추적) — Phase 2 연동 예정
- **결제**: Stripe (구독) — Phase 2 연동 예정
- **배포**: Vercel + PWA (Capacitor로 iOS/Android 래핑 예정)

## 현재 폴더 구조

```
src/
├── app/
│   ├── page.tsx              # / → /planner 리다이렉트
│   ├── login/page.tsx        # 로그인/회원가입 (UI 완성, Supabase 미연동)
│   ├── pricing/page.tsx      # Pro 결제 플랜 (UI 완성, Stripe 미연동)
│   ├── planner/
│   │   ├── page.tsx          # 플래너 메인 화면
│   │   └── planner.module.css
│   ├── api/
│   │   ├── plan/route.ts     # Claude API 호출 (서버사이드)
│   │   └── webhook/route.ts  # Stripe 웹훅 (미구현)
│   ├── icon.tsx              # PWA 아이콘 (ImageResponse)
│   ├── apple-icon.tsx        # iOS 홈 화면 아이콘
│   └── manifest.ts           # Web App Manifest
├── components/
│   └── SwRegister.tsx        # Service Worker 등록
└── public/
    └── sw.js                 # Service Worker
```

## API Route 사양 (/api/plan)

- POST, body: `{ message: string, mode: "daily"|"weekly" }`
- model: `claude-sonnet-4-6`, max_tokens: 4000, timeout: 55s
- 응답: 순수 JSON (마크다운/설명 절대 금지)

**Daily 스키마**
```json
{
  "summary": "핵심 전략 한 줄",
  "dailyMantra": "동기부여 한마디",
  "priorities": [{"rank":1,"label":"...","reason":"...","emoji":"🎯"}],
  "schedule": [{"time":"07:00","duration":30,"task":"...","category":"집중|루틴|휴식|운동|학습|업무","priority":"high|medium|low","tip":"..."}],
  "energyMap": {"peak":"...","low":"...","advice":"..."},
  "promptTemplate": "..."
}
```

**Weekly 스키마**
```json
{
  "summary": "...",
  "weeklyMantra": "...",
  "weekGoals": [{"rank":1,"label":"...","reason":"...","emoji":"🎯"}],
  "days": [{"day":"월","focus":"테마","energy":"high|medium|low","tasks":[{"label":"...","category":"...","priority":"..."}],"tip":"..."}],
  "energyMap": {"peak":"...","low":"...","advice":"..."},
  "promptTemplate": "..."
}
```

## UI 사양

**색상 코드**
- 카테고리: 집중 `#5046e4`, 루틴 `#059669`, 휴식 `#d97706`, 운동 `#dc2626`, 학습 `#2563eb`, 업무 `#7c3aed`
- 우선순위: high `#dc2626`, medium `#d97706`, low `#9ca3af`
- 액센트: `#c4b5fd` (violet-300) → hover `#a78bfa`

**디자인 토큰** (`--bg`, `--surface`, `--ink`, `--border`, `--accent-*`): `planner.module.css :root`에 정의

## 사용량 제한 (현재)

- localStorage 기반 (`ai-planner-usage`: `{ date, count }`)
- 하루 3회 초과 시 업그레이드 모달 표시
- Phase 2에서 Supabase + IP 기반 서버사이드 검증으로 전환 예정

## 결제 (Stripe) — 미연동

- 월 4,900원 / 연 39,000원
- `/pricing` UI 완성, checkout 액션 미구현
- 웹훅(`/api/webhook`)으로 `users.is_pro` 동기화 예정

## 환경변수

`.env.local` (값은 비워두고 `.env.example`만 커밋):
```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## 비용 / 비즈니스 컨텍스트

- Claude API 원가: 약 600~800원/인당/월 (하루 1회 기준)
- 손익분기점: 유료 사용자 약 38명
- 무료 사용자도 API 비용 발생 → 생성 횟수 제한 로직 필수

## 코딩 규칙

- API 키·시크릿은 절대 클라이언트 코드/커밋에 포함하지 말 것
- 모든 외부 API 호출(Anthropic, Stripe)은 API Route를 통해서만
- 컴포넌트는 함수형, TypeScript 타입 명시
- 에러 상태는 사용자에게 구체적인 메시지로 노출
- 새 기능 추가 시 이 파일의 JSON 스키마/색상 코드/폴더 구조 기준으로 일관성 유지
