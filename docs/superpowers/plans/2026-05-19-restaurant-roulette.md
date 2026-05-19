# 맛플 — 맛집 룰렛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GPS 기반 주변 맛집을 카카오 로컬 REST API로 검색하고 SVG 스핀 휠로 랜덤 선택해주는 Next.js 15 웹앱을 구현한다.

**Architecture:** 브라우저 Geolocation → Next.js API Route(서버) → 카카오 로컬 REST API. API 키는 서버 환경변수에만 존재. 위치 거부 시 주소 텍스트 → `/api/geocode` 폴백. SVG 휠은 CSS `transform: rotate()` 트랜지션으로 애니메이션.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS · Vitest · React Testing Library · Vercel Fluid Compute

---

## File Map

| 파일 | 역할 |
|------|------|
| `src/lib/kakao.ts` | 카카오 로컬 REST API fetch 래퍼 + 타입 |
| `src/lib/utils.ts` | `toWalkingMinutes`, `shuffle` 순수 함수 |
| `src/lib/wheel.ts` | SVG 슬라이스 경로, 레이블 위치, 회전 계산 |
| `src/app/api/restaurants/route.ts` | 카카오 식당 검색 API 프록시 |
| `src/app/api/geocode/route.ts` | 주소 → 좌표 변환 API 프록시 |
| `src/components/FilterPanel.tsx` | 거리/카테고리 필터 칩 UI |
| `src/components/SpinWheel.tsx` | SVG 룰렛 휠 + 애니메이션 |
| `src/components/ResultCard.tsx` | 당첨 식당 정보 카드 |
| `src/app/page.tsx` | 메인 페이지 — 전체 조합 |
| `src/app/layout.tsx` | 루트 레이아웃 + 메타데이터 |
| `src/test/setup.ts` | Vitest 전역 셋업 |
| `vitest.config.ts` | Vitest 설정 |

---

## Task 0: 프로젝트 스캐폴딩 + 테스트 셋업

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Next.js 앱 생성**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

기존 파일 덮어쓰기 여부 물을 경우 모두 Yes.

- [ ] **Step 2: Vitest + Testing Library 설치**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: `vitest.config.ts` 작성**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: `src/test/setup.ts` 작성**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: `package.json`에 test 스크립트 추가**

`scripts` 섹션에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: 스모크 테스트 실행**

```bash
npm test
```

Expected: "No test files found" 또는 0 tests passed — 에러 없이 종료.

- [ ] **Step 7: `.env.local` 생성 (gitignore 확인)**

```bash
echo "KAKAO_REST_API_KEY=your_key_here" > .env.local
```

`.gitignore`에 `.env.local`이 포함되어 있는지 확인 (create-next-app이 자동 추가).

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

## Task 1: 타입 + 카카오 API 래퍼 (`src/lib/kakao.ts`)

**Files:**
- Create: `src/lib/kakao.ts`
- Create: `src/lib/kakao.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/lib/kakao.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchRestaurants } from './kakao'

const makePlaces = (entries: Array<{ name: string; cat: string }>) =>
  entries.map((e, i) => ({
    id: String(i),
    place_name: e.name,
    category_name: e.cat,
    address_name: `서울 강남구 테스트로 ${i}`,
    road_address_name: `서울 강남구 테스트로 ${i}`,
    distance: String((i + 1) * 100),
    place_url: `https://place.map.kakao.com/${i}`,
  }))

describe('searchRestaurants', () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = 'test-key'
  })

  it('calls Kakao API with Authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: makePlaces([{ name: 'A', cat: '음식점 > 한식' }]) }),
    } as Response)

    await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '전체' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('y=37.5'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'KakaoAK test-key' }),
      })
    )
  })

  it('returns all restaurants when category is 전체', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: makePlaces([
          { name: '한식집', cat: '음식점 > 한식' },
          { name: '중식집', cat: '음식점 > 중식' },
        ]),
      }),
    } as Response)

    const result = await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '전체' })
    expect(result).toHaveLength(2)
  })

  it('filters by category_name when 4+ results match', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: makePlaces([
          { name: '한A', cat: '음식점 > 한식' },
          { name: '한B', cat: '음식점 > 한식' },
          { name: '한C', cat: '음식점 > 한식' },
          { name: '한D', cat: '음식점 > 한식' },
          { name: '중A', cat: '음식점 > 중식' },
        ]),
      }),
    } as Response)

    const result = await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '한식' })
    expect(result).toHaveLength(4)
    expect(result.every((p) => p.category_name.includes('한식'))).toBe(true)
  })

  it('falls back to all when filtered results < 4', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: makePlaces([
          { name: '한A', cat: '음식점 > 한식' },
          { name: '한B', cat: '음식점 > 한식' },
          { name: '중A', cat: '음식점 > 중식' },
          { name: '중B', cat: '음식점 > 중식' },
          { name: '중C', cat: '음식점 > 중식' },
        ]),
      }),
    } as Response)

    const result = await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '한식' })
    expect(result).toHaveLength(5)
  })

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 } as Response)

    await expect(
      searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '전체' })
    ).rejects.toThrow('Kakao API error: 401')
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- kakao.test.ts
```

Expected: FAIL — `Cannot find module './kakao'`

- [ ] **Step 3: `src/lib/kakao.ts` 구현**

```ts
export interface KakaoPlace {
  id: string
  place_name: string
  category_name: string
  address_name: string
  road_address_name: string
  distance: string
  place_url: string
}

export type CategoryFilter = '전체' | '한식' | '중식' | '일식' | '양식'

interface KakaoSearchResponse {
  documents: KakaoPlace[]
}

export async function searchRestaurants(params: {
  lat: number
  lng: number
  radius: number
  category: CategoryFilter
}): Promise<KakaoPlace[]> {
  const url = new URL('https://dapi.kakao.com/v2/local/search/category.json')
  url.searchParams.set('category_group_code', 'FD6')
  url.searchParams.set('y', String(params.lat))
  url.searchParams.set('x', String(params.lng))
  url.searchParams.set('radius', String(params.radius))
  url.searchParams.set('sort', 'distance')
  url.searchParams.set('size', '15')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Kakao API error: ${res.status}`)

  const data: KakaoSearchResponse = await res.json()

  if (params.category === '전체') return data.documents

  const filtered = data.documents.filter((p) =>
    p.category_name.includes(params.category)
  )
  return filtered.length >= 4 ? filtered : data.documents
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- kakao.test.ts
```

Expected: PASS — 5 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/kakao.ts src/lib/kakao.test.ts
git commit -m "feat: add Kakao local API wrapper with category filtering"
```

---

## Task 2: 유틸 함수 (`src/lib/utils.ts`)

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { toWalkingMinutes, shuffle } from './utils'

describe('toWalkingMinutes', () => {
  it('67m = 1분', () => expect(toWalkingMinutes(67)).toBe(1))
  it('68m = 2분 (올림)', () => expect(toWalkingMinutes(68)).toBe(2))
  it('500m = 8분', () => expect(toWalkingMinutes(500)).toBe(Math.ceil(500 / 67)))
  it('0m = 0분', () => expect(toWalkingMinutes(0)).toBe(0))
  it('134m = 2분 (정확히 나눠 떨어짐)', () => expect(toWalkingMinutes(134)).toBe(2))
})

describe('shuffle', () => {
  it('길이가 동일', () => expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5))
  it('원본 배열 불변', () => {
    const arr = [1, 2, 3]
    const orig = [...arr]
    shuffle(arr)
    expect(arr).toEqual(orig)
  })
  it('동일한 원소를 포함', () => {
    const arr = [1, 2, 3, 4, 5]
    expect([...shuffle(arr)].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- utils.test.ts
```

Expected: FAIL — `Cannot find module './utils'`

- [ ] **Step 3: `src/lib/utils.ts` 구현**

```ts
export function toWalkingMinutes(distanceMeters: number): number {
  return Math.ceil(distanceMeters / 67)
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- utils.test.ts
```

Expected: PASS — 8 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/utils.ts src/lib/utils.test.ts
git commit -m "feat: add walking minutes calculator and shuffle util"
```

---

## Task 3: 휠 계산 함수 (`src/lib/wheel.ts`)

**Files:**
- Create: `src/lib/wheel.ts`
- Create: `src/lib/wheel.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/lib/wheel.test.ts
import { describe, it, expect } from 'vitest'
import { getSlicePath, getLabelPosition, computeTargetRotation } from './wheel'

describe('getSlicePath', () => {
  it('M으로 시작하는 SVG path 반환', () => {
    const p = getSlicePath(0, 4, 95, 95, 88)
    expect(p).toMatch(/^M /)
  })
  it('슬라이스 인덱스마다 다른 path', () => {
    const p0 = getSlicePath(0, 4, 95, 95, 88)
    const p1 = getSlicePath(1, 4, 95, 95, 88)
    expect(p0).not.toBe(p1)
  })
  it('1개 슬라이스일 때 largeArcFlag = 1', () => {
    const p = getSlicePath(0, 1, 95, 95, 88)
    expect(p).toContain(' 1 1 ')
  })
})

describe('getLabelPosition', () => {
  it('중심에서 r*0.65 거리에 위치', () => {
    const pos = getLabelPosition(0, 4, 95, 95, 88)
    const dist = Math.sqrt((pos.x - 95) ** 2 + (pos.y - 95) ** 2)
    expect(dist).toBeCloseTo(88 * 0.65, 0)
  })
})

describe('computeTargetRotation', () => {
  it('현재 회전보다 최소 4바퀴 이상 증가', () => {
    const current = 0
    const target = computeTargetRotation(0, 8, current)
    expect(target - current).toBeGreaterThanOrEqual(4 * 360)
  })
  it('누적 회전에서도 4바퀴 이상 증가', () => {
    const current = 720
    const target = computeTargetRotation(3, 8, current)
    expect(target - current).toBeGreaterThanOrEqual(4 * 360)
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- wheel.test.ts
```

Expected: FAIL — `Cannot find module './wheel'`

- [ ] **Step 3: `src/lib/wheel.ts` 구현**

```ts
export function getSlicePath(
  index: number,
  total: number,
  cx: number,
  cy: number,
  r: number
): string {
  const anglePerSlice = (2 * Math.PI) / total
  const startAngle = index * anglePerSlice - Math.PI / 2
  const endAngle = (index + 1) * anglePerSlice - Math.PI / 2
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArcFlag = anglePerSlice > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

export function getLabelPosition(
  index: number,
  total: number,
  cx: number,
  cy: number,
  r: number
): { x: number; y: number; rotation: number } {
  const sliceDeg = 360 / total
  const midAngleDeg = (index + 0.5) * sliceDeg - 90
  const midAngleRad = (midAngleDeg * Math.PI) / 180
  const labelR = r * 0.65
  return {
    x: cx + labelR * Math.cos(midAngleRad),
    y: cy + labelR * Math.sin(midAngleRad),
    rotation: midAngleDeg + 90,
  }
}

export function computeTargetRotation(
  winnerIndex: number,
  total: number,
  currentRotation: number
): number {
  const sliceDeg = 360 / total
  const winnerMidDeg = winnerIndex * sliceDeg + sliceDeg / 2
  const delta =
    ((360 - winnerMidDeg - (currentRotation % 360)) % 360 + 360) % 360
  return currentRotation + 4 * 360 + (delta === 0 ? 360 : delta)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- wheel.test.ts
```

Expected: PASS — 6 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/wheel.ts src/lib/wheel.test.ts
git commit -m "feat: add SVG wheel geometry and rotation math"
```

---

## Task 4: API Route — 식당 검색 (`src/app/api/restaurants/route.ts`)

**Files:**
- Create: `src/app/api/restaurants/route.ts`
- Create: `src/app/api/restaurants/route.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/app/api/restaurants/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'
import * as kakao from '@/lib/kakao'

vi.mock('@/lib/kakao')

const makeUrl = (params: Record<string, string>) => {
  const url = new URL('http://localhost/api/restaurants')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.toString()
}

describe('GET /api/restaurants', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lat 없으면 400', async () => {
    const res = await GET(new NextRequest(makeUrl({ lng: '127.0' })))
    expect(res.status).toBe(400)
  })

  it('lng 없으면 400', async () => {
    const res = await GET(new NextRequest(makeUrl({ lat: '37.5' })))
    expect(res.status).toBe(400)
  })

  it('성공 시 restaurants 반환', async () => {
    const places = [
      {
        id: '1',
        place_name: '맛집',
        category_name: '음식점 > 한식',
        address_name: '서울',
        road_address_name: '서울',
        distance: '100',
        place_url: 'https://place.map.kakao.com/1',
      },
    ]
    vi.mocked(kakao.searchRestaurants).mockResolvedValueOnce(places)

    const res = await GET(new NextRequest(makeUrl({ lat: '37.5', lng: '127.0' })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.restaurants).toEqual(places)
  })

  it('kakao 실패 시 500', async () => {
    vi.mocked(kakao.searchRestaurants).mockRejectedValueOnce(new Error('API error'))

    const res = await GET(new NextRequest(makeUrl({ lat: '37.5', lng: '127.0' })))
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- restaurants/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: `src/app/api/restaurants/route.ts` 구현**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { searchRestaurants, type CategoryFilter } from '@/lib/kakao'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!lat || !lng) {
    return NextResponse.json({ error: '위치 정보가 필요합니다.' }, { status: 400 })
  }

  const radius = Number(searchParams.get('radius') ?? '1000')
  const category = (searchParams.get('category') ?? '전체') as CategoryFilter

  try {
    const restaurants = await searchRestaurants({ lat, lng, radius, category })
    return NextResponse.json({ restaurants })
  } catch {
    return NextResponse.json({ error: '식당 검색에 실패했습니다.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- restaurants/route.test.ts
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/restaurants/route.ts src/app/api/restaurants/route.test.ts
git commit -m "feat: add restaurant search API route"
```

---

## Task 5: API Route — 주소 지오코딩 (`src/app/api/geocode/route.ts`)

**Files:**
- Create: `src/app/api/geocode/route.ts`
- Create: `src/app/api/geocode/route.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// src/app/api/geocode/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/geocode', () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = 'test-key'
    vi.resetAllMocks()
  })

  it('query 없으면 400', async () => {
    const res = await GET(new NextRequest('http://localhost/api/geocode'))
    expect(res.status).toBe(400)
  })

  it('주소 발견 시 lat/lng 반환', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: [{ y: '37.498095', x: '127.027610', address_name: '서울 강남구 역삼동' }],
      }),
    } as Response)

    const res = await GET(new NextRequest('http://localhost/api/geocode?query=역삼동'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.lat).toBe(37.498095)
    expect(body.lng).toBe(127.02761)
  })

  it('결과 없으면 404', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: [] }),
    } as Response)

    const res = await GET(new NextRequest('http://localhost/api/geocode?query=없는주소xyz'))
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- geocode/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: `src/app/api/geocode/route.ts` 구현**

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) {
    return NextResponse.json({ error: '주소를 입력해주세요.' }, { status: 400 })
  }

  const url = new URL('https://dapi.kakao.com/v2/local/search/address.json')
  url.searchParams.set('query', query)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  })

  if (!res.ok) {
    return NextResponse.json({ error: '주소 검색에 실패했습니다.' }, { status: 500 })
  }

  const data = await res.json()
  const first = data.documents?.[0]
  if (!first) {
    return NextResponse.json({ error: '주소를 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({
    lat: Number(first.y),
    lng: Number(first.x),
    address: first.address_name as string,
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- geocode/route.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/geocode/route.ts src/app/api/geocode/route.test.ts
git commit -m "feat: add address geocoding API route"
```

---

## Task 6: FilterPanel 컴포넌트 (`src/components/FilterPanel.tsx`)

**Files:**
- Create: `src/components/FilterPanel.tsx`
- Create: `src/components/FilterPanel.test.tsx`

- [ ] **Step 1: 테스트 작성**

```tsx
// src/components/FilterPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterPanel from './FilterPanel'

describe('FilterPanel', () => {
  it('거리 옵션 3개 렌더링', () => {
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={vi.fn()} onCategoryChange={vi.fn()} />)
    expect(screen.getByText('500m')).toBeInTheDocument()
    expect(screen.getByText('1km')).toBeInTheDocument()
    expect(screen.getByText('2km')).toBeInTheDocument()
  })

  it('선택된 거리 버튼에 bg-indigo-500 클래스', () => {
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={vi.fn()} onCategoryChange={vi.fn()} />)
    expect(screen.getByText('1km')).toHaveClass('bg-indigo-500')
    expect(screen.getByText('500m')).not.toHaveClass('bg-indigo-500')
  })

  it('거리 클릭 시 onRadiusChange 호출', () => {
    const onChange = vi.fn()
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={onChange} onCategoryChange={vi.fn()} />)
    fireEvent.click(screen.getByText('500m'))
    expect(onChange).toHaveBeenCalledWith(500)
  })

  it('카테고리 클릭 시 onCategoryChange 호출', () => {
    const onChange = vi.fn()
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={vi.fn()} onCategoryChange={onChange} />)
    fireEvent.click(screen.getByText('🍚 한식'))
    expect(onChange).toHaveBeenCalledWith('한식')
  })

  it('선택된 카테고리 버튼에 bg-indigo-500 클래스', () => {
    render(<FilterPanel radius={1000} category="한식" onRadiusChange={vi.fn()} onCategoryChange={vi.fn()} />)
    expect(screen.getByText('🍚 한식')).toHaveClass('bg-indigo-500')
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- FilterPanel.test.tsx
```

Expected: FAIL — `Cannot find module './FilterPanel'`

- [ ] **Step 3: `src/components/FilterPanel.tsx` 구현**

```tsx
'use client'

import type { CategoryFilter } from '@/lib/kakao'

const DISTANCE_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
]

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: '전체', value: '전체' },
  { label: '🍚 한식', value: '한식' },
  { label: '🍜 중식', value: '중식' },
  { label: '🍣 일식', value: '일식' },
  { label: '🍕 양식', value: '양식' },
]

interface Props {
  radius: number
  category: CategoryFilter
  onRadiusChange: (r: number) => void
  onCategoryChange: (c: CategoryFilter) => void
}

export default function FilterPanel({ radius, category, onRadiusChange, onCategoryChange }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">거리</p>
        <div className="flex gap-2">
          {DISTANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRadiusChange(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                radius === opt.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">카테고리</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onCategoryChange(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === opt.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- FilterPanel.test.tsx
```

Expected: PASS — 5 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/components/FilterPanel.tsx src/components/FilterPanel.test.tsx
git commit -m "feat: add FilterPanel component"
```

---

## Task 7: SpinWheel 컴포넌트 (`src/components/SpinWheel.tsx`)

**Files:**
- Create: `src/components/SpinWheel.tsx`
- Create: `src/components/SpinWheel.test.tsx`

- [ ] **Step 1: 테스트 작성**

```tsx
// src/components/SpinWheel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import SpinWheel, { type SpinWheelRef } from './SpinWheel'
import type { KakaoPlace } from '@/lib/kakao'

const makePlaces = (names: string[]): KakaoPlace[] =>
  names.map((name, i) => ({
    id: String(i),
    place_name: name,
    category_name: '음식점 > 한식',
    address_name: '서울',
    road_address_name: '서울',
    distance: '100',
    place_url: `https://place.map.kakao.com/${i}`,
  }))

describe('SpinWheel', () => {
  it('식당 수만큼 SVG path 렌더링', () => {
    const { container } = render(
      <SpinWheel ref={createRef()} restaurants={makePlaces(['A', 'B', 'C', 'D'])} onSpinEnd={vi.fn()} />
    )
    const paths = container.querySelectorAll('path[fill]')
    expect(paths.length).toBeGreaterThanOrEqual(4)
  })

  it('식당 이름 텍스트 렌더링', () => {
    render(
      <SpinWheel ref={createRef()} restaurants={makePlaces(['맛집A', '맛집B'])} onSpinEnd={vi.fn()} />
    )
    expect(screen.getByText('맛집A')).toBeInTheDocument()
  })

  it('5자 초과 이름은 말줄임 처리', () => {
    render(
      <SpinWheel ref={createRef()} restaurants={makePlaces(['일이삼사오육칠'])} onSpinEnd={vi.fn()} />
    )
    expect(screen.getByText('일이삼사오…')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- SpinWheel.test.tsx
```

Expected: FAIL — `Cannot find module './SpinWheel'`

- [ ] **Step 3: `src/components/SpinWheel.tsx` 구현**

```tsx
'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { KakaoPlace } from '@/lib/kakao'
import { getSlicePath, getLabelPosition, computeTargetRotation } from '@/lib/wheel'

const SLICE_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#4f46e5', '#6d28d9', '#818cf8', '#5b21b6',
]
const CX = 95
const CY = 95
const R = 88
const MAX_LABEL_LEN = 5

export interface SpinWheelRef {
  spin: (winnerIndex: number) => void
}

interface Props {
  restaurants: KakaoPlace[]
  onSpinEnd: (winner: KakaoPlace) => void
}

const SpinWheel = forwardRef<SpinWheelRef, Props>(function SpinWheel(
  { restaurants, onSpinEnd },
  ref
) {
  const rotationRef = useRef(0)
  const [displayRotation, setDisplayRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const winnerRef = useRef<KakaoPlace | null>(null)

  useImperativeHandle(ref, () => ({
    spin(winnerIndex: number) {
      if (isAnimating) return
      const target = computeTargetRotation(winnerIndex, restaurants.length, rotationRef.current)
      rotationRef.current = target
      winnerRef.current = restaurants[winnerIndex]
      setIsAnimating(true)
      setDisplayRotation(target)
    },
  }))

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* 상단 화살표 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 -translate-y-1">
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-400" />
      </div>

      <svg
        width="190"
        height="190"
        viewBox="0 0 190 190"
        style={{
          transform: `rotate(${displayRotation}deg)`,
          transition: isAnimating
            ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            : 'none',
        }}
        onTransitionEnd={() => {
          setIsAnimating(false)
          if (winnerRef.current) onSpinEnd(winnerRef.current)
        }}
      >
        <circle cx={CX} cy={CY} r={R + 2} fill="#1e293b" />
        {restaurants.map((r, i) => {
          const pos = getLabelPosition(i, restaurants.length, CX, CY, R)
          const label =
            r.place_name.length > MAX_LABEL_LEN
              ? r.place_name.slice(0, MAX_LABEL_LEN) + '…'
              : r.place_name
          return (
            <g key={r.id}>
              <path
                d={getSlicePath(i, restaurants.length, CX, CY, R)}
                fill={SLICE_COLORS[i % SLICE_COLORS.length]}
              />
              <text
                x={pos.x}
                y={pos.y}
                fill="white"
                fontSize="8"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
              >
                {label}
              </text>
            </g>
          )
        })}
        {/* 중앙 원 */}
        <circle cx={CX} cy={CY} r={16} fill="#0f172a" stroke="#6366f1" strokeWidth={2} />
        <text
          x={CX}
          y={CY}
          fill="#6366f1"
          fontSize={9}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          GO
        </text>
      </svg>
    </div>
  )
})

export default SpinWheel
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- SpinWheel.test.tsx
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/components/SpinWheel.tsx src/components/SpinWheel.test.tsx
git commit -m "feat: add SVG SpinWheel component with CSS animation"
```

---

## Task 8: ResultCard 컴포넌트 (`src/components/ResultCard.tsx`)

**Files:**
- Create: `src/components/ResultCard.tsx`
- Create: `src/components/ResultCard.test.tsx`

- [ ] **Step 1: 테스트 작성**

```tsx
// src/components/ResultCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultCard from './ResultCard'
import type { KakaoPlace } from '@/lib/kakao'

const mockPlace: KakaoPlace = {
  id: '1',
  place_name: '명동교자',
  category_name: '음식점 > 한식 > 칼국수,만두',
  address_name: '서울 중구 명동10길 29',
  road_address_name: '서울 중구 명동10길 29',
  distance: '536',
  place_url: 'https://place.map.kakao.com/12345',
}

describe('ResultCard', () => {
  it('식당 이름 표시', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText('명동교자')).toBeInTheDocument()
  })

  it('주소 표시', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText('서울 중구 명동10길 29')).toBeInTheDocument()
  })

  it('도보 시간 표시 (536m → 8분)', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText(/도보 8분/)).toBeInTheDocument()
  })

  it('카테고리 마지막 세그먼트 표시', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText('칼국수,만두')).toBeInTheDocument()
  })

  it('카카오맵 링크가 올바른 href', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    const link = screen.getByRole('link', { name: /카카오맵/ })
    expect(link).toHaveAttribute('href', 'https://place.map.kakao.com/12345')
  })

  it('다시 돌리기 클릭 시 onReroll 호출', () => {
    const onReroll = vi.fn()
    render(<ResultCard restaurant={mockPlace} onReroll={onReroll} />)
    fireEvent.click(screen.getByText(/다시 돌리기/))
    expect(onReroll).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- ResultCard.test.tsx
```

Expected: FAIL — `Cannot find module './ResultCard'`

- [ ] **Step 3: `src/components/ResultCard.tsx` 구현**

```tsx
'use client'

import type { KakaoPlace } from '@/lib/kakao'
import { toWalkingMinutes } from '@/lib/utils'

interface Props {
  restaurant: KakaoPlace
  onReroll: () => void
}

export default function ResultCard({ restaurant, onReroll }: Props) {
  const minutes = toWalkingMinutes(Number(restaurant.distance))
  const categoryLabel = restaurant.category_name.split(' > ').pop() ?? restaurant.category_name

  return (
    <div className="bg-gradient-to-br from-slate-800 to-indigo-950 border-2 border-indigo-500 rounded-2xl p-4">
      <div className="flex gap-3 items-start mb-3">
        <div className="bg-indigo-500 rounded-lg p-2 text-xl shrink-0">🍽️</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-black text-lg leading-tight truncate">
            {restaurant.place_name}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
            {restaurant.road_address_name || restaurant.address_name}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-slate-400 text-xs">🚶 도보 {minutes}분</span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-slate-400 text-xs">{categoryLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={restaurant.place_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg text-center"
        >
          🗺️ 카카오맵 열기
        </a>
        <button
          onClick={onReroll}
          className="flex-1 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 transition-colors"
        >
          🔄 다시 돌리기
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- ResultCard.test.tsx
```

Expected: PASS — 6 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/components/ResultCard.tsx src/components/ResultCard.test.tsx
git commit -m "feat: add ResultCard component"
```

---

## Task 9: 메인 페이지 (`src/app/page.tsx` + `src/app/layout.tsx`)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: `src/app/layout.tsx` 교체**

```tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '맛플 — 오늘 점심, 운에 맡겨봐',
  description: '직장인을 위한 주변 맛집 룰렛',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: `src/app/page.tsx` 교체**

```tsx
'use client'

import { useRef, useState, useCallback } from 'react'
import FilterPanel from '@/components/FilterPanel'
import SpinWheel, { type SpinWheelRef } from '@/components/SpinWheel'
import ResultCard from '@/components/ResultCard'
import type { KakaoPlace, CategoryFilter } from '@/lib/kakao'

const PLACEHOLDER_RESTAURANTS: KakaoPlace[] = [
  '명동교자', '스시로', '홍콩반점', '한솥도시락',
  '교촌치킨', '맥도날드', '버거킹', '서브웨이',
].map((name, i) => ({
  id: String(i),
  place_name: name,
  category_name: '음식점',
  address_name: '',
  road_address_name: '',
  distance: '0',
  place_url: '',
}))

export default function Home() {
  const [radius, setRadius] = useState(1000)
  const [category, setCategory] = useState<CategoryFilter>('전체')
  const [restaurants, setRestaurants] = useState<KakaoPlace[]>(PLACEHOLDER_RESTAURANTS)
  const [winner, setWinner] = useState<KakaoPlace | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationFallback, setLocationFallback] = useState(false)
  const [address, setAddress] = useState('')
  const wheelRef = useRef<SpinWheelRef>(null)

  const startSpin = useCallback((list: KakaoPlace[]) => {
    const capped = list.slice(0, 8)
    setRestaurants(capped)
    setWinner(null)
    setSpinning(true)
    const winnerIndex = Math.floor(Math.random() * capped.length)
    // 작은 딜레이로 새 식당 목록이 렌더링된 뒤 spin 호출
    setTimeout(() => wheelRef.current?.spin(winnerIndex), 50)
  }, [])

  const fetchAndSpin = useCallback(
    async (lat: number, lng: number) => {
      const res = await fetch(
        `/api/restaurants?lat=${lat}&lng=${lng}&radius=${radius}&category=${encodeURIComponent(category)}`
      )
      if (!res.ok) {
        setError('식당 검색에 실패했습니다. 다시 시도해주세요.')
        setSpinning(false)
        return
      }
      const data = await res.json()
      const list: KakaoPlace[] = data.restaurants
      if (list.length === 0) {
        setError('주변 식당을 찾지 못했습니다. 반경을 늘려보세요.')
        setSpinning(false)
        return
      }
      startSpin(list)
    },
    [radius, category, startSpin]
  )

  const handleSpin = useCallback(async () => {
    if (spinning) return
    setError(null)

    if (locationFallback) {
      if (!address.trim()) {
        setError('주소를 입력해주세요.')
        return
      }
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(address)}`)
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? '주소를 찾을 수 없습니다.')
        return
      }
      const coords = await res.json()
      await fetchAndSpin(coords.lat, coords.lng)
      return
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      await fetchAndSpin(pos.coords.latitude, pos.coords.longitude)
    } catch {
      setLocationFallback(true)
      setError('위치 권한이 거부됐습니다. 아래에 주소를 입력해주세요.')
    }
  }, [spinning, locationFallback, address, fetchAndSpin])

  const handleSpinEnd = useCallback((w: KakaoPlace) => {
    setWinner(w)
    setSpinning(false)
  }, [])

  const handleReroll = useCallback(() => {
    if (restaurants.length === 0) return
    setWinner(null)
    setSpinning(true)
    const winnerIndex = Math.floor(Math.random() * restaurants.length)
    setTimeout(() => wheelRef.current?.spin(winnerIndex), 50)
  }, [restaurants])

  return (
    <main className="min-h-screen text-slate-100 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        {/* 헤더 */}
        <header className="text-center">
          <h1 className="text-2xl font-black">🍽️ 맛플</h1>
          <p className="text-slate-500 text-sm">오늘 점심, 운에 맡겨봐</p>
        </header>

        {/* 위치 폴백 입력 */}
        {locationFallback && (
          <div className="space-y-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSpin()}
              placeholder="예: 서울 강남구 테헤란로"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
        )}

        {/* 스핀 휠 */}
        <div className="flex justify-center py-2">
          <SpinWheel
            ref={wheelRef}
            restaurants={restaurants}
            onSpinEnd={handleSpinEnd}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-amber-400 text-sm text-center">{error}</p>
        )}

        {/* 필터 패널 */}
        <FilterPanel
          radius={radius}
          category={category}
          onRadiusChange={setRadius}
          onCategoryChange={setCategory}
        />

        {/* CTA 버튼 */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {spinning ? '돌아가는 중...' : '🎡 룰렛 돌리기'}
        </button>

        {/* 결과 카드 */}
        {winner && (
          <ResultCard restaurant={winner} onReroll={handleReroll} />
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: 기본 Tailwind 배경색 확인 — `src/app/globals.css`**

`globals.css`의 `body` 스타일이 Tailwind `bg-slate-950`과 충돌하지 않는지 확인. `@layer base` 안에 `background-color`가 있으면 제거.

- [ ] **Step 4: 개발 서버 실행 + 수동 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기.

체크리스트:
- [ ] 룰렛 휠이 플레이스홀더 식당 이름과 함께 표시됨
- [ ] 필터 패널(거리 3개, 카테고리 5개)이 클릭 시 시각적으로 변경됨
- [ ] "룰렛 돌리기" 클릭 시 위치 권한 요청 팝업이 뜸
- [ ] 위치 허용 후 실제 카카오 API 결과로 휠이 채워지고 스핀 후 ResultCard가 표시됨
- [ ] "다시 돌리기" 클릭 시 재스핀
- [ ] 위치 거부 시 주소 입력창이 나타남

- [ ] **Step 5: 커밋**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: wire up main page with geolocation, spin wheel, and result card"
```

---

## Task 10: Vercel 배포

**Files:**
- Modify: `.gitignore` (확인)

- [ ] **Step 1: `.env.local`이 `.gitignore`에 있는지 확인**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` 출력. 없으면 추가:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 2: Vercel CLI 설치 (없으면)**

```bash
npm i -g vercel
```

- [ ] **Step 3: Vercel에 프로젝트 연결 + 배포**

```bash
vercel
```

프롬프트:
- Set up and deploy? → Y
- Which scope? → 본인 계정 선택
- Link to existing project? → N (새 프로젝트)
- Project name → `mapple` (또는 원하는 이름)
- In which directory? → `.` (현재)
- Override settings? → N

- [ ] **Step 4: 카카오 API 키 환경변수 등록**

```bash
vercel env add KAKAO_REST_API_KEY production
```

프롬프트에 실제 `KAKAO_REST_API_KEY` 값 입력.

카카오 REST API 키 발급 방법:
1. https://developers.kakao.com 접속 → 로그인
2. 내 애플리케이션 → 애플리케이션 추가
3. 플랫폼 → Web → 사이트 도메인에 배포 URL 등록
4. 앱 키 → REST API 키 복사

- [ ] **Step 5: 프로덕션 배포**

```bash
vercel --prod
```

Expected: 배포 URL 출력 (예: `https://mapple.vercel.app`)

- [ ] **Step 6: 배포된 URL에서 수동 확인**

체크리스트:
- [ ] 휠이 정상 렌더링됨
- [ ] 위치 허용 후 실제 주변 식당 데이터로 룰렛이 작동함
- [ ] HTTPS에서 Geolocation API가 정상 동작함 (Vercel 기본 HTTPS)
- [ ] 결과 카드의 카카오맵 링크가 올바르게 열림

- [ ] **Step 7: 최종 커밋**

```bash
git add -A
git commit -m "chore: finalize deployment config"
git push
```

---

## 전체 테스트 실행

```bash
npm test
```

Expected: 모든 테스트 PASS (kakao, utils, wheel, FilterPanel, ResultCard, API routes)
