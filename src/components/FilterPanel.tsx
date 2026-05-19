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
