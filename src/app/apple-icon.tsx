import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366f1, #9333ea)',
        borderRadius: 40,
        color: 'white',
        fontSize: 110,
        fontWeight: 900,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      M
    </div>,
    { ...size },
  )
}
