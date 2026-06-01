import assert from 'node:assert/strict'
import test from 'node:test'

import { MAX_SCORE } from '../../../utils/scoreRank'
import {
  ALL_JUSTICE_CRITICAL_BADGE_CLASS,
  COMBO_LAMP_BADGE_BACKGROUND_CLASS,
  COMBO_LAMP_BADGE_TEXT_CLASS,
  getComboLampBadgeClass,
} from './recordStyleClasses'

test('AJCのコンボランプバッジは虹色クラスを返すこと', () => {
  // Given: ALL JUSTICEかつ理論値のレコード
  const lamp = 'ALL JUSTICE'
  const score = MAX_SCORE

  // When: コンボランプバッジの色クラスを取得する
  const result = getComboLampBadgeClass(lamp, score)

  // Then: AJC専用の虹色クラスが返る
  assert.equal(result, ALL_JUSTICE_CRITICAL_BADGE_CLASS)
})

test('通常AJのコンボランプバッジはAJ用トークン色を返すこと', () => {
  // Given: ALL JUSTICEだが理論値ではないレコード
  const lamp = 'ALL JUSTICE'
  const score = MAX_SCORE - 1

  // When: コンボランプバッジの色クラスを取得する
  const result = getComboLampBadgeClass(lamp, score)

  // Then: 通常AJ用の背景色と文字色が返る
  assert.equal(
    result,
    `${COMBO_LAMP_BADGE_BACKGROUND_CLASS[lamp]} ${COMBO_LAMP_BADGE_TEXT_CLASS[lamp]}`
  )
})

test('FCのコンボランプバッジはFC用トークン色を返すこと', () => {
  // Given: FULL COMBOのレコード
  const lamp = 'FULL COMBO'
  const score = MAX_SCORE

  // When: コンボランプバッジの色クラスを取得する
  const result = getComboLampBadgeClass(lamp, score)

  // Then: FC用の背景色と文字色が返る
  assert.equal(
    result,
    `${COMBO_LAMP_BADGE_BACKGROUND_CLASS[lamp]} ${COMBO_LAMP_BADGE_TEXT_CLASS[lamp]}`
  )
})
