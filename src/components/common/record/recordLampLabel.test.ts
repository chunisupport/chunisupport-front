import assert from 'node:assert/strict'
import test from 'node:test'

import { MAX_SCORE } from '../../../utils/scoreRank.ts'
import { getDefaultRecordLampLabel } from './recordLampLabel.ts'

test('コンボランプバッジは理論値AJをAJCとして表示する', () => {
  // Given: ALL JUSTICEかつ理論値のレコード
  const lamp = 'ALL JUSTICE'
  const score = MAX_SCORE

  // When: 表示ラベルを取得する
  const result = getDefaultRecordLampLabel(lamp, score)

  // Then: AJCの短縮ラベルを返す
  assert.equal(result, 'AJC')
})

test('コンボランプバッジは理論値ではないAJをAJとして表示する', () => {
  // Given: ALL JUSTICEだが理論値ではないレコード
  const lamp = 'ALL JUSTICE'
  const score = MAX_SCORE - 1

  // When: 表示ラベルを取得する
  const result = getDefaultRecordLampLabel(lamp, score)

  // Then: 通常AJの短縮ラベルを返す
  assert.equal(result, 'AJ')
})

test('コンボランプバッジはFULL COMBOをFCとして表示する', () => {
  // Given: FULL COMBOのレコード
  const lamp = 'FULL COMBO'

  // When: 表示ラベルを取得する
  const result = getDefaultRecordLampLabel(lamp)

  // Then: FCの短縮ラベルを返す
  assert.equal(result, 'FC')
})
