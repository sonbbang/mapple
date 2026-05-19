import { describe, it, expect } from 'vitest'
import { toWalkingMinutes, shuffle } from './utils'

describe('toWalkingMinutes', () => {
  it('67m = 1분', () => expect(toWalkingMinutes(67)).toBe(1))
  it('68m = 2분 (올림)', () => expect(toWalkingMinutes(68)).toBe(2))
  it('500m = 8분', () => expect(toWalkingMinutes(500)).toBe(Math.ceil(500 / 67)))
  it('0m = 0분', () => expect(toWalkingMinutes(0)).toBe(0))
  it('134m = 2분 (정확히 나눠 떨어짐)', () => expect(toWalkingMinutes(134)).toBe(2))
})

describe('shuffle', () => {
  it('길이가 동일', () => expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5))
  it('원본 배열 불변', () => {
    const arr = [1, 2, 3]
    const orig = [...arr]
    shuffle(arr)
    expect(arr).toEqual(orig)
  })
  it('동일한 원소를 포함', () => {
    const arr = [1, 2, 3, 4, 5]
    expect([...shuffle(arr)].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })
})
