import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTheoreticalOverPowerTargetDifficultyBySongId,
  isTheoreticalOverPowerTargetDifficulty,
} from './theoreticalOverPowerTarget'

test('楽曲マスタの理論値OVER POWER対象難易度だけを一致と判定する', () => {
  // Given: ULTIMAが理論値OVER POWER対象の楽曲。
  const targetDifficulty = 'ULTIMA'

  // When: MASTERとULTIMAをそれぞれ判定する。
  const masterMatched = isTheoreticalOverPowerTargetDifficulty(targetDifficulty, 'MASTER')
  const ultimaMatched = isTheoreticalOverPowerTargetDifficulty(targetDifficulty, 'ULTIMA')

  // Then: ULTIMAだけが一致する。
  assert.equal(masterMatched, false)
  assert.equal(ultimaMatched, true)
})

test('理論値対象難易度を解決できない場合は一致しない', () => {
  // Given & When & Then: 未解決と未設定の対象難易度はどちらも対象外になる。
  assert.equal(isTheoreticalOverPowerTargetDifficulty(undefined, 'MASTER'), false)
  assert.equal(isTheoreticalOverPowerTargetDifficulty(null, 'MASTER'), false)
})

test('曲IDごとの理論値OP対象難易度は対象が設定された曲だけを保持する', () => {
  // Given: MASTER対象、ULTIMA対象、対象難易度なしの楽曲一覧。
  const songs = [
    { id: 'master-song', op_target_difficulty: 'MASTER' as const },
    { id: 'ultima-song', op_target_difficulty: 'ULTIMA' as const },
    { id: 'without-target', op_target_difficulty: null },
  ]

  // When: 曲IDごとの対象難易度Mapを構築する。
  const result = buildTheoreticalOverPowerTargetDifficultyBySongId(songs)

  // Then: 対象難易度が設定された2曲だけを保持する。
  assert.deepEqual(
    [...result.entries()],
    [
      ['master-song', 'MASTER'],
      ['ultima-song', 'ULTIMA'],
    ]
  )
})
