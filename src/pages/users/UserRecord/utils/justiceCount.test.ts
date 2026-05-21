import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calcJusticeCountForAj } from './justiceCount'

describe('calcJusticeCountForAj', () => {
  it('AJかつ有効なノーツ数ならJUSTICE数を計算できる', () => {
    assert.equal(
      calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1009990, notes: 1000 }),
      1
    )
    assert.equal(
      calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1000000, notes: 1000 }),
      1000
    )
  })

  it('AJではない場合は空文字を返す', () => {
    assert.equal(
      calcJusticeCountForAj({ comboLamp: 'FULL COMBO', score: 1009990, notes: 1000 }),
      ''
    )
    assert.equal(calcJusticeCountForAj({ comboLamp: null, score: 1009990, notes: 1000 }), '')
  })

  it('AJかつ1010000点の場合はノーツ不明でもJ数0を返す', () => {
    assert.equal(
      calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1010000, notes: null }),
      0
    )
    assert.equal(calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1010000, notes: 0 }), 0)
  })

  it('ノーツ数が無効な場合はハイフンを返す', () => {
    assert.equal(
      calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1009990, notes: null }),
      '-'
    )
    assert.equal(calcJusticeCountForAj({ comboLamp: 'ALL JUSTICE', score: 1009990, notes: 0 }), '-')
  })
})
