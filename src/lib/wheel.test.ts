import { describe, it, expect } from 'vitest'
import { getSlicePath, getLabelPosition, computeTargetRotation } from './wheel'

describe('getSlicePath', () => {
  it('M으로 시작하는 SVG path 반환', () => {
    const p = getSlicePath(0, 4, 95, 95, 88)
    expect(p).toMatch(/^M /)
  })
  it('슬라이스 인덱스마다 다른 path', () => {
    const p0 = getSlicePath(0, 4, 95, 95, 88)
    const p1 = getSlicePath(1, 4, 95, 95, 88)
    expect(p0).not.toBe(p1)
  })
  it('1개 슬라이스일 때 largeArcFlag = 1', () => {
    const p = getSlicePath(0, 1, 95, 95, 88)
    expect(p).toContain(' 1 1 ')
  })
})

describe('getLabelPosition', () => {
  it('중심에서 r*0.65 거리에 위치', () => {
    const pos = getLabelPosition(0, 4, 95, 95, 88)
    const dist = Math.sqrt((pos.x - 95) ** 2 + (pos.y - 95) ** 2)
    expect(dist).toBeCloseTo(88 * 0.65, 0)
  })
})

describe('computeTargetRotation', () => {
  it('현재 회전보다 최소 4바퀴 이상 증가', () => {
    const current = 0
    const target = computeTargetRotation(0, 8, current)
    expect(target - current).toBeGreaterThanOrEqual(4 * 360)
  })
  it('누적 회전에서도 4바퀴 이상 증가', () => {
    const current = 720
    const target = computeTargetRotation(3, 8, current)
    expect(target - current).toBeGreaterThanOrEqual(4 * 360)
  })
})
