import assert from 'node:assert/strict'
import test from 'node:test'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { PLAYER_NAME_MAX_LENGTH } from '../../constants/player'
import { RATING_SLOT_COUNT } from '../../constants/rating'
import {
  buildRatingImageDomPreviewSample,
  countRatingImagePreviewJackets,
  previewScalePercentToFactor,
  RATING_IMAGE_DOM_PREVIEW_LONG_TITLE,
  RATING_IMAGE_DOM_PREVIEW_PLAYER_NAME,
  resolveExactAdminUsername,
} from './adminRatingImageDomPreview'

test('サンプルは空き枠が残る件数でベスト枠と新曲枠を返すこと', () => {
  // Given: 画像化前DOM確認用サンプルを組み立てる前提。

  // When: サンプルデータを生成する。
  const sample = buildRatingImageDomPreviewSample()

  // Then: 規定枠より少ない件数になり、空き枠を確認できる。
  assert.equal(sample.rating.best.length, RATING_SLOT_COUNT.best - 2)
  assert.equal(sample.rating.new.length, RATING_SLOT_COUNT.new - 2)
})

test('サンプルは省略確認用の長い曲名と各難易度を含むこと', () => {
  // Given: 画像化前DOM確認用サンプルを組み立てる前提。

  // When: サンプルデータを生成する。
  const sample = buildRatingImageDomPreviewSample()

  // Then: 長い曲名と通常譜面の全難易度が含まれる。
  assert.equal(sample.rating.best[0]?.title, RATING_IMAGE_DOM_PREVIEW_LONG_TITLE)
  const difficulties = [...new Set(sample.rating.best.map((record) => record.difficulty))].sort()
  assert.deepEqual(difficulties, [...PLAYER_DATA_DIFFICULTIES].sort())
})

test('サンプルのプレイヤー名は全角8文字であること', () => {
  // Given: 画像化前DOM確認用サンプルを組み立てる前提。

  // When: サンプルデータを生成する。
  const sample = buildRatingImageDomPreviewSample()

  // Then: ドメインどおり全角のみ・最大文字数のプレイヤー名になる。
  assert.equal(sample.player.name, RATING_IMAGE_DOM_PREVIEW_PLAYER_NAME)
  assert.equal([...sample.player.name].length, PLAYER_NAME_MAX_LENGTH)
  assert.equal(/[ -~]/.test(sample.player.name), false)
})

test('サンプルは2枠目が空の称号と未知の譜面定数を含むこと', () => {
  // Given: 画像化前DOM確認用サンプルを組み立てる前提。

  // When: サンプルデータを生成する。
  const sample = buildRatingImageDomPreviewSample()

  // Then: 空き称号枠と未知定数の確認ができる。
  assert.deepEqual(
    sample.honors.map((honor) => honor.slot),
    [1, 3]
  )
  assert.equal(sample.rating.best[5]?.is_const_unknown, true)
})

test('表示倍率パーセントを縮小倍率へ変換すること', () => {
  // Given: 50%表示。

  // When: CSSのscale値へ変換する。
  const scale = previewScalePercentToFactor(50)

  // Then: 半分になる。
  assert.equal(scale, 0.5)
})

test('管理者一覧からユーザー名の完全一致を1件に絞ること', () => {
  // Given: 前方一致で複数件返り、1件だけユーザー名が一致する。
  const users = [
    { username: 'alice', player_name: 'アリス' },
    { username: 'alice2', player_name: 'アリス２' },
  ]

  // When: ユーザー名で完全一致を解決する。
  const username = resolveExactAdminUsername(users, 'alice')

  // Then: 一致したユーザー名を返す。
  assert.equal(username, 'alice')
})

test('管理者一覧からプレイヤー名の完全一致を1件に絞ること', () => {
  // Given: プレイヤー名が1件だけ完全一致する。
  const users = [
    { username: 'bob', player_name: 'ボブ名前です' },
    { username: 'carol', player_name: 'キャロル' },
  ]

  // When: プレイヤー名で完全一致を解決する。
  const username = resolveExactAdminUsername(users, 'ボブ名前です')

  // Then: そのユーザー名を返す。
  assert.equal(username, 'bob')
})

test('管理者一覧で完全一致が複数ならmultipleを返すこと', () => {
  // Given: 同じプレイヤー名を持つユーザーが2件ある。
  const users = [
    { username: 'user1', player_name: '同名八文字です' },
    { username: 'user2', player_name: '同名八文字です' },
  ]

  // When: プレイヤー名で完全一致を解決する。
  const username = resolveExactAdminUsername(users, '同名八文字です')

  // Then: 複数件として扱う。
  assert.equal(username, 'multiple')
})

test('管理者一覧に完全一致がなければnoneを返すこと', () => {
  // Given: 前方一致候補だけがある。
  const users = [{ username: 'alice', player_name: 'アリス' }]

  // When: 一致しない検索語で解決する。
  const username = resolveExactAdminUsername(users, 'ali')

  // Then: 該当なし。
  assert.equal(username, 'none')
})

test('Ver.2は埋め込み済み枠数だけジャケット待ちにすること', () => {
  // Given: サンプルのベスト枠・新曲枠。
  const sample = buildRatingImageDomPreviewSample()

  // When: Ver.2の待ち件数を数える。
  const count = countRatingImagePreviewJackets(sample.rating, 'v2', true)

  // Then: 空き枠を除いた件数になる。
  assert.equal(count, sample.rating.best.length + sample.rating.new.length)
})

test('Ver.1でジャケット非表示なら待ち件数は0であること', () => {
  // Given: サンプルのベスト枠・新曲枠。
  const sample = buildRatingImageDomPreviewSample()

  // When: Ver.1かつジャケット非表示の待ち件数を数える。
  const count = countRatingImagePreviewJackets(sample.rating, 'v1', false)

  // Then: 待たない。
  assert.equal(count, 0)
})
