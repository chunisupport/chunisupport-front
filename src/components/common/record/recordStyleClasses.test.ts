import assert from 'node:assert/strict'
import test from 'node:test'

import { MAX_SCORE } from '../../../utils/scoreRank'
import {
  ALL_JUSTICE_CRITICAL_BADGE_CLASS,
  ALL_JUSTICE_CRITICAL_BG_CLASS,
  COMBO_LAMP_BADGE_BACKGROUND_CLASS,
  COMBO_LAMP_BADGE_TEXT_CLASS,
  COMBO_LAMP_BAR_CLASS,
  COMBO_LAMP_SCORE_ACCENT_CLASS,
  getComboLampBadgeClass,
  HARD_LAMP_BAR_CLASS,
  SCORE_RANK_BAR_CLASS,
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

test('画像用スコアアクセントはFCだけを粗い破線で表示すること', () => {
  // Given: FCとAJの画像用スコアアクセント
  const expectedFullComboClass =
    'bg-[repeating-linear-gradient(90deg,var(--color-lamp-full-combo-bg)_0_6px,transparent_6px_10px)]'
  const expectedAllJusticeClass = 'bg-gradient-to-b from-transparent to-lamp-all-justice-bg'

  // When & Then: FCだけが固定周期の破線になり、AJは連続したグラデーションを維持する
  assert.equal(COMBO_LAMP_SCORE_ACCENT_CLASS['FULL COMBO'], expectedFullComboClass)
  assert.equal(COMBO_LAMP_SCORE_ACCENT_CLASS['ALL JUSTICE'], expectedAllJusticeClass)
})

test('COMBOのなしとHARDのFAILEDはRANKのOTHERS色を返すこと', () => {
  // Given: RANKのOTHERSで使う低ランク向け色クラス
  const othersClass = SCORE_RANK_BAR_CLASS.OTHERS

  // When: COMBOのなしとHARDのFAILEDの色クラスを取得する
  const result = [COMBO_LAMP_BAR_CLASS.なし, HARD_LAMP_BAR_CLASS.FAILED]

  // Then: どちらもOTHERS色に統一される
  assert.deepEqual(result, [othersClass, othersClass])
})

test('フィルター統計のMAXはAJCと同じ虹色グラデーションを返すこと', () => {
  // Given: AJC表示で共通利用する虹色グラデーションクラス
  const expectedClass = ALL_JUSTICE_CRITICAL_BG_CLASS

  // When: RANKのMAX色クラスを取得する
  const result = SCORE_RANK_BAR_CLASS.MAX

  // Then: AJCと同じ虹色グラデーションが返る
  assert.equal(result, expectedClass)
})

test('フィルター統計の未プレイは背景と同じ色クラスを返すこと', () => {
  // Given: フィルター統計に表示する未プレイカテゴリ
  const expectedClass = 'bg-surface-hover'

  // When: 各分布の未プレイ色クラスを取得する
  const result = [
    SCORE_RANK_BAR_CLASS.未プレイ,
    COMBO_LAMP_BAR_CLASS.未プレイ,
    HARD_LAMP_BAR_CLASS.未プレイ,
  ]

  // Then: すべてバー背景と同じ色クラスで統一される
  assert.deepEqual(result, [expectedClass, expectedClass, expectedClass])
})
