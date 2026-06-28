import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { getConstDisplay, getRatingDisplay } from './constDisplay.ts'

describe('getConstDisplay', () => {
  test('譜面定数が不明でない場合は通常表示を返す', () => {
    const result = getConstDisplay(13.7, false)

    assert.deepEqual(result, {
      valueText: '13.7',
      markerText: null,
      className: 'text-text',
    })
  })

  test('譜面定数が不明の場合は赤字イタリック表示と上付きマーカーを返す', () => {
    const result = getConstDisplay(13.7, true)

    assert.deepEqual(result, {
      valueText: '13.7',
      markerText: '?',
      className: 'text-danger italic',
    })
  })
})

describe('getRatingDisplay', () => {
  test('未プレイは空文字を返す', () => {
    const result = getRatingDisplay(16.42, false, false)

    assert.deepEqual(result, {
      text: '',
      className: 'text-text',
    })
  })

  test('譜面定数が既知のときは通常色で表示する', () => {
    const result = getRatingDisplay(16.42, true, false)

    assert.deepEqual(result, {
      text: '16.42',
      className: 'text-text',
    })
  })

  test('譜面定数が不明のときは赤字イタリックで表示する', () => {
    const result = getRatingDisplay(16.42, true, true)

    assert.deepEqual(result, {
      text: '16.42',
      className: 'text-danger italic',
    })
  })
})
