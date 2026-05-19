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
