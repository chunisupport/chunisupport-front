import assert from 'node:assert/strict'
import test from 'node:test'

import { matchesSearchQuery, normalizeForSearch } from './searchUtils'

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
