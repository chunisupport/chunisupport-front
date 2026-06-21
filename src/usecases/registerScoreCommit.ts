import type {
  PlayerDataDifficulty,
  PlayerDataNumberDiff,
  PlayerDataResult,
  PlayerDataStatisticsGroup,
} from '../types/api'

type RegisterScoreCommitDependencies = {
  commitPlayerData: (uploadToken: string) => Promise<PlayerDataResult>
  clearUserApiCache: () => Promise<void>
  ensureSongsLoaded: () => void
  ensureWorldsendSongsLoaded: () => void
}

type RegisterScoreCommitInput = {
  uploadToken: string
}

type RegisterScoreCommitResult = {
  result: PlayerDataResult
}

const PLAYER_DATA_DIFFICULTIES: readonly PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/** 数値差分のゼロ値を生成する。 */
const createEmptyDiff = (): PlayerDataNumberDiff => ({ before: 0, after: 0, delta: 0 })

/** 統計グループのゼロ値を生成する。 */
const createEmptyStatisticsGroup = (): PlayerDataStatisticsGroup => ({
  total_high_score: createEmptyDiff(),
  record_statistics: {
    aj: createEmptyDiff(),
    fc: createEmptyDiff(),
    clr: createEmptyDiff(),
    fch: createEmptyDiff(),
    max: createEmptyDiff(),
    sss_plus: createEmptyDiff(),
    sss: createEmptyDiff(),
    ss_plus: createEmptyDiff(),
    ss: createEmptyDiff(),
    s_plus: createEmptyDiff(),
    s: createEmptyDiff(),
  },
})

/**
 * APIから返された統計グループ内の欠落項目をゼロ値で補完する。
 *
 * @param group - APIから返された統計グループ。未返却の場合はundefined。
 * @returns すべての表示対象項目を保持する統計グループ。
 */
const normalizeStatisticsGroup = (
  group: PlayerDataStatisticsGroup | undefined
): PlayerDataStatisticsGroup => {
  const emptyGroup = createEmptyStatisticsGroup()

  return {
    total_high_score: group?.total_high_score ?? emptyGroup.total_high_score,
    record_statistics: {
      ...emptyGroup.record_statistics,
      ...group?.record_statistics,
    },
  }
}

/**
 * APIレスポンスの配列フィールドを画面で扱いやすい形へ正規化する。
 *
 * @param result - スコア登録APIから返却された登録結果。
 * @returns 差分配列、スキップ配列、固定難易度の統計が常に表示可能な登録結果。
 */
export const normalizePlayerDataResult = (result: PlayerDataResult): PlayerDataResult => {
  const byDifficulty = Object.fromEntries(
    PLAYER_DATA_DIFFICULTIES.map((difficulty) => [
      difficulty,
      normalizeStatisticsGroup(result.statistics?.by_difficulty?.[difficulty]),
    ])
  ) as Record<PlayerDataDifficulty, PlayerDataStatisticsGroup>

  return {
    ...result,
    statistics: {
      overall: normalizeStatisticsGroup(result.statistics?.overall),
      by_difficulty: byDifficulty,
    },
    changes: Array.isArray(result.changes) ? result.changes : [],
    skipped_records: Array.isArray(result.skipped_records) ? result.skipped_records : [],
  }
}

/**
 * スコア登録結果の差分に応じて、必要な楽曲マスタ読み込みを開始する。
 *
 * @param result - 正規化済みのスコア登録結果。
 * @param dependencies - 楽曲マスタ読み込み開始関数群。
 * @returns 戻り値はありません。
 */
export const requestChangedSongMasters = (
  result: PlayerDataResult,
  dependencies: Pick<
    RegisterScoreCommitDependencies,
    'ensureSongsLoaded' | 'ensureWorldsendSongsLoaded'
  >
): void => {
  if (result.changes.some((change) => change.record_type === 'standard')) {
    dependencies.ensureSongsLoaded()
  }
  if (result.changes.some((change) => change.record_type === 'worldsend')) {
    dependencies.ensureWorldsendSongsLoaded()
  }
}

/**
 * 一時保存済みスコアを確定し、結果表示に必要な副作用を開始する。
 *
 * @param input - アップロードトークン。
 * @param dependencies - API呼び出しと周辺データ取得を行う依存関数群。
 * @returns 正規化済み登録結果と、必要な場合のみユーザー名取得Promise。
 */
export const commitRegisterScore = async (
  input: RegisterScoreCommitInput,
  dependencies: RegisterScoreCommitDependencies
): Promise<RegisterScoreCommitResult> => {
  const result = normalizePlayerDataResult(await dependencies.commitPlayerData(input.uploadToken))

  try {
    await dependencies.clearUserApiCache()
  } catch {
    // キャッシュ削除失敗より、確定済みスコアの結果表示を優先する。
  }

  requestChangedSongMasters(result, dependencies)

  return {
    result,
  }
}
