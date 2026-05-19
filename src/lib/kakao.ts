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

export async function searchRestaurants(params: {
  lat: number
  lng: number
  radius: number
  category: CategoryFilter
}): Promise<KakaoPlace[]> {
  const url = new URL('https://dapi.kakao.com/v2/local/search/category.json')
  url.searchParams.set('category_group_code', 'FD6')
  url.searchParams.set('y', String(params.lat))
  url.searchParams.set('x', String(params.lng))
  url.searchParams.set('radius', String(params.radius))
  url.searchParams.set('sort', 'distance')
  url.searchParams.set('size', '15')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Kakao API error: ${res.status}`)

  const data: KakaoSearchResponse = await res.json()

  if (params.category === '전체') return data.documents

  const filtered = data.documents.filter((p) =>
    p.category_name.includes(params.category)
  )
  return filtered.length >= 4 ? filtered : data.documents
}
