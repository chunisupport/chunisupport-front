import assert from 'node:assert/strict'
import test from 'node:test'
import { formatScoreHistoryDateTime, parseScoreHistoryDifficulty } from './scoreHistory'

test('難易度クエリを大文字のドメイン値へ変換する', () => {
  // Given / When / Then
  assert.equal(parseScoreHistoryDifficulty('master'), 'MASTER')
  assert.equal(parseScoreHistoryDifficulty('ULTIMA'), 'ULTIMA')
})

test('履歴対象外の難易度を拒否する', () => {
  // Given / When / Then
  assert.equal(parseScoreHistoryDifficulty('basic'), null)
  assert.equal(parseScoreHistoryDifficulty(undefined), null)
})

test('不正な更新日時をハイフンへ変換する', () => {
  // Given / When / Then
  assert.equal(formatScoreHistoryDateTime('not-a-date'), '-')
})
