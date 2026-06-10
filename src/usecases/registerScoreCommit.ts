import type { PlayerDataResult } from '../types/api'

type RegisterScoreCommitDependencies = {
  commitPlayerData: (uploadToken: string) => Promise<PlayerDataResult>
  fetchUsername: () => Promise<string>
  ensureSongsLoaded: () => void
  ensureWorldsendSongsLoaded: () => void
}

type RegisterScoreCommitInput = {
  uploadToken: string
  currentUsername: string | null
}

type RegisterScoreCommitResult = {
  result: PlayerDataResult
  usernamePromise: Promise<string | null> | null
}

/**
 * 統計レスポンス内のランプ件数が欠落した場合に使う空マップ。
 */
const EMPTY_LAMP_COUNTS = {
  clear: {},
  combo: {},
  full_chain: {},
} as const

/**
 * APIレスポンスの配列フィールドを画面で扱いやすい形へ正規化する。
 *
 * @param result - スコア登録APIから返却された登録結果。
 * @returns 差分配列、スキップ配列、統計内の件数マップが常に表示可能な登録結果。
 */
export const normalizePlayerDataResult = (result: PlayerDataResult): PlayerDataResult => {
  const lampCounts = result.statistics?.lamp_counts ?? EMPTY_LAMP_COUNTS

  return {
    ...result,
    statistics: {
      total_high_score: result.statistics?.total_high_score ?? 0,
      lamp_counts: {
        clear: lampCounts.clear ?? {},
        combo: lampCounts.combo ?? {},
        full_chain: lampCounts.full_chain ?? {},
      },
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
  if (result.changes.some((change) => change.record_type === 'full')) {
    dependencies.ensureSongsLoaded()
  }
  if (result.changes.some((change) => change.record_type === 'worldsend')) {
    dependencies.ensureWorldsendSongsLoaded()
  }
}

/**
 * 一時保存済みスコアを確定し、結果表示に必要な副作用を開始する。
 *
 * ユーザー名の補完取得は結果表示の必須条件ではないため、登録完了画面をブロックしないPromiseとして返す。
 *
 * @param input - アップロードトークンと現在保持しているユーザー名。
 * @param dependencies - API呼び出しと周辺データ取得を行う依存関数群。
 * @returns 正規化済み登録結果と、必要な場合のみユーザー名取得Promise。
 */
export const commitRegisterScore = async (
  input: RegisterScoreCommitInput,
  dependencies: RegisterScoreCommitDependencies
): Promise<RegisterScoreCommitResult> => {
  const result = normalizePlayerDataResult(await dependencies.commitPlayerData(input.uploadToken))

  requestChangedSongMasters(result, dependencies)

  return {
    result,
    usernamePromise: input.currentUsername ? null : dependencies.fetchUsername().catch(() => null),
  }
}
