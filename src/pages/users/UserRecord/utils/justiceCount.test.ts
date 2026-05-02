import { describe, expect, it } from 'vitest'
import { calcJusticeCountForAj } from './justiceCount'

describe('calcJusticeCountForAj', () => {
  it('AJかつ有効なノーツ数ならJUSTICE数を計算できる', () => {
    expect(calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1009990, notes: 1000 })).toBe(1)
    expect(calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1000000, notes: 1000 })).toBe(
      1000
    )
  })

  it('AJではない場合は空文字を返す', () => {
    expect(calcJusticeCountForAj({ comboLamp: 'FULL COMBO', score: 1009990, notes: 1000 })).toBe('')
    expect(calcJusticeCountForAj({ comboLamp: null, score: 1009990, notes: 1000 })).toBe('')
  })

  it('ノーツ数が無効な場合はハイフンを返す', () => {
    expect(calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1009990, notes: null })).toBe(
      '-'
    )
    expect(calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1009990, notes: 0 })).toBe('-')
  })
})
