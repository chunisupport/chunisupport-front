import assert from 'node:assert/strict'
import test from 'node:test'

import { matchesSearchQuery, normalizeForSearch, normalizeQuery } from './searchUtils'

test('normalizeForSearch はUnicode正規化して記号・空白を除去する', () => {
  assert.equal(normalizeForSearch(' ＡＢＣ－１２３ '), 'abc123')
})

test('normalizeForSearch はカタカナとひらがなを同一視する', () => {
  assert.equal(normalizeForSearch('カタカナ'), normalizeForSearch('かたかな'))
})

test('matchesSearchQuery は曲名を検索できる', () => {
  assert.equal(matchesSearchQuery('幽玄ノ乱', 'cosMo@暴走P', '幽玄'), true)
})

test('matchesSearchQuery はアーティスト名を検索できる', () => {
  assert.equal(matchesSearchQuery('Aleph-0', 'LeaF', 'leaf'), true)
})

test('matchesSearchQuery は正規化後に部分一致しない場合 false を返す', () => {
  assert.equal(matchesSearchQuery('テリトリーバトル', '東雲めぐ', 'abc'), false)
})

test('matchesSearchQuery は reading の濁点・半濁点を無視して検索できる', () => {
  assert.equal(matchesSearchQuery('テスト', 'アーティスト', 'カッツ', 'ガッツ'), true)
})

test('matchesSearchQuery は reading の長音記号をウとして扱う', () => {
  assert.equal(matchesSearchQuery('テスト', 'アーティスト', 'コーヒー', 'コウヒウ'), true)
})

test('matchesSearchQuery は記号を除去した reading でも検索できる', () => {
  assert.equal(matchesSearchQuery('ダミー', 'A', 'DONT', 'D!O?N-T'), true)
})

test('matchesSearchQuery は reading 検索でクエリも reading 正規化して一致判定できる', () => {
  assert.equal(matchesSearchQuery('曲A', 'Artist', 'ガッツ', 'カッツ'), true)
})

test('matchesSearchQuery は半角カナでも濁点を無視して reading 検索できる', () => {
  assert.equal(matchesSearchQuery('曲A', 'Artist', 'ｶﾞｯﾂ', 'カッツ'), true)
})

test('matchesSearchQuery は半角長音記号を含む reading でも検索できる', () => {
  assert.equal(matchesSearchQuery('曲A', 'Artist', 'コｰヒｰ', 'コーヒー'), true)
})

test('matchesSearchQuery は小書きのカナを含むクエリでも大きいカナの reading を検索できる', () => {
  // Given: 大きいカナで登録された読みと、小書きのカナを含むクエリ
  const reading = 'シヤツフル'

  // When & Then: ひらがな・カタカナ・半角カナのどれでも一致する
  assert.equal(matchesSearchQuery('曲A', 'Artist', 'しゃっふる', reading), true)
  assert.equal(matchesSearchQuery('曲A', 'Artist', 'シャッフル', reading), true)
  assert.equal(matchesSearchQuery('曲A', 'Artist', 'ｼｬｯﾌﾙ', reading), true)
})

test('matchesSearchQuery は小書きのカナを変換しても曲名検索の挙動を変えない', () => {
  // Given: 小書きのカナを含む曲名
  // When & Then: 大きいカナのクエリでは曲名に一致しない
  assert.equal(normalizeForSearch('シャッフル'), 'しゃっふる')
  assert.equal(matchesSearchQuery('シャッフル', 'Artist', 'しやつふる', 'ホゲ'), false)
})

test('matchesSearchQuery は読みが空欄なら曲名に読み検索の正規化を適用する', () => {
  // Given: 読みが未設定・空文字・空白のみの楽曲。
  for (const reading of [undefined, null, '', ' ', '\t\n　']) {
    // When / Then: 濁点、小書きカナ、長音を読みとして正規化し、関係ない検索語は除外する。
    assert.equal(matchesSearchQuery('ガッツ・コーヒー', 'Artist', 'カツツコウヒウ', reading), true)
    assert.equal(matchesSearchQuery('ガッツ・コーヒー', 'Artist', 'ソラ', reading), false)
  }
})

test('normalizeQuery は確定済みの末尾全角英字を削除しない', () => {
  // Given: 確定済みで末尾が全角英字の検索語
  // When
  const { normalizedQuery, normalizedReadingQuery } = normalizeQuery('TESTＡ')
  const singleLetter = normalizeQuery('Ａ')

  // Then: NFKC で半角化されるが、末尾の1文字は残る
  assert.equal(normalizedQuery, 'testa')
  assert.equal(normalizedReadingQuery, 'testa')
  assert.equal(singleLetter.normalizedQuery, 'a')
  assert.equal(singleLetter.normalizedReadingQuery, 'a')
})

test('matchesSearchQuery は末尾が全角英字の曲名を検索できる', () => {
  // Given: 曲名末尾が全角英字
  // When & Then: 全角・半角の検索語で一致し、末尾を含む検索語は短い曲名に一致しない
  assert.equal(matchesSearchQuery('TESTＡ', 'dummy', 'TESTＡ'), true)
  assert.equal(matchesSearchQuery('TESTＡ', 'dummy', 'testa'), true)
  assert.equal(matchesSearchQuery('TEST', 'dummy', 'TESTＡ'), false)
})

test('matchesSearchQuery は末尾が全角英字のアーティスト名を検索できる', () => {
  // Given: アーティスト名末尾が全角英字
  // When & Then: 全角・半角の検索語で一致し、末尾を含む検索語は短い名前に一致しない
  assert.equal(matchesSearchQuery('曲名', 'ArtistＡ', 'ArtistＡ'), true)
  assert.equal(matchesSearchQuery('曲名', 'ArtistＡ', 'artista'), true)
  assert.equal(matchesSearchQuery('曲名', 'Artist', 'ArtistＡ'), false)
})

test('matchesSearchQuery は全角英字1文字の検索語で全件一致しない', () => {
  // Given: 確定済みの全角英字1文字
  // When & Then: 空クエリ扱いにならず、該当しない曲は除外する
  assert.equal(matchesSearchQuery('無関係', 'dummy', 'Ａ'), false)
  assert.equal(matchesSearchQuery('Ａ', 'dummy', 'Ａ'), true)
})
