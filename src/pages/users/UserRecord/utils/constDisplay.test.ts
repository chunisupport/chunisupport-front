import assert from 'node:assert/strict'
import { describe, test } from 'vitest'

import { getConstDisplay } from './constDisplay'

describe('getConstDisplay', () => {
  test('譜面定数が不明でない場合は通常表示を返す', () => {
    const result = getConstDisplay(13.7, false)

    assert.deepEqual(result, {
      text: '13.7',
      className: 'text-gray-900',
      isUnknown: false,
    })
  })

  test('譜面定数が不明の場合は赤字イタリック表示を返す', () => {
    const result = getConstDisplay(13.7, true)

    assert.deepEqual(result, {
      text: '13.7?',
      className: 'text-red-600 italic',
      isUnknown: true,
    })
  })
})
