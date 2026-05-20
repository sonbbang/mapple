'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { KakaoPlace } from '@/lib/kakao'
import { getSlicePath, getLabelPosition, computeTargetRotation } from '@/lib/wheel'

const SLICE_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#4f46e5', '#6d28d9', '#818cf8', '#5b21b6',
]
const CX = 95
const CY = 95
const R = 88
function splitLabel(name: string): { line1: string; line2: string | null } {
  if (name.length <= 4) return { line1: name, line2: null }
  const raw = name.slice(4, 8)
  return { line1: name.slice(0, 4), line2: name.length > 8 ? raw + '…' : raw }
}

export interface SpinWheelRef {
  spin: (winnerIndex: number) => void
}

interface Props {
  restaurants: KakaoPlace[]
  onSpinEnd: (winner: KakaoPlace) => void
}

const SpinWheel = forwardRef<SpinWheelRef, Props>(function SpinWheel(
  { restaurants, onSpinEnd },
  ref
) {
  const rotationRef = useRef(0)
  const [displayRotation, setDisplayRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const winnerRef = useRef<KakaoPlace | null>(null)

  useImperativeHandle(ref, () => ({
    spin(winnerIndex: number) {
      if (isAnimating) return
      const target = computeTargetRotation(winnerIndex, restaurants.length, rotationRef.current)
      rotationRef.current = target
      winnerRef.current = restaurants[winnerIndex]
      setIsAnimating(true)
      setDisplayRotation(target)
    },
  }))

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* 상단 화살표 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 -translate-y-1">
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-400" />
      </div>

      <svg
        width="280"
        height="280"
        viewBox="0 0 190 190"
        style={{
          transform: `rotate(${displayRotation}deg)`,
          transition: isAnimating
            ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            : 'none',
        }}
        onTransitionEnd={() => {
          setIsAnimating(false)
          if (winnerRef.current) onSpinEnd(winnerRef.current)
        }}
      >
        <circle cx={CX} cy={CY} r={R + 2} fill="#1e293b" />
        {restaurants.map((restaurant, i) => {
          const pos = getLabelPosition(i, restaurants.length, CX, CY, R)
          const { line1, line2 } = splitLabel(restaurant.place_name)
          return (
            <g
              key={restaurant.id}
              onClick={() => !isAnimating && restaurant.place_url && window.open(restaurant.place_url, '_blank')}
              style={{ cursor: isAnimating ? 'default' : 'pointer' }}
            >
              <path
                d={getSlicePath(i, restaurants.length, CX, CY, R)}
                fill={SLICE_COLORS[i % SLICE_COLORS.length]}
              />
              <text
                x={pos.x}
                y={pos.y}
                fill="white"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
              >
                {line2 ? (
                  <>
                    <tspan x={pos.x} dy="-0.65em">{line1}</tspan>
                    <tspan x={pos.x} dy="1.3em">{line2}</tspan>
                  </>
                ) : line1}
              </text>
            </g>
          )
        })}
        {/* 중앙 원 */}
        <circle cx={CX} cy={CY} r={16} fill="#0f172a" stroke="#6366f1" strokeWidth={2} />
        <text
          x={CX}
          y={CY}
          fill="#6366f1"
          fontSize={9}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          GO
        </text>
      </svg>
    </div>
  )
})

export default SpinWheel
