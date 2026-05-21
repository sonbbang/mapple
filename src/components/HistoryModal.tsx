'use client'

import { useState, useEffect } from 'react'
import { getFavorites, getVisitHistory, removeFavorite, type Favorite, type VisitRecord } from '@/lib/storage'

interface Props {
  mapProvider: 'kakao' | 'naver'
  onRemoveFavorite: (id: string) => void
  onClose: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function mapUrl(place: { place_name: string; place_url: string }, provider: 'kakao' | 'naver'): string {
  return provider === 'naver'
    ? `https://map.naver.com/p/search/${encodeURIComponent(place.place_name)}`
    : place.place_url || `https://map.naver.com/p/search/${encodeURIComponent(place.place_name)}`
}

export default function HistoryModal({ mapProvider, onRemoveFavorite, onClose }: Props) {
  const [tab, setTab] = useState<'favorites' | 'history'>('favorites')
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [history, setHistory] = useState<VisitRecord[]>([])

  useEffect(() => {
    setFavorites(getFavorites())
    setHistory(getVisitHistory())
  }, [])

  function handleRemove(id: string) {
    const updated = removeFavorite(id)
    setFavorites(updated)
    onRemoveFavorite(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-2xl p-4 max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 dark:text-white font-black text-lg">📋 기록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab('favorites')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'favorites'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            ⭐ 즐겨찾기
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'history'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            🕐 방문기록
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto flex-1 space-y-2">
          {tab === 'favorites' && (
            favorites.length === 0
              ? <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-8">아직 즐겨찾기가 없어요 ⭐</p>
              : favorites.map((f) => (
                <div key={f.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{f.place_name}</p>
                      <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5 line-clamp-1">
                        {f.road_address_name || f.address_name}
                      </p>
                      <p className="text-gray-400 dark:text-slate-600 text-xs mt-0.5">
                        {f.category_name.split(' > ').pop()} · {formatDate(f.savedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={mapUrl(f, mapProvider)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 py-1.5 text-white text-xs font-semibold rounded-lg text-center ${
                        mapProvider === 'naver' ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                    >
                      🗺️ 지도
                    </a>
                    <button
                      onClick={() => handleRemove(f.id)}
                      className="flex-1 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 text-xs rounded-lg hover:text-red-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      ⭐ 해제
                    </button>
                  </div>
                </div>
              ))
          )}

          {tab === 'history' && (
            history.length === 0
              ? <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-8">아직 방문 기록이 없어요 🍽️</p>
              : history.map((v, i) => (
                <div key={`${v.id}-${i}`} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{v.place_name}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5 line-clamp-1">
                    {v.road_address_name || v.address_name}
                  </p>
                  <p className="text-gray-400 dark:text-slate-600 text-xs mt-0.5">
                    {v.category_name.split(' > ').pop()} · {formatDate(v.visitedAt)}
                  </p>
                  <a
                    href={mapUrl(v, mapProvider)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 block py-1.5 text-white text-xs font-semibold rounded-lg text-center ${
                      mapProvider === 'naver' ? 'bg-green-500' : 'bg-indigo-500'
                    }`}
                  >
                    🗺️ 지도 열기
                  </a>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
