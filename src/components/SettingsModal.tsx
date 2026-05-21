'use client'

import type { CategoryFilter } from '@/lib/kakao'

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: '전체', value: '전체' },
  { label: '🍚 한식', value: '한식' },
  { label: '🍜 중식', value: '중식' },
  { label: '🍣 일식', value: '일식' },
  { label: '🍕 양식', value: '양식' },
]

interface Props {
  wheelCount: 3 | 5 | 8
  mapProvider: 'kakao' | 'naver'
  radius: number
  category: CategoryFilter
  excludedCount: number
  theme: 'dark' | 'light'
  onWheelCountChange: (n: 3 | 5 | 8) => void
  onMapProviderChange: (p: 'kakao' | 'naver') => void
  onRadiusChange: (r: number) => void
  onCategoryChange: (c: CategoryFilter) => void
  onClearExcluded: () => void
  onThemeChange: (t: 'dark' | 'light') => void
  onClose: () => void
}

export default function SettingsModal({
  wheelCount, mapProvider, radius, category, excludedCount, theme,
  onWheelCountChange, onMapProviderChange, onRadiusChange, onCategoryChange,
  onClearExcluded, onThemeChange, onClose,
}: Props) {
  const btnBase = 'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors'
  const btnActive = 'bg-indigo-500 text-white'
  const btnInactive = 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 고정 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-gray-900 dark:text-white font-bold text-lg">⚙️ 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto px-6 pb-8 space-y-6">

          {/* 룰렛 개수 */}
          <div>
            <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">룰렛 개수</p>
            <div className="flex gap-2">
              {([3, 5, 8] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => onWheelCountChange(n)}
                  className={`${btnBase} ${wheelCount === n ? btnActive : btnInactive}`}
                >
                  {n}개
                </button>
              ))}
            </div>
          </div>

          {/* 지도 연동 */}
          <div>
            <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">지도 연동</p>
            <div className="flex gap-2">
              <button
                onClick={() => onMapProviderChange('kakao')}
                className={`${btnBase} ${mapProvider === 'kakao' ? btnActive : btnInactive}`}
              >
                카카오맵
              </button>
              <button
                onClick={() => onMapProviderChange('naver')}
                className={`${btnBase} ${mapProvider === 'naver' ? 'bg-green-500 text-white' : btnInactive}`}
              >
                네이버지도
              </button>
            </div>
          </div>

          {/* 기본 반경 */}
          <div>
            <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">기본 반경</p>
            <div className="flex gap-2">
              {[{ label: '500m', value: 500 }, { label: '1km', value: 1000 }, { label: '2km', value: 2000 }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onRadiusChange(opt.value)}
                  className={`${btnBase} ${radius === opt.value ? btnActive : btnInactive}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 기본 카테고리 */}
          <div>
            <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">기본 카테고리</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onCategoryChange(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    category === opt.value ? btnActive : btnInactive
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 테마 */}
          <div>
            <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">테마</p>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange('dark')}
                className={`${btnBase} ${theme === 'dark' ? btnActive : btnInactive}`}
              >
                🌙 다크
              </button>
              <button
                onClick={() => onThemeChange('light')}
                className={`${btnBase} ${theme === 'light' ? btnActive : btnInactive}`}
              >
                ☀️ 라이트
              </button>
            </div>
          </div>

          {/* 제외 목록 초기화 */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-slate-300 text-sm">제외 목록 초기화</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">
                  {excludedCount > 0 ? `${excludedCount}개 제외 중` : '제외된 식당 없음'}
                </p>
              </div>
              <button
                onClick={onClearExcluded}
                disabled={excludedCount === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                초기화
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
