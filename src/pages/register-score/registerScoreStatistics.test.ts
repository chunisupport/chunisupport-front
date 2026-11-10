import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  PlayerDataNumberDiff,
  PlayerDataStatistics,
  PlayerDataStatisticsGroup,
} from '../../types/api'
import {
  createDefaultRegisterScoreStatisticRowVisibility,
  createDefaultRegisterScoreTotalHighScoreRowVisibility,
  hasRegisterScoreStatisticRowUpdate,
  toRegisterScoreStatisticRows,
} from './registerScoreStatistics'

/** 差分がない数値集計 */
const ZERO_DIFF: PlayerDataNumberDiff = { before: 10, after: 10, delta: 0 }

/**
 * 指定した集計項目だけに差分を持つ統計グループを生成する。
 *
 * @param overrides - TOTAL HIGH SCOREとレコード統計へ上書きする差分値。
 * @returns テスト用の統計グループ。
 */
const createStatisticsGroup = (
  overrides: {
    totalHighScore?: PlayerDataNumberDiff
    recordStatistics?: Partial<PlayerDataStatisticsGroup['record_statistics']>
  } = {}
): PlayerDataStatisticsGroup => ({
  total_high_score: overrides.totalHighScore ?? ZERO_DIFF,
  record_statistics: {
    aj: ZERO_DIFF,
    fc: ZERO_DIFF,
    clr: ZERO_DIFF,
    fch: ZERO_DIFF,
    max: ZERO_DIFF,
    sss_plus: ZERO_DIFF,
    sss: ZERO_DIFF,
    ss_plus: ZERO_DIFF,
    ss: ZERO_DIFF,
    s_plus: ZERO_DIFF,
    s: ZERO_DIFF,
    ...overrides.recordStatistics,
  },
})

/**
 * 難易度別の差分を指定したテスト用統計を生成する。
 *
 * @param groups - 全体および難易度別に上書きする統計グループ。
 * @returns テスト用のプレイヤー統計。
 */
const createStatistics = (
  groups: Partial<{
    overall: PlayerDataStatisticsGroup
    basic: PlayerDataStatisticsGroup
    advanced: PlayerDataStatisticsGroup
    expert: PlayerDataStatisticsGroup
    master: PlayerDataStatisticsGroup
    ultima: PlayerDataStatisticsGroup
    worldsend: PlayerDataStatisticsGroup
  }> = {}
): PlayerDataStatistics => ({
  overall: groups.overall ?? createStatisticsGroup(),
  by_difficulty: {
    BASIC: groups.basic ?? createStatisticsGroup(),
    ADVANCED: groups.advanced ?? createStatisticsGroup(),
    EXPERT: groups.expert ?? createStatisticsGroup(),
    MASTER: groups.master ?? createStatisticsGroup(),
    ULTIMA: groups.ultima ?? createStatisticsGroup(),
    WE: groups.worldsend ?? createStatisticsGroup(),
  },
})

test('RECORD STATISTICSは差分がある行だけをデフォルト表示にすること', () => {
  // Given: ALL、BASIC、MASTERの表示対象列に差分がある。
  const positiveDiff: PlayerDataNumberDiff = { before: 10, after: 11, delta: 1 }
  const statistics = createStatistics({
    overall: createStatisticsGroup({ recordStatistics: { aj: positiveDiff } }),
    basic: createStatisticsGroup({ recordStatistics: { fc: positiveDiff } }),
    master: createStatisticsGroup({ recordStatistics: { sss_plus: positiveDiff } }),
  })

  // When: 行ごとの初期表示状態を生成する。
  const result = createDefaultRegisterScoreStatisticRowVisibility(statistics)

  // Then: 差分がある3行だけが表示対象になる。
  assert.deepEqual(result, {
    ALL: true,
    BASIC: true,
    ADVANCED: false,
    EXPERT: false,
    MASTER: true,
    ULTIMA: false,
    WE: false,
  })
})

test('表に表示しない統計項目だけの差分は行の更新として扱わないこと', () => {
  // Given: BASICのCLRだけに差分がある。
  const positiveDiff: PlayerDataNumberDiff = { before: 10, after: 11, delta: 1 }
  const statistics = createStatistics({
    basic: createStatisticsGroup({ recordStatistics: { clr: positiveDiff } }),
  })
  const basicRow = toRegisterScoreStatisticRows(statistics).find((row) => row.key === 'BASIC')

  // When: BASIC行に表示対象の更新があるか判定する。
  const result = basicRow ? hasRegisterScoreStatisticRowUpdate(basicRow) : true

  // Then: 表示されないCLRの差分だけでは更新行にならない。
  assert.equal(result, false)
})

test('TOTAL HIGH SCOREは差分がある行だけをデフォルト表示にすること', () => {
  // Given: ALL、ADVANCED、ULTIMA、WORLD'S ENDのTOTAL HIGH SCOREに差分がある。
  const positiveDiff: PlayerDataNumberDiff = { before: 10, after: 11, delta: 1 }
  const statistics = createStatistics({
    overall: createStatisticsGroup({ totalHighScore: positiveDiff }),
    advanced: createStatisticsGroup({ totalHighScore: positiveDiff }),
    ultima: createStatisticsGroup({ totalHighScore: positiveDiff }),
    worldsend: createStatisticsGroup({ totalHighScore: positiveDiff }),
  })

  // When: 行ごとの初期表示状態を生成する。
  const result = createDefaultRegisterScoreTotalHighScoreRowVisibility(statistics)

  // Then: 差分がある3行だけが表示対象になる。
  assert.deepEqual(result, {
    ALL: true,
    BASIC: false,
    ADVANCED: true,
    EXPERT: false,
    MASTER: false,
    ULTIMA: true,
    WE: true,
  })
})
