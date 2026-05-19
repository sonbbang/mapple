import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterPanel from './FilterPanel'

describe('FilterPanel', () => {
  it('거리 옵션 3개 렌더링', () => {
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={vi.fn()} onCategoryChange={vi.fn()} />)
    expect(screen.getByText('500m')).toBeInTheDocument()
    expect(screen.getByText('1km')).toBeInTheDocument()
    expect(screen.getByText('2km')).toBeInTheDocument()
  })

  it('선택된 거리 버튼에 bg-indigo-500 클래스', () => {
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={vi.fn()} onCategoryChange={vi.fn()} />)
    expect(screen.getByText('1km')).toHaveClass('bg-indigo-500')
    expect(screen.getByText('500m')).not.toHaveClass('bg-indigo-500')
  })

  it('거리 클릭 시 onRadiusChange 호출', () => {
    const onChange = vi.fn()
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={onChange} onCategoryChange={vi.fn()} />)
    fireEvent.click(screen.getByText('500m'))
    expect(onChange).toHaveBeenCalledWith(500)
  })

  it('카테고리 클릭 시 onCategoryChange 호출', () => {
    const onChange = vi.fn()
    render(<FilterPanel radius={1000} category="전체" onRadiusChange={vi.fn()} onCategoryChange={onChange} />)
    fireEvent.click(screen.getByText('🍚 한식'))
    expect(onChange).toHaveBeenCalledWith('한식')
  })

  it('선택된 카테고리 버튼에 bg-indigo-500 클래스', () => {
    render(<FilterPanel radius={1000} category="한식" onRadiusChange={vi.fn()} onCategoryChange={vi.fn()} />)
    expect(screen.getByText('🍚 한식')).toHaveClass('bg-indigo-500')
  })
})
