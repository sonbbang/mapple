import { NextRequest, NextResponse } from 'next/server'
import { searchRestaurants, type CategoryFilter } from '@/lib/kakao'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

  if (latParam === null || lngParam === null) {
    return NextResponse.json({ error: '위치 정보가 필요합니다.' }, { status: 400 })
  }

  const lat = Number(latParam)
  const lng = Number(lngParam)

  const radius = Number(searchParams.get('radius') ?? '1000')
  const category = (searchParams.get('category') ?? '전체') as CategoryFilter

  try {
    const restaurants = await searchRestaurants({ lat, lng, radius, category })
    return NextResponse.json({ restaurants })
  } catch {
    return NextResponse.json({ error: '식당 검색에 실패했습니다.' }, { status: 500 })
  }
}
