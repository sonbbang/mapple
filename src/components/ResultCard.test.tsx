import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultCard from './ResultCard'
import type { KakaoPlace } from '@/lib/kakao'

const mockPlace: KakaoPlace = {
  id: '1',
  place_name: '명동교자',
  category_name: '음식점 > 한식 > 칼국수,만두',
  address_name: '서울 중구 명동10길 29',
  road_address_name: '서울 중구 명동10길 29',
  distance: '536',
  place_url: 'https://place.map.kakao.com/12345',
}

describe('ResultCard', () => {
  it('식당 이름 표시', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText('명동교자')).toBeInTheDocument()
  })

  it('주소 표시', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText('서울 중구 명동10길 29')).toBeInTheDocument()
  })

  it('도보 시간 표시 (536m → 8분)', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText(/도보 8분/)).toBeInTheDocument()
  })

  it('카테고리 마지막 세그먼트 표시', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    expect(screen.getByText('칼국수,만두')).toBeInTheDocument()
  })

  it('카카오맵 링크가 올바른 href', () => {
    render(<ResultCard restaurant={mockPlace} onReroll={vi.fn()} />)
    const link = screen.getByRole('link', { name: /카카오맵/ })
    expect(link).toHaveAttribute('href', 'https://place.map.kakao.com/12345')
  })

  it('다시 돌리기 클릭 시 onReroll 호출', () => {
    const onReroll = vi.fn()
    render(<ResultCard restaurant={mockPlace} onReroll={onReroll} />)
    fireEvent.click(screen.getByText(/다시 돌리기/))
    expect(onReroll).toHaveBeenCalledOnce()
  })
})
