'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import FilterPanel from '@/components/FilterPanel'
import SpinWheel, { type SpinWheelRef } from '@/components/SpinWheel'
import ResultCard from '@/components/ResultCard'
import SettingsModal from '@/components/SettingsModal'
import HistoryModal from '@/components/HistoryModal'
import type { KakaoPlace, CategoryFilter } from '@/lib/kakao'
import { getFavorites, addFavorite, removeFavorite, isFavorited, addVisitRecord, type Favorite } from '@/lib/storage'

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
  x: '',
  y: '',
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
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [wheelCount, setWheelCount] = useState<3 | 5 | 8>(8)
  const [mapProvider, setMapProvider] = useState<'kakao' | 'naver'>('kakao')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])

  const excludedIdsRef = useRef<Set<string>>(new Set())
  const wheelCountRef = useRef<3 | 5 | 8>(8)
  const wheelRef = useRef<SpinWheelRef>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // localStorage 로드
  useEffect(() => {
    const storedExcluded = localStorage.getItem('mapple_excluded')
    if (storedExcluded) {
      const ids = new Set<string>(JSON.parse(storedExcluded) as string[])
      setExcludedIds(ids)
      excludedIdsRef.current = ids
    }
    const storedCount = localStorage.getItem('mapple_wheel_count')
    if (storedCount === '3' || storedCount === '5' || storedCount === '8') {
      const n = Number(storedCount) as 3 | 5 | 8
      setWheelCount(n)
      wheelCountRef.current = n
      setRestaurants(PLACEHOLDER_RESTAURANTS.slice(0, n))
    }
    const storedProvider = localStorage.getItem('mapple_map_provider')
    if (storedProvider === 'kakao' || storedProvider === 'naver') {
      setMapProvider(storedProvider)
    }
    const storedRadius = localStorage.getItem('mapple_radius')
    if (storedRadius === '500' || storedRadius === '1000' || storedRadius === '2000') {
      const r = Number(storedRadius) as 500 | 1000 | 2000
      setRadius(r)
      radiusRef.current = r
    }
    const storedCategory = localStorage.getItem('mapple_category')
    if (['전체', '한식', '중식', '일식', '양식'].includes(storedCategory ?? '')) {
      setCategory(storedCategory as CategoryFilter)
      categoryRef.current = storedCategory as CategoryFilter
    }
    const storedTheme = localStorage.getItem('mapple_theme')
    if (storedTheme === 'light') {
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
    setFavorites(getFavorites())
  }, [])

  // 테마 토글
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // 결과 카드 자동 스크롤
  useEffect(() => {
    if (winner) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [winner])

  // Refs so fetchAndSpin always reads the latest values without stale closure
  const locationRef = useRef<{ lat: number; lng: number } | null>(null)
  const categoryRef = useRef<CategoryFilter>('전체')
  const radiusRef = useRef(1000)
  const spinningRef = useRef(false)

  const startSpin = useCallback((list: KakaoPlace[]) => {
    const capped = list.slice(0, wheelCountRef.current)
    setRestaurants(capped)
    setWinner(null)
    setSpinning(true)
    spinningRef.current = true
    const winnerIndex = Math.floor(Math.random() * capped.length)
    setTimeout(() => wheelRef.current?.spin(winnerIndex), 50)
  }, [])

  const fetchAndSpin = useCallback(
    async (lat: number, lng: number) => {
      locationRef.current = { lat, lng }
      setSpinning(true)
      spinningRef.current = true
      setError(null)
      const res = await fetch(
        `/api/restaurants?lat=${lat}&lng=${lng}&radius=${radiusRef.current}&category=${encodeURIComponent(categoryRef.current)}`
      )
      if (!res.ok) {
        setError('식당 검색에 실패했습니다. 다시 시도해주세요.')
        setSpinning(false)
        spinningRef.current = false
        return
      }
      const data = await res.json()
      const list: KakaoPlace[] = (data.restaurants as KakaoPlace[]).filter(
        (r) => !excludedIdsRef.current.has(r.id)
      )
      if (list.length === 0) {
        setError('주변 식당을 찾지 못했습니다. 반경을 늘려보세요.')
        setSpinning(false)
        spinningRef.current = false
        return
      }
      startSpin(list)
    },
    [startSpin]
  )

  const handleSpin = useCallback(async () => {
    if (spinningRef.current) return
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
  }, [locationFallback, address, fetchAndSpin])

  const handleSpinEnd = useCallback((w: KakaoPlace) => {
    setWinner(w)
    setSpinning(false)
    spinningRef.current = false
  }, [])

  const handleExclude = useCallback((id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('mapple_excluded', JSON.stringify([...next]))
      excludedIdsRef.current = next
      return next
    })
    setWinner(null)
    const remaining = restaurants.filter((r) => r.id !== id)
    if (remaining.length > 0) {
      setRestaurants(remaining)
      setSpinning(true)
      spinningRef.current = true
      const winnerIndex = Math.floor(Math.random() * remaining.length)
      setTimeout(() => wheelRef.current?.spin(winnerIndex), 50)
    }
  }, [restaurants])

  const handleReroll = useCallback(() => {
    if (restaurants.length === 0) return
    setWinner(null)
    setSpinning(true)
    spinningRef.current = true
    const winnerIndex = Math.floor(Math.random() * restaurants.length)
    setTimeout(() => wheelRef.current?.spin(winnerIndex), 50)
  }, [restaurants])

  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius)
    radiusRef.current = newRadius
    localStorage.setItem('mapple_radius', String(newRadius))
    if (locationRef.current && !spinningRef.current) {
      fetchAndSpin(locationRef.current.lat, locationRef.current.lng)
    }
  }, [fetchAndSpin])

  const handleCategoryChange = useCallback((newCategory: CategoryFilter) => {
    setCategory(newCategory)
    categoryRef.current = newCategory
    localStorage.setItem('mapple_category', newCategory)
    if (locationRef.current && !spinningRef.current) {
      fetchAndSpin(locationRef.current.lat, locationRef.current.lng)
    }
  }, [fetchAndSpin])

  const handleWheelCountChange = useCallback((n: 3 | 5 | 8) => {
    setWheelCount(n)
    wheelCountRef.current = n
    localStorage.setItem('mapple_wheel_count', String(n))
    if (!locationRef.current) {
      setRestaurants(PLACEHOLDER_RESTAURANTS.slice(0, n))
    }
  }, [])

  const handleMapProviderChange = useCallback((p: 'kakao' | 'naver') => {
    setMapProvider(p)
    localStorage.setItem('mapple_map_provider', p)
  }, [])

  const handleThemeChange = useCallback((t: 'dark' | 'light') => {
    setTheme(t)
    localStorage.setItem('mapple_theme', t)
  }, [])

  const handleClearExcluded = useCallback(() => {
    setExcludedIds(new Set())
    excludedIdsRef.current = new Set()
    localStorage.removeItem('mapple_excluded')
  }, [])

  const handleToggleFavorite = useCallback((restaurant: KakaoPlace) => {
    if (isFavorited(restaurant.id)) {
      setFavorites(removeFavorite(restaurant.id))
    } else {
      setFavorites(addFavorite(restaurant))
    }
  }, [])

  const handleMapOpen = useCallback((restaurant: KakaoPlace) => {
    addVisitRecord(restaurant)
  }, [])

  const handleRemoveFavoriteFromModal = useCallback((id: string) => {
    setFavorites(removeFavorite(id))
  }, [])

  return (
    <main className="min-h-screen text-gray-900 dark:text-slate-100 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        {/* 헤더 */}
        <header className="relative text-center">
          <h1 className="text-2xl font-black">🍽️ 맛플</h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm">오늘 점심, 운에 맡겨봐</p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-xl transition-colors"
              aria-label="기록"
            >
              📋
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-xl transition-colors"
              aria-label="설정"
            >
              ⚙️
            </button>
          </div>
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
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            />
          </div>
        )}

        {/* 스핀 휠 */}
        <div className="flex justify-center py-2">
          <SpinWheel
            ref={wheelRef}
            restaurants={restaurants}
            mapProvider={mapProvider}
            onSpinEnd={handleSpinEnd}
            onSliceClick={(r) => {
              setWinner(r)
              setSpinning(false)
              spinningRef.current = false
            }}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-amber-500 dark:text-amber-400 text-sm text-center">{error}</p>
        )}

        {/* 필터 패널 */}
        <FilterPanel
          radius={radius}
          category={category}
          onRadiusChange={handleRadiusChange}
          onCategoryChange={handleCategoryChange}
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
        <div ref={resultRef}>
          {winner && (
            <ResultCard
              restaurant={winner}
              mapProvider={mapProvider}
              isFavorited={favorites.some((f) => f.id === winner.id)}
              onReroll={handleReroll}
              onExclude={() => handleExclude(winner.id)}
              onToggleFavorite={() => handleToggleFavorite(winner)}
              onMapOpen={() => handleMapOpen(winner)}
            />
          )}
        </div>
      </div>

      {historyOpen && (
        <HistoryModal
          mapProvider={mapProvider}
          onRemoveFavorite={handleRemoveFavoriteFromModal}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          wheelCount={wheelCount}
          mapProvider={mapProvider}
          radius={radius}
          category={category}
          excludedCount={excludedIds.size}
          theme={theme}
          onWheelCountChange={handleWheelCountChange}
          onMapProviderChange={handleMapProviderChange}
          onRadiusChange={handleRadiusChange}
          onCategoryChange={handleCategoryChange}
          onClearExcluded={handleClearExcluded}
          onThemeChange={handleThemeChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  )
}
