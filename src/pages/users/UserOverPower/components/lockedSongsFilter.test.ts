import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesLockedSongsPlayStatus } from './lockedSongsFilter'

test('すべてのプレイ状況では未プレイとプレイ済みの両方を表示する', () => {
  assert.equal(matchesLockedSongsPlayStatus('all', true), true)
  assert.equal(matchesLockedSongsPlayStatus('all', false), true)
})

test('未プレイを選ぶと未プレイ候補だけを表示する', () => {
  assert.equal(matchesLockedSongsPlayStatus('unplayed', true), true)
  assert.equal(matchesLockedSongsPlayStatus('unplayed', false), false)
})

test('プレイ済みを選ぶとプレイ済み候補だけを表示する', () => {
  assert.equal(matchesLockedSongsPlayStatus('played', true), false)
  assert.equal(matchesLockedSongsPlayStatus('played', false), true)
})
