import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/geocode', () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = 'test-key'
    vi.resetAllMocks()
  })

  it('query 없으면 400', async () => {
    const res = await GET(new NextRequest('http://localhost/api/geocode'))
    expect(res.status).toBe(400)
  })

  it('주소 발견 시 lat/lng 반환', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: [{ y: '37.498095', x: '127.027610', address_name: '서울 강남구 역삼동' }],
      }),
    } as Response)

    const res = await GET(new NextRequest('http://localhost/api/geocode?query=역삼동'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.lat).toBe(37.498095)
    expect(body.lng).toBe(127.02761)
  })

  it('결과 없으면 404', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: [] }),
    } as Response)

    const res = await GET(new NextRequest('http://localhost/api/geocode?query=없는주소xyz'))
    expect(res.status).toBe(404)
  })
})
