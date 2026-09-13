import assert from 'node:assert/strict'
import test from 'node:test'
import { WORLDSEND_SONG_CARD_EMPTY } from '../constants'
import {
  formatWorldsendSongCardLevelLine,
  formatWorldsendSongCardNotes,
  formatWorldsendSongCardStars,
} from './worldsendSongCardFormat'

test('星数を繰り返しの星へ整形すること', () => {
  // Given: 星5。
  const levelStar = 5

  // When: カード用の星表示へ変換する。
  const result = formatWorldsendSongCardStars(levelStar)

  // Then: 星が5つ並ぶ。
  assert.equal(result, '★★★★★')
})

test('星数が未設定ならハイフンを返すこと', () => {
  // Given: 星数なし。
  // When: カード用の星表示へ変換する。
  const result = formatWorldsendSongCardStars(null)

  // Then: プレースホルダになる。
  assert.equal(result, WORLDSEND_SONG_CARD_EMPTY)
})

test('属性と星数を1行に整形すること', () => {
  // Given: 属性「狂」と星5。
  const attribute = '狂'
  const levelStar = 5

  // When: カード下部上段の1行を作る。
  const result = formatWorldsendSongCardLevelLine(attribute, levelStar)

  // Then: 属性と繰り返し星が空白区切りになる。
  assert.equal(result, '狂 ★★★★★')
})

test('属性が未設定ならハイフンと星を組み合わせること', () => {
  // Given: 属性なしと星3。
  // When: カード下部上段の1行を作る。
  const result = formatWorldsendSongCardLevelLine(null, 3)

  // Then: 属性はプレースホルダ、星は3つ。
  assert.equal(result, `${WORLDSEND_SONG_CARD_EMPTY} ★★★`)
})

test('ノーツ数が未設定ならハイフンを返すこと', () => {
  // Given: ノーツ数なし。
  // When: カード用のノーツ表示へ変換する。
  const result = formatWorldsendSongCardNotes(null)

  // Then: プレースホルダになる。
  assert.equal(result, WORLDSEND_SONG_CARD_EMPTY)
})

test('ノーツ数を文字列化すること', () => {
  // Given: ノーツ数 2000。
  // When: カード用のノーツ表示へ変換する。
  const result = formatWorldsendSongCardNotes(2000)

  // Then: 数字の文字列になる。
  assert.equal(result, '2000')
})
