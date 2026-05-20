import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import SpinWheel, { type SpinWheelRef } from './SpinWheel'
import type { KakaoPlace } from '@/lib/kakao'

const makePlaces = (names: string[]): KakaoPlace[] =>
  names.map((name, i) => ({
    id: String(i),
    place_name: name,
    category_name: '음식점 > 한식',
    address_name: '서울',
    road_address_name: '서울',
    distance: '100',
    place_url: `https://place.map.kakao.com/${i}`,
  }))

describe('SpinWheel', () => {
  it('식당 수만큼 SVG path 렌더링', () => {
    const { container } = render(
      <SpinWheel ref={createRef()} restaurants={makePlaces(['A', 'B', 'C', 'D'])} onSpinEnd={vi.fn()} />
    )
    const paths = container.querySelectorAll('path[fill]')
    expect(paths.length).toBeGreaterThanOrEqual(4)
  })

  it('식당 이름 텍스트 렌더링', () => {
    render(
      <SpinWheel ref={createRef()} restaurants={makePlaces(['맛집A', '맛집B'])} onSpinEnd={vi.fn()} />
    )
    expect(screen.getByText('맛집A')).toBeInTheDocument()
  })

  it('5자 이상 이름은 두 줄로 분리', () => {
    render(
      <SpinWheel ref={createRef()} restaurants={makePlaces(['일이삼사오육칠'])} onSpinEnd={vi.fn()} />
    )
    expect(screen.getByText('일이삼사')).toBeInTheDocument()
    expect(screen.getByText('오육칠')).toBeInTheDocument()
  })
})
