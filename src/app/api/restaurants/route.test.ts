import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'
import * as kakao from '@/lib/kakao'

vi.mock('@/lib/kakao')

const makeUrl = (params: Record<string, string>) => {
  const url = new URL('http://localhost/api/restaurants')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.toString()
}

describe('GET /api/restaurants', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lat 없으면 400', async () => {
    const res = await GET(new NextRequest(makeUrl({ lng: '127.0' })))
    expect(res.status).toBe(400)
  })

  it('lng 없으면 400', async () => {
    const res = await GET(new NextRequest(makeUrl({ lat: '37.5' })))
    expect(res.status).toBe(400)
  })

  it('성공 시 restaurants 반환', async () => {
    const places = [
      {
        id: '1',
        place_name: '맛집',
        category_name: '음식점 > 한식',
        address_name: '서울',
        road_address_name: '서울',
        distance: '100',
        place_url: 'https://place.map.kakao.com/1',
        x: '127.0',
        y: '37.5',
      },
    ]
    vi.mocked(kakao.searchRestaurants).mockResolvedValueOnce(places)

    const res = await GET(new NextRequest(makeUrl({ lat: '37.5', lng: '127.0' })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.restaurants).toEqual(places)
  })

  it('kakao 실패 시 500', async () => {
    vi.mocked(kakao.searchRestaurants).mockRejectedValueOnce(new Error('API error'))

    const res = await GET(new NextRequest(makeUrl({ lat: '37.5', lng: '127.0' })))
    expect(res.status).toBe(500)
  })
})
