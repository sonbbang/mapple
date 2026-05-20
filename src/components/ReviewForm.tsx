'use client'

import { useEffect, useState } from 'react'
import type { Review } from '@/lib/supabase'

interface Props {
  placeId: string
  placeName: string
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ReviewForm({ placeId, placeName }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [revisit, setRevisit] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [avgRating, setAvgRating] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])

  function loadReviews() {
    fetch(`/api/reviews?place_id=${encodeURIComponent(placeId)}`)
      .then((r) => r.json())
      .then((data) => {
        setAvgRating(data.avgRating ?? 0)
        setReviews(data.reviews ?? [])
      })
      .catch(() => {})
  }

  useEffect(() => {
    setRating(0)
    setHovered(0)
    setComment('')
    setRevisit(null)
    setSubmitted(false)
    setReviews([])
    loadReviews()
  }, [placeId])

  async function handleSubmit() {
    if (rating === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId, place_name: placeName, rating, comment, revisit }),
      })
      if (res.ok) {
        setSubmitted(true)
        loadReviews()
      }
    } finally {
      setLoading(false)
    }
  }

  const displayStars = hovered || rating
  const reviewCount = reviews.length

  return (
    <div className="mt-3 pt-3 border-t border-slate-700">
      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">리뷰 남기기</p>

      {reviewCount > 0 && (
        <p className="text-slate-400 text-xs mb-3">
          평균 <StarRow rating={Math.round(avgRating)} /> ({reviewCount}명 방문)
        </p>
      )}

      {submitted ? (
        <p className="text-green-400 text-sm text-center py-2">✅ 리뷰가 저장되었습니다!</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`text-xl transition-colors ${star <= displayStars ? 'text-yellow-400' : 'text-slate-600'}`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
            {rating > 0 && <span className="text-slate-400 text-xs ml-1">{rating}점</span>}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="한 줄 메모 (선택)"
            rows={2}
            className="w-full bg-slate-900 text-slate-200 text-xs rounded-lg px-3 py-2 resize-none placeholder-slate-600 border border-slate-700 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">재방문?</span>
            <button
              onClick={() => setRevisit(revisit === true ? null : true)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${revisit === true ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              👍 예
            </button>
            <button
              onClick={() => setRevisit(revisit === false ? null : false)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${revisit === false ? 'bg-red-900 text-red-300' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              👎 아니오
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '리뷰 저장'}
          </button>
        </div>
      )}

      {reviewCount > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">다른 사람 리뷰</p>
          {reviews.map((r) => (
            <div key={r.id} className="bg-slate-900 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <StarRow rating={r.rating} />
                {r.revisit === true && <span className="text-xs text-indigo-400">👍 재방문</span>}
                {r.revisit === false && <span className="text-xs text-red-400">👎 재방문 안함</span>}
                <span className="text-slate-600 text-xs ml-auto">
                  {new Date(r.visited_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {r.comment && (
                <p className="text-slate-300 text-xs leading-relaxed">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
