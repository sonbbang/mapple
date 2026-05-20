import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('place_id')
  if (!placeId) {
    return NextResponse.json({ error: 'place_id가 필요합니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('place_id', placeId)
    .order('visited_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: '리뷰 조회에 실패했습니다.' }, { status: 500 })
  }

  const reviews = data ?? []
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : 0

  return NextResponse.json({ reviews, avgRating, count: reviews.length })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { place_id, place_name, rating, comment, revisit } = body

  if (!place_id || !place_name) {
    return NextResponse.json({ error: 'place_id와 place_name이 필요합니다.' }, { status: 400 })
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '별점은 1~5 사이여야 합니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ place_id, place_name, rating, comment: comment || null, revisit: revisit ?? null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '리뷰 저장에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ review: data }, { status: 201 })
}
