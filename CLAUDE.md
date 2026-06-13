# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 참고하는 컨텍스트입니다.

## 프로젝트 개요

**AI 맞춤 일정 플래너** — 사용자의 직업/역할, 목표, 성향, 제약사항, 생활 패턴(기상/취침 시간, 에너지 유형, 스트레스 수준)을 입력받아 Claude API로 맞춤형 하루/주간 스케줄을 생성하는 웹앱. 구독형 유료 서비스로 운영 예정.

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **AI**: @anthropic-ai/sdk — 반드시 서버사이드(API Route)에서만 호출, API 키 클라이언트 노출 절대 금지
- **인증/DB**: Supabase (이메일/Google 로그인, 사용량 추적)
- **결제**: Stripe (구독)
- **배포**: Vercel (이후 Capacitor로 iOS/Android 래핑 예정 — PWA manifest 포함)

## 폴더 구조

```
src/
├── app/
│   ├── page.tsx              # 랜딩 페이지
│   ├── planner/page.tsx      # 플래너 메인 화면
│   ├── api/
│   │   ├── plan/route.ts     # Claude API 호출 (서버사이드)
│   │   └── webhook/route.ts  # Stripe 웹훅
│   └── dashboard/page.tsx    # 사용자 플랜 히스토리
└── components/
    ├── PlannerForm.tsx
    └── PlannerResult.tsx
```

## API Route 사양 (/api/plan)

- POST, body: `{ mode: "daily"|"weekly", role, goals, personality, constraints, wakeTime, sleepTime, energyType, stressLevel }`
- model: `claude-sonnet-4-20250514`, max_tokens: 3000
- system prompt는 아래 JSON 스키마로만 응답하도록 강제 (마크다운/설명 절대 금지):

```json
{
  "summary": "핵심 전략 한 줄",
  "dailyMantra": "동기부여 한마디",
  "priorities": [{"rank":1,"label":"...","reason":"...(20자 이내)","emoji":"🎯"}],
  "schedule": [{"time":"07:00","duration":30,"task":"...","category":"집중|루틴|휴식|운동|학습|업무","priority":"high|medium|low","tip":"...(15자 이내)"}],
  "energyMap": {"peak":"...","low":"...","advice":"..."},
  "promptTemplate": "내일 재사용할 프롬프트 (사용자 기본 정보 포함)"
}
```

- schedule 최대 8개 항목
- 응답 처리: 코드블록(````json`) 제거 → 잘린 JSON은 괄호 카운트로 자동 복구 → 파싱
- 에러는 단계별로 구분: HTTP 에러 / content 누락 / 빈 응답(stop_reason 포함) / JSON 파싱 실패

## UI 사양

**PlannerResult 3탭 구조**
1. 📅 스케줄 — 시간/소요시간/작업명 + 카테고리 배지 + 우선순위 배지 + 실행팁
2. 🎯 우선순위 — rank/emoji/label/reason 카드
3. ⚡ 에너지 — peak/low 시간대 + advice

**색상 코드**
- 카테고리: 집중 `#6366f1`, 루틴 `#10b981`, 휴식 `#f59e0b`, 운동 `#ef4444`, 학습 `#3b82f6`, 업무 `#8b5cf6`
- 우선순위: high `#ef4444`, medium `#f59e0b`, low `#9ca3af`

**디자인 톤**: 보라/인디고 그라디언트 (`#4f46e5` → `#7c3aed`), 카드형 레이아웃, 모바일 반응형 필수.

## 인증 & 사용량 제한

- Supabase Auth (이메일/Google)
- 무료 플랜: 하루 2회 생성 제한 (`usage` 테이블에서 일별 카운트 체크)
- Pro 플랜: 무제한
- API Route에서 요청마다 로그인 여부 + 사용량 확인 후 429 반환

## 결제 (Stripe)

- 월 구독: 4,900원 (Pro)
- 연간 구독: 39,000원
- 웹훅(`/api/webhook`)에서 구독 상태를 Supabase `users.is_pro`에 동기화

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

## 비용 / 비즈니스 컨텍스트 (참고용)

- 1인당 월 API 원가: 약 600~800원 (하루 1회 생성 기준)
- 손익분기점: 유료 사용자 약 38명
- 무료 플랜 사용자도 API 비용 발생하므로 사용량 제한 로직은 필수

## 코딩 규칙

- API 키, 시크릿은 절대 클라이언트 코드/커밋에 포함하지 말 것
- 모든 외부 API 호출(Anthropic, Stripe)은 API Route를 통해서만
- 컴포넌트는 함수형, TypeScript 타입 명시
- 에러 상태는 사용자에게 구체적인 메시지로 노출 (디버깅 용이성 우선)
- 새 기능 추가 시 이 파일의 JSON 스키마/색상 코드/폴더 구조를 기준으로 일관성 유지