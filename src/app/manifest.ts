import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '맛플 — 오늘 점심, 운에 맡겨봐',
    short_name: '맛플',
    description: '직장인을 위한 주변 맛집 룰렛',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    icons: [
      { src: '/api/pwa-icon?size=192', sizes: '192x192', type: 'image/png' },
      { src: '/api/pwa-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
