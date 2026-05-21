import { NextRequest } from 'next/server'

interface NaverLocalItem {
  title: string
  link: string
}

interface NaverLocalResponse {
  items: NaverLocalItem[]
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return Response.json({ url: null }, { status: 400 })

  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) return Response.json({ url: null }, { status: 500 })

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=1`,
    {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    }
  )

  if (!res.ok) return Response.json({ url: null })

  const data: NaverLocalResponse = await res.json()
  const url = data.items?.[0]?.link ?? null

  return Response.json({ url })
}
