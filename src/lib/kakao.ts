import { shuffle } from './utils'

export interface KakaoPlace {
  id: string
  place_name: string
  category_name: string
  address_name: string
  road_address_name: string
  distance: string
  place_url: string
}

export type CategoryFilter = '전체' | '한식' | '중식' | '일식' | '양식'

interface KakaoSearchResponse {
  documents: KakaoPlace[]
}

function pageCountForRadius(radius: number): number {
  if (radius <= 500) return 1
  if (radius <= 1000) return 2
  return 3
}

export async function searchRestaurants(params: {
  lat: number
  lng: number
  radius: number
  category: CategoryFilter
}): Promise<KakaoPlace[]> {
  const baseUrl = new URL('https://dapi.kakao.com/v2/local/search/category.json')
  baseUrl.searchParams.set('category_group_code', 'FD6')
  baseUrl.searchParams.set('y', String(params.lat))
  baseUrl.searchParams.set('x', String(params.lng))
  baseUrl.searchParams.set('radius', String(params.radius))
  baseUrl.searchParams.set('sort', 'distance')
  baseUrl.searchParams.set('size', '15')

  const pageCount = pageCountForRadius(params.radius)
  const pageResults = await Promise.all(
    Array.from({ length: pageCount }, async (_, i) => {
      const url = new URL(baseUrl.toString())
      url.searchParams.set('page', String(i + 1))
      const res = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
      })
      if (!res.ok) throw new Error(`Kakao API error: ${res.status}`)
      const data: KakaoSearchResponse = await res.json()
      return data.documents
    })
  )

  const EXCLUDE = ['카페', '제과', '베이커리', '주점']
  const seen = new Set<string>()
  const all = pageResults.flat().filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    if (EXCLUDE.some((kw) => p.category_name.includes(kw))) return false
    return true
  })

  const shuffled = shuffle(all)

  if (params.category === '전체') return shuffled

  return shuffled.filter((p) => p.category_name.includes(params.category))
}
