// src/lib/kakao.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchRestaurants } from './kakao'

const makePlaces = (entries: Array<{ name: string; cat: string }>) =>
  entries.map((e, i) => ({
    id: String(i),
    place_name: e.name,
    category_name: e.cat,
    address_name: `서울 강남구 테스트로 ${i}`,
    road_address_name: `서울 강남구 테스트로 ${i}`,
    distance: String((i + 1) * 100),
    place_url: `https://place.map.kakao.com/${i}`,
  }))

describe('searchRestaurants', () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = 'test-key'
  })

  it('calls Kakao API with Authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: makePlaces([{ name: 'A', cat: '음식점 > 한식' }]) }),
    } as Response)

    await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '전체' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('y=37.5'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'KakaoAK test-key' }),
      })
    )
  })

  it('returns all restaurants when category is 전체', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: makePlaces([
          { name: '한식집', cat: '음식점 > 한식' },
          { name: '중식집', cat: '음식점 > 중식' },
        ]),
      }),
    } as Response)

    const result = await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '전체' })
    expect(result).toHaveLength(2)
  })

  it('filters by category_name when 4+ results match', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: makePlaces([
          { name: '한A', cat: '음식점 > 한식' },
          { name: '한B', cat: '음식점 > 한식' },
          { name: '한C', cat: '음식점 > 한식' },
          { name: '한D', cat: '음식점 > 한식' },
          { name: '중A', cat: '음식점 > 중식' },
        ]),
      }),
    } as Response)

    const result = await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '한식' })
    expect(result).toHaveLength(4)
    expect(result.every((p) => p.category_name.includes('한식'))).toBe(true)
  })

  it('returns only filtered results even when fewer than 4', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: makePlaces([
          { name: '한A', cat: '음식점 > 한식' },
          { name: '한B', cat: '음식점 > 한식' },
          { name: '중A', cat: '음식점 > 중식' },
          { name: '중B', cat: '음식점 > 중식' },
          { name: '중C', cat: '음식점 > 중식' },
        ]),
      }),
    } as Response)

    const result = await searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '한식' })
    expect(result).toHaveLength(2)
    expect(result.every((p) => p.category_name.includes('한식'))).toBe(true)
  })

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 } as Response)

    await expect(
      searchRestaurants({ lat: 37.5, lng: 127.0, radius: 1000, category: '전체' })
    ).rejects.toThrow('Kakao API error: 401')
  })
})
