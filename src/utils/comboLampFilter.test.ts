import assert from 'node:assert/strict'
import test from 'node:test'
import { getComboLampFilterValue, migrateLegacyComboLampFilters } from './comboLampFilter.ts'
import { MAX_SCORE } from './scoreRank.ts'

test('理論値のALL JUSTICEをALL JUSTICE CRITICALとしてフィルターできる', () => {
  // Given: 理論値の ALL JUSTICE レコード。
  const comboLamp = 'ALL JUSTICE'

  // When: フィルター用のランプ値に変換する。
  const result = getComboLampFilterValue(comboLamp, MAX_SCORE)

  // Then: AJC として区別される。
  assert.equal(result, 'ALL JUSTICE CRITICAL')
})

test('理論値ではないALL JUSTICEは従来どおりALL JUSTICEとしてフィルターできる', () => {
  // Given: 理論値ではない ALL JUSTICE レコード。
  const comboLamp = 'ALL JUSTICE'

  // When: フィルター用のランプ値に変換する。
  const result = getComboLampFilterValue(comboLamp, MAX_SCORE - 1)

  // Then: AJ のまま扱われる。
  assert.equal(result, 'ALL JUSTICE')
})

test('旧形式のALL JUSTICE選択をALL JUSTICE CRITICALを含む条件へ移行できる', () => {
  // Given: AJC の選択肢がなかった旧形式の ALL JUSTICE 条件。
  const comboLamps = ['ALL JUSTICE', 'FULL COMBO', null] as const

  // When: 保存済み条件を移行する。
  const result = migrateLegacyComboLampFilters(comboLamps)

  // Then: ALL JUSTICE CRITICAL も選択済みになる。
  assert.deepEqual(result, ['ALL JUSTICE', 'FULL COMBO', null, 'ALL JUSTICE CRITICAL'])
})
