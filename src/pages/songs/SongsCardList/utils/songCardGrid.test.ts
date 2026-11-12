import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SONG_CARD_COLUMN_GAP_PX,
  SONG_CARD_FHD_COLUMN_COUNT,
  SONG_CARD_FHD_CONTENT_WIDTH_PX,
  SONG_CARD_WIDTH_PX,
} from '../../components/songCardLayout.constants.ts'
import { SONG_CARD_DEFAULT_SORT_OPTION_ID, SONG_CARD_SORT_OPTIONS } from '../constants'
import {
  getSongCardContentWidth,
  getSongCardGridWidth,
  resolveSongCardColumnCount,
} from './songCardGrid'

test('コンテナ幅に入る固定幅カードの列数を求めること', () => {
  // Given: 1列ちょうど・2列に足りない・2列ちょうど・FHD全幅・幅0。
  const oneColumnWidth = SONG_CARD_WIDTH_PX
  const almostTwoColumnWidth = SONG_CARD_WIDTH_PX * 2 + SONG_CARD_COLUMN_GAP_PX - 1
  const twoColumnWidth = SONG_CARD_WIDTH_PX * 2 + SONG_CARD_COLUMN_GAP_PX

  // When: 列数を求める。
  // Then: カード幅+隙間で割り切れる数だけ並べ、FHD全幅では4列、最低1列を保つ。
  assert.equal(resolveSongCardColumnCount(oneColumnWidth), 1)
  assert.equal(resolveSongCardColumnCount(almostTwoColumnWidth), 1)
  assert.equal(resolveSongCardColumnCount(twoColumnWidth), 2)
  assert.equal(
    resolveSongCardColumnCount(SONG_CARD_FHD_CONTENT_WIDTH_PX),
    SONG_CARD_FHD_COLUMN_COUNT
  )
  assert.equal(resolveSongCardColumnCount(0), 1)
})

test('狭い幅では本文幅を利用可能幅までに収めること', () => {
  // Given: 360px の本文幅。
  const availableWidth = 360

  // When: 中央寄せ用の本文幅を求める。
  const contentWidth = getSongCardContentWidth(availableWidth)

  // Then: 1列になり、横スクロールしない幅になる。
  assert.equal(resolveSongCardColumnCount(availableWidth), 1)
  assert.equal(contentWidth, availableWidth)
})

test('FHD本文幅では4枚分のグリッド幅が本文幅と一致すること', () => {
  // Given: FHD本文幅で4列並べる。
  // When: グリッド幅を求める。
  const gridWidth = getSongCardGridWidth(SONG_CARD_FHD_COLUMN_COUNT)

  // Then: ページ本文幅と一致する。
  assert.equal(gridWidth, SONG_CARD_FHD_CONTENT_WIDTH_PX)
})

/** ソート選択肢のID・キー・表示指標の契約を検証する。 */
test('カードソート選択肢は標準と各難易度の定数・ノーツを含むこと', () => {
  // Given: カード一覧のソート選択肢。
  const options = SONG_CARD_SORT_OPTIONS

  // When: ラベル以外のソート設定を取り出す。
  const actual = options.map(({ id, sortKey, chartMetric }) => ({ id, sortKey, chartMetric }))

  // Then: 標準は解除、各難易度は定数とノーツを正しく切り替える。
  assert.equal(SONG_CARD_DEFAULT_SORT_OPTION_ID, 'default')
  assert.deepEqual(actual, [
    { id: 'default', sortKey: null, chartMetric: 'const' },
    { id: 'title', sortKey: 'title', chartMetric: 'const' },
    { id: 'artist', sortKey: 'artist', chartMetric: 'const' },
    { id: 'genre', sortKey: 'genre', chartMetric: 'const' },
    { id: 'release', sortKey: 'release', chartMetric: 'const' },
    { id: 'bpm', sortKey: 'bpm', chartMetric: 'const' },
    { id: 'basic-const', sortKey: 'basic', chartMetric: 'const' },
    { id: 'basic-notes', sortKey: 'basic', chartMetric: 'notes' },
    { id: 'advanced-const', sortKey: 'advanced', chartMetric: 'const' },
    { id: 'advanced-notes', sortKey: 'advanced', chartMetric: 'notes' },
    { id: 'expert-const', sortKey: 'expert', chartMetric: 'const' },
    { id: 'expert-notes', sortKey: 'expert', chartMetric: 'notes' },
    { id: 'master-const', sortKey: 'master', chartMetric: 'const' },
    { id: 'master-notes', sortKey: 'master', chartMetric: 'notes' },
    { id: 'ultima-const', sortKey: 'ultima', chartMetric: 'const' },
    { id: 'ultima-notes', sortKey: 'ultima', chartMetric: 'notes' },
  ])
})
