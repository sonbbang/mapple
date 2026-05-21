async function fetchNaverUrl(q: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/naver-place?q=${encodeURIComponent(q)}`)
    if (!res.ok) return null
    const { url } = (await res.json()) as { url: string | null }
    return url ?? null
  } catch {
    return null
  }
}

function extractDistrict(address: string): string {
  const match = address.match(/(\S+[구군시])/)
  return match?.[1] ?? ''
}

export async function openNaverMap(place: {
  place_name: string
  road_address_name?: string
  address_name?: string
}) {
  const addr = place.road_address_name || place.address_name || ''
  const district = extractDistrict(addr)
  const fallbackSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(place.place_name + (district ? ` ${district}` : ''))}`

  // 1차: 상호명만으로 시도
  let url = await fetchNaverUrl(place.place_name)

  // 2차: 구 단위 추가
  if (!url && district) {
    url = await fetchNaverUrl(`${place.place_name} ${district}`)
  }

  window.open(url ?? fallbackSearchUrl, '_blank', 'noopener,noreferrer')
}
