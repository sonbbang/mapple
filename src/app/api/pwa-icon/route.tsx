import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET(req: NextRequest) {
  const px = Math.min(512, Math.max(16, Number(req.nextUrl.searchParams.get('size') ?? 192)))
  const radius = Math.round(px * 0.22)
  const fontSize = Math.round(px * 0.55)

  return new ImageResponse(
    <div
      style={{
        width: px,
        height: px,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366f1, #9333ea)',
        borderRadius: radius,
        color: 'white',
        fontSize,
        fontWeight: 900,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      M
    </div>,
    { width: px, height: px },
  )
}
