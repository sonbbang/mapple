# 맛집 룰렛 (맛플) — 설계 문서

**날짜:** 2026-05-19  
**상태:** 승인됨  
**스택:** Next.js 15 App Router · TypeScript · Tailwind CSS · Vercel

---

## 1. 개요

직장인이 점심 메뉴를 결정하지 못할 때, 주변 맛집을 랜덤으로 뽑아주는 단일 페이지 웹앱.  
사용자는 거리와 음식 카테고리를 선택한 뒤 룰렛을 돌려 오늘의 식당을 결정한다.

**핵심 사용 흐름:**  
위치 감지 → 필터 선택 → 룰렛 돌리기 → 결과 확인 → 카카오맵으로 이동

---

## 2. 아키텍처

### 파일 구조

```
src/
├── app/
│   ├── page.tsx                 # 메인 페이지 (필터 + 룰렛 + 결과)
│   ├── layout.tsx               # 루트 레이아웃
│   └── api/
│       └── restaurants/
│           └── route.ts         # 카카오 로컬 REST API 프록시
├── components/
│   ├── SpinWheel.tsx            # SVG 룰렛 휠 + CSS 스핀 애니메이션
│   ├── FilterPanel.tsx          # 거리(3단계) + 카테고리(5종) 필터
│   └── ResultCard.tsx           # 당첨 식당 정보 카드
└── lib/
    └── kakao.ts                 # 카카오 로컬 API fetch 래퍼
```

### 환경변수

| 변수 | 위치 | 용도 |
|------|------|------|
| `KAKAO_REST_API_KEY` | 서버 전용 (Vercel 환경변수) | 카카오 로컬 REST API 인증 |

브라우저에는 카카오 API 키가 노출되지 않는다.

---

## 3. 데이터 흐름

```
브라우저
  1. navigator.geolocation.getCurrentPosition() → 위도/경도
  2. 필터 선택 (거리, 카테고리)
  3. GET /api/restaurants?lat=&lng=&radius=&category=

API Route (서버)
  4. 카카오 로컬 REST API 호출
     GET https://dapi.kakao.com/v2/local/search/category.json
       ?category_group_code=FD6&x={lng}&y={lat}&radius={radius}&sort=distance
  5. 결과 셔플 후 최대 15개 반환

브라우저
  6. 최대 8개를 휠 조각에 배분
  7. 스핀 애니메이션 실행
  8. 당첨 식당을 ResultCard에 표시
```

---

## 4. 화면 구성

### 단일 페이지 레이아웃 (모바일 우선)

```
┌─────────────────────┐
│  🍽️ 맛플            │  ← 헤더 (로고 + 서브타이틀)
│  오늘 점심, 운에 맡겨봐│
├─────────────────────┤
│ 📍 위치 표시 바      │  ← Geolocation 결과 / 수동 입력 폴백
├─────────────────────┤
│                     │
│    [스핀 휠 SVG]    │  ← SpinWheel.tsx (190×190px, 최대 8칸)
│                     │
├─────────────────────┤
│  거리: 500m 1km 2km │  ← FilterPanel.tsx
│  카테고리: 전체 한식 …│
├─────────────────────┤
│   🎡 룰렛 돌리기    │  ← CTA 버튼
└─────────────────────┘
```

스핀 후 ResultCard가 하단에 슬라이드업으로 나타남:

```
┌─────────────────────┐
│ 🍜 명동교자          │
│ 서울 중구 명동10길 29│
│ ⭐4.3 · 🚶도보 8분  │
├──────────┬──────────┤
│ 카카오맵 │ 다시 돌리기│
└──────────┴──────────┘
```

---

## 5. 컴포넌트 명세

### SpinWheel.tsx

- SVG 기반 원형 휠, 조각 수는 식당 목록 길이에 따라 동적 계산 (최소 4, 최대 8)
- 스핀: CSS `transform: rotate()` + `transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
- 최소 4바퀴 + 랜덤 오프셋으로 당첨 슬라이스 계산
- 상단 고정 화살표(▼)로 당첨 슬라이스 판정

### FilterPanel.tsx

- 거리: `[500, 1000, 2000]` (미터) 단일 선택 칩
- 카테고리: `[전체, 한식, 중식, 일식, 양식]` 단일 선택 칩
- 기본값: 거리 1000m, 카테고리 전체

### ResultCard.tsx

- 식당명, 주소, 카카오 별점, 도보 거리(`distance(m) / 67` → 분 단위, 소수 올림), 카테고리
- "카카오맵 열기" → `https://place.map.kakao.com/{place_id}` 새 탭
- "다시 돌리기" → 기존 목록에서 재스핀 (API 재호출 없음)

### /api/restaurants/route.ts

```ts
// GET /api/restaurants?lat=&lng=&radius=&category=
// category: 'all' | '한식' | '중식' | '일식' | '양식'
// 카카오 FD6(음식점) 검색 후 category_name으로 프론트 필터링
// 응답: { restaurants: KakaoPlace[] }
```

---

## 6. 카테고리 필터링 전략

카카오 로컬 API는 음식점 세부 카테고리 코드를 제공하지 않는다.  
`category_group_code=FD6` (음식점 전체)로 검색 후, 응답의 `category_name` 필드 값으로 필터링한다.

| 선택 | 필터 조건 |
|------|-----------|
| 전체 | 필터 없음 |
| 한식 | `category_name.includes('한식')` |
| 중식 | `category_name.includes('중식')` |
| 일식 | `category_name.includes('일식')` |
| 양식 | `category_name.includes('양식')` |

필터 후 결과가 4개 미만이면 "전체" 결과로 폴백한다.

---

## 7. 에러 처리

| 상황 | 처리 |
|------|------|
| 위치 권한 거부 | 주소 텍스트 검색 입력창 표시 |
| API 응답 실패 | 토스트 에러 + 재시도 버튼 |
| 결과 0개 | "반경을 넓혀보세요" 안내 + 거리 자동 증가 제안 |
| 결과 3개 미만 | 그대로 휠에 표시 (조각 수 = 결과 수) |

---

## 8. Vercel 배포 설정

- `KAKAO_REST_API_KEY` → Vercel Dashboard > Environment Variables 등록
- 별도 `vercel.json` / `vercel.ts` 설정 불필요 (Next.js 자동 감지)
- API Route는 Vercel Fluid Compute로 자동 처리

---

## 9. 범위 외 (MVP에서 제외)

- 사용자 계정 / 즐겨찾기
- 팀 공유 / 실시간 룸
- 방문 기록
- 지도 표시 (결과 카드의 카카오맵 링크로 대체)
- 리뷰 상세 / 메뉴 정보
