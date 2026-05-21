# 즐겨찾기 & 방문기록 기능 설계

**날짜:** 2026-05-21  
**기능:** 즐겨찾기(Favorites) + 방문기록(Visit History)  
**범위:** 로그인 없음, localStorage 기반, 단일 기기

---

## 요구사항 요약

| 항목 | 결정 |
|------|------|
| 저장소 | localStorage (로그인 없음, 기기 로컬) |
| 방문 기록 시점 | 지도 버튼 클릭 시 자동 기록 |
| 즐겨찾기 | ResultCard ⭐ 버튼 토글 |
| 진입점 | 헤더 📋 버튼 → 탭 모달 |
| 최대 방문기록 수 | 50개 (초과 시 오래된 항목 제거) |

---

## 데이터 모델

### Favorite

```typescript
interface Favorite {
  id: string
  place_name: string
  category_name: string
  road_address_name: string
  address_name: string
  place_url: string
  savedAt: string   // ISO 날짜 문자열
}
```

- localStorage 키: `mapple_favorites`
- 같은 `id`로 중복 불가

### VisitRecord

```typescript
interface VisitRecord {
  id: string
  place_name: string
  category_name: string
  road_address_name: string
  address_name: string
  place_url: string
  visitedAt: string  // ISO 날짜 문자열
}
```

- localStorage 키: `mapple_history`
- 같은 식당 중복 기록 허용 (날짜별 추적 목적)
- 최대 50개, 초과 시 가장 오래된 항목 제거

---

## 컴포넌트

### 신규: `HistoryModal.tsx`

- 헤더 📋 버튼으로 열림
- 내부에 **즐겨찾기** / **방문기록** 탭
- 각 항목: 식당명, 주소, 카테고리, 날짜, 지도 버튼
- 즐겨찾기 탭: 해제 버튼 포함
- 빈 상태: "아직 즐겨찾기가 없어요 ⭐" / "아직 방문 기록이 없어요 🍽️"
- localStorage에서 직접 읽음 (열릴 때마다 최신값)

```
┌─────────────────────────────┐
│  📋 기록                  ✕ │
│  [⭐ 즐겨찾기] [🕐 방문기록] │
├─────────────────────────────┤
│  🍽️ 식당명                  │
│  주소 · 카테고리 · 날짜      │
│  [지도 열기]  [즐겨찾기 해제]│
└─────────────────────────────┘
```

### 변경: `ResultCard.tsx`

- 버튼 영역에 ⭐ 토글 버튼 추가
  ```
  [🗺️ 지도]  [🔄 다시돌리기]  [⭐]
  ```
- `isFavorited: boolean` prop 추가 → 채워진/빈 별 표시
- 지도 버튼에 `onClick` 핸들러 추가 → 방문기록 저장 후 `window.open`
- `onToggleFavorite: () => void` prop 추가
- `onMapOpen: () => void` prop 추가
- 현재 지도 링크는 `<a>` 태그 → `<button>` 또는 `onClick` 추가 방식으로 변경
  (방문기록 저장 후 `window.open` 호출, `href` 제거)

### 변경: `page.tsx`

- 헤더에 📋 버튼 추가 (⚙️ 왼쪽 배치)
- 추가 상태:
  ```typescript
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  ```
- `useEffect`에서 `mapple_favorites` localStorage 로드
- `handleToggleFavorite(restaurant)` 구현
- `handleMapOpen(restaurant)` 구현 (방문기록 저장 + window.open)

---

## 데이터 흐름

### 즐겨찾기 추가/제거

```
ResultCard ⭐ 클릭
  → page.tsx handleToggleFavorite(restaurant)
  → favorites 배열에서 id로 존재 여부 확인
  → 없으면 추가 (savedAt: new Date().toISOString())
  → 있으면 제거
  → localStorage mapple_favorites 저장
  → setFavorites 업데이트
  → ResultCard isFavorited prop 반영
```

### 방문기록 저장

```
ResultCard 지도 버튼 클릭
  → page.tsx handleMapOpen(restaurant)
  → VisitRecord 생성 (visitedAt: new Date().toISOString())
  → 기존 history 앞에 삽입 (최신순)
  → 50개 초과 시 마지막 제거
  → localStorage mapple_history 저장
  → window.open(mapUrl, '_blank')
```

### HistoryModal

```
📋 버튼 클릭 → setHistoryOpen(true)
  → HistoryModal 마운트 시 localStorage에서 직접 읽기
  → 즐겨찾기 해제 시:
      localStorage 업데이트 + setFavorites 업데이트 (prop으로 콜백 전달)
```

---

## 엣지 케이스

| 케이스 | 처리 방식 |
|--------|-----------|
| localStorage 저장 실패 | try/catch, 조용히 무시 |
| JSON 파싱 실패 | 빈 배열로 초기화 |
| 즐겨찾기된 식당 당첨 | ⭐ 채워진 상태로 ResultCard 표시 |
| 같은 날 같은 식당 여러 번 | 중복 기록 허용 |
| 빈 목록 | 빈 상태 메시지 표시 |

---

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `src/components/HistoryModal.tsx` | 신규 생성 |
| `src/components/ResultCard.tsx` | 수정 (⭐ 버튼, 지도 핸들러) |
| `src/app/page.tsx` | 수정 (상태, 핸들러, 📋 버튼) |
