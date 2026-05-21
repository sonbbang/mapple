export async function openNaverMap(place: {
  place_name: string
  road_address_name?: string
  address_name?: string
}) {
  const addr = place.road_address_name || place.address_name || ''
  const q = addr ? `${place.place_name} ${addr}` : place.place_name
  const fallback = `https://map.naver.com/p/search/${encodeURIComponent(q)}`

  try {
    const res = await fetch(`/api/naver-place?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const { url } = (await res.json()) as { url: string | null }
      window.open(url ?? fallback, '_blank', 'noopener,noreferrer')
      return
    }
  } catch {}

  window.open(fallback, '_blank', 'noopener,noreferrer')
}
