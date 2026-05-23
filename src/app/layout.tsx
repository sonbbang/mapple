import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '맛플 — 오늘 점심, 운에 맡겨봐',
  description: '직장인을 위한 주변 맛집 룰렛',
  appleWebApp: {
    capable: true,
    title: '맛플',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-slate-950 min-h-screen`}>
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.matchMedia('(display-mode: standalone)').matches) {
            window.resizeTo(480, 960);
          }
        `}} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
