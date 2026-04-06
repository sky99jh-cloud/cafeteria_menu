# cafeteria_menu — CLAUDE.md

## 프로젝트 개요

KBS 대구 구내식당의 주간 메뉴표를 이미지로 업로드하면 Claude AI가 분석하여 요일별 아침/점심 메뉴를 표시해주는 Next.js 웹 앱.

- **배포 대상**: Vercel
- **스택**: Next.js 16.2.1 / React 19 / TypeScript / Tailwind CSS v4
- **주요 외부 서비스**:
  - Upstash Redis — 메뉴 데이터 및 음식 이미지 URL 캐시, 방문자 수 저장
  - Anthropic API (`claude-opus-4-6`) — 메뉴표 이미지 분석 (OCR + 구조화)
  - Naver Image Search API — 음식명으로 대표 이미지 조회

---

## 프로젝트 구조

```
cafeteria_menu/
├── app/
│   ├── page.tsx                  # 메인 페이지 (주간 메뉴 열람)
│   ├── layout.tsx                # 루트 레이아웃
│   ├── globals.css               # 전역 스타일
│   ├── admin/
│   │   └── page.tsx              # 관리자 페이지 (메뉴 업로드, 통계)
│   └── api/
│       ├── menu/route.ts         # GET: 저장된 주간 메뉴 조회
│       ├── analyze-menu/route.ts # POST: 이미지 → Claude AI 분석 → Redis 저장
│       ├── food-image/route.ts   # GET: 음식명으로 Naver 이미지 검색 (Redis 캐시)
│       ├── visit/route.ts        # POST: 방문자 수 증가
│       ├── admin/
│       │   ├── login/route.ts    # POST: 관리자 로그인
│       │   ├── logout/route.ts   # POST: 관리자 로그아웃
│       │   └── stats/route.ts    # GET: 오늘/누적 방문자 통계
├── components/
│   ├── TrayDisplay.tsx           # 식판 UI — 음식별 이미지 카드 표시
│   ├── DaySelector.tsx           # 요일 탭 선택기
│   └── MenuUpload.tsx            # 관리자용 이미지 업로드 컴포넌트
├── lib/
│   ├── types.ts                  # WeeklyMenu, DayMenu 타입 정의
│   ├── menu-store.ts             # Redis CRUD (getMenu / saveMenu)
│   └── admin-auth.ts             # 관리자 인증 유틸
├── public/                       # 정적 에셋
├── AGENTS.md                     # AI 에이전트용 가이드 (Next.js 16 breaking changes 주의)
└── CLAUDE.md                     # 이 파일
```

---

## 핵심 데이터 타입

```ts
interface DayMenu {
  date: string;      // YYYY-MM-DD
  dayName: string;   // MON, TUE, WED, THU, FRI
  dayLabel: string;  // 월, 화, 수, 목, 금
  breakfast: string[];
  lunch: string[];
}

interface WeeklyMenu {
  week: string;      // "2026-03-30 ~ 2026-04-03"
  days: DayMenu[];
}
```

---

## 주요 동작 흐름

1. **메뉴 등록** (관리자): 이미지 업로드 → `/api/analyze-menu` → Claude OCR → Upstash Redis 저장
2. **메뉴 열람** (일반 사용자): 페이지 진입 → `/api/menu` → Redis에서 `weekly_menu` 키 조회 → 요일별 표시
3. **음식 이미지**: `TrayDisplay` 컴포넌트가 각 음식명으로 `/api/food-image?q=음식명` 호출 → Naver API → 180일 Redis 캐시
4. **방문자 집계**: 페이지 진입 시 `/api/visit` POST → Redis `visits:YYYY-MM-DD` 및 `visits:total` 증가

---

## 환경 변수

| 변수명 | 용도 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 인증 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis 엔드포인트 |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis 인증 토큰 |
| `NAVER_CLIENT_ID` | Naver 이미지 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | Naver 이미지 검색 API Client Secret |
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 |

---

## 최근 커밋 내역

| 날짜 | 커밋 해시 | 내용 |
|---|---|---|
| 2026-04-06 | (미커밋) | 관리자 로그인 시 저장된 메뉴 자동 로드 — 사진 재업로드 없이 메뉴 편집 가능 |
| 2026-04-06 | `81876c1` | Claude OCR 프롬프트에 업로드 시점 연도 주입 — 연도 오인식 버그 수정 |
| 2026-03-30 | `bfb1bc4` | 음식 이미지 캐시 TTL을 180일로 변경 |
| 2026-03-30 | `bbaa72b` | 관리자 페이지에서 기존 메뉴 수정 기능 추가 |
| 2026-03-30 | `e39c01d` | 아침 메뉴 빈칸 버그 수정 (3차) |
| 2026-03-30 | `df5c847` | 아침 메뉴 빈칸 버그 수정 (2차) |
| 2026-03-30 | `fb187fe` | 아침 메뉴 빈칸 버그 수정 (1차) |
| 2026-03-25 | `92e1f47` | 사이트 타이틀/설명을 "KBS대구 주간식당메뉴"로 변경 |
| 2026-03-25 | `1bacaf0` | 이미지 검색 결과 없을 때 짧은 검색어로 fallback 재검색 |
| 2026-03-25 | `337ca49` | Upstash 자동 JSON 파싱으로 인한 캐시 읽기 실패 수정 |
| 2026-03-25 | `739300e` | Naver pstatic 프록시 URL에서 실제 원본 URL 추출 (만료 방지) |
| 2026-03-25 | `e0dfe25` | 관리자 페이지에 오늘/누적 방문자 수 표시 추가 |
| 2026-03-25 | `113c859` | Naver API에서 이미지 URL 3개 fetch, 로드 실패 시 fallback |
| 2026-03-25 | `223bfe7` | Naver referrer 정책으로 차단된 이미지 표시 문제 수정 |
| 2026-03-25 | `0ad20bb` | 빈 문자열 캐시를 유효한 이미지 결과로 오인하는 버그 수정 |
| 2026-03-25 | `19cf25d` | Naver API 결과가 있을 때만 이미지 캐시 저장 |
| 2026-03-25 | `0219584` | Redis 캐시로 Naver API 호출 횟수 절감 |
| 2026-03-25 | `c9689e0` | 메인 페이지 타이틀을 "KBS 대구 주간식당메뉴"로 변경 |
| 2026-03-25 | `f6970e7` | 메인 페이지 헤더에 관리자 버튼 추가 |
| 2026-03-24 | `d697b53` | Vercel KV에서 Upstash Redis로 전환 |
| 2026-03-24 | `ae34713` | 관리자/일반 사용자 권한 분리 및 Vercel KV 스토리지 추가 |
| 2026-03-24 | `cf8f1f2` | localStorage를 이용한 메뉴 데이터 세션 유지 (초기 구현) |

---

## 개발 시 주의사항

- **Next.js 16**: `AGENTS.md` 참고 — 기존 Next.js 관례와 다른 breaking change가 있음. 코드 작성 전 `node_modules/next/dist/docs/` 확인 필요.
- **Upstash Redis 자동 파싱**: `redis.get()`이 JSON을 자동으로 파싱함. 캐시 값이 배열인지 문자열인지 타입 체크 필수.
- **Naver 이미지 URL**: `search.pstatic.net` 프록시 URL은 만료되므로 `src` 파라미터에서 원본 URL을 추출해서 저장.
- **관리자 인증**: 쿠키 기반 세션. `isAdminAuthenticated()` (`lib/admin-auth.ts`) 로 API route에서 검증.
- **Claude OCR 연도 처리**: `analyze-menu/route.ts`에서 서버 업로드 시점의 `currentYear`를 프롬프트에 주입. 이미지에 연도가 없거나 잘못 인식되더라도 업로드 연도가 강제 적용됨.
