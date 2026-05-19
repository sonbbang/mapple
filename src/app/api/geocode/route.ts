import { NextRequest, NextResponse } from 'next/server'

interface KakaoAddressDoc {
  y: string
  x: string
  address_name: string
}

interface KakaoAddressResponse {
  documents: KakaoAddressDoc[]
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) {
    return NextResponse.json({ error: '주소를 입력해주세요.' }, { status: 400 })
  }

  const url = new URL('https://dapi.kakao.com/v2/local/search/address.json')
  url.searchParams.set('query', query)

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: '주소 검색에 실패했습니다.' }, { status: 500 })
    }

    const data: KakaoAddressResponse = await res.json()
    const first = data.documents?.[0]
    if (!first) {
      return NextResponse.json({ error: '주소를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      lat: Number(first.y),
      lng: Number(first.x),
      address: first.address_name,
    })
  } catch {
    return NextResponse.json({ error: '주소 검색에 실패했습니다.' }, { status: 500 })
  }
}
