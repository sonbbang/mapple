'use client'

import type { KakaoPlace } from '@/lib/kakao'
import { toWalkingMinutes } from '@/lib/utils'
import ReviewForm from './ReviewForm'

interface Props {
  restaurant: KakaoPlace
  mapProvider?: 'kakao' | 'naver'
  isFavorited?: boolean
  onReroll: () => void
  onExclude?: () => void
  onToggleFavorite?: () => void
  onMapOpen?: () => void
}

export default function ResultCard({
  restaurant,
  mapProvider = 'naver',
  isFavorited = false,
  onReroll,
  onExclude,
  onToggleFavorite,
  onMapOpen,
}: Props) {
  const minutes = toWalkingMinutes(Number(restaurant.distance))
  const categoryLabel = restaurant.category_name.split(' > ').pop() ?? restaurant.category_name
  const mapUrl = mapProvider === 'naver'
    ? `https://map.naver.com/p/search/${encodeURIComponent(restaurant.place_name)}${restaurant.x && restaurant.y ? `?c=${restaurant.x},${restaurant.y},15,0,0,0,dh` : ''}`
    : restaurant.place_url || `https://map.kakao.com/?q=${encodeURIComponent(restaurant.place_name)}`

  function handleMapClick() {
    onMapOpen?.()
    window.open(mapUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-2 border-indigo-500 rounded-2xl p-4">
      <div className="flex gap-3 items-start mb-3">
        <div className="bg-indigo-500 rounded-lg p-2 text-xl shrink-0">🍽️</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-gray-900 dark:text-white font-black text-lg leading-tight truncate">
            {restaurant.place_name}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5 line-clamp-1">
            {restaurant.road_address_name || restaurant.address_name}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {minutes > 0 && (
              <>
                <span className="text-gray-500 dark:text-slate-400 text-xs">🚶 도보 {minutes}분</span>
                <span className="text-gray-300 dark:text-slate-600 text-xs">·</span>
              </>
            )}
            <span className="text-gray-500 dark:text-slate-400 text-xs">{categoryLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleMapClick}
          className={`flex-1 py-2 text-white text-sm font-semibold rounded-lg text-center ${
            mapProvider === 'naver' ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-500 hover:bg-indigo-600'
          } transition-colors`}
        >
          {mapProvider === 'naver' ? '🗺️ 네이버지도 열기' : '🗺️ 카카오맵 열기'}
        </button>
        <button
          onClick={onReroll}
          className="flex-1 py-2 bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          🔄 다시 돌리기
        </button>
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {isFavorited ? '⭐' : '☆'}
          </button>
        )}
      </div>
      {onExclude && (
        <button
          onClick={onExclude}
          className="w-full mt-2 py-2 bg-gray-50 text-gray-400 dark:bg-slate-900 dark:text-slate-500 text-xs rounded-lg hover:text-red-500 hover:bg-gray-100 dark:hover:text-red-400 dark:hover:bg-slate-800 transition-colors"
        >
          🚫 이 식당 다음부터 제외
        </button>
      )}
      <ReviewForm placeId={restaurant.id} placeName={restaurant.place_name} />
    </div>
  )
}
