import type { ScoreHistoryDifficulty } from '../api/songs'
import type { ScoreHistoryEntryDTO, VersionSummaryDTO } from '../types/api'

/** スコア履歴テーブルに表示するスコア行またはバージョン境界行。 */
export type ScoreHistoryTableRow =
  | { type: 'score'; entry: ScoreHistoryEntryDTO }
  | { type: 'version'; name: string }

const scoreHistoryDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
})

/**
 * クエリ文字列の難易度をスコア履歴対象のドメイン値へ変換する。
 *
 * @param value - URLから取得した難易度。
 * @returns 有効な大文字難易度。対象外の場合は null。
 */
export const parseScoreHistoryDifficulty = (
  value: string | string[] | undefined
): ScoreHistoryDifficulty | null => {
  const normalized = Array.isArray(value) ? value[0]?.toUpperCase() : value?.toUpperCase()
  if (normalized === 'EXPERT' || normalized === 'MASTER' || normalized === 'ULTIMA') {
    return normalized
  }
  return null
}

/**
 * スコア履歴の更新日時を年月日の短縮表示へ整形する。
 *
 * @param value - ISO 8601形式の更新日時。
 * @returns yy/MM/dd形式の日付。不正値の場合はハイフン。
 */
export const formatScoreHistoryDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : scoreHistoryDateTimeFormatter.format(date)
}

/**
 * スコア履歴グラフの横軸値を年月日の短縮表示へ整形する。
 *
 * @param value - UNIXエポックからの経過ミリ秒。
 * @returns yy/MM/dd形式の日付。不正値の場合はハイフン。
 */
export const formatScoreHistoryTimestamp = (value: number): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : scoreHistoryDateTimeFormatter.format(date)
}

/**
 * スコア履歴へ、バージョン稼働日を表す境界行を時系列順に差し込む。
 *
 * @param entries - 新しい順に並んだスコア履歴。
 * @param versions - バージョン名と稼働日の一覧。
 * @returns スコア行とバージョン境界行を含む表示行。
 */
export const buildScoreHistoryTableRows = (
  entries: readonly ScoreHistoryEntryDTO[],
  versions: readonly VersionSummaryDTO[]
): ScoreHistoryTableRow[] => {
  const versionBoundaries = versions
    .map((version) => ({
      name: version.name,
      timestamp: new Date(`${version.released_at.slice(0, 10)}T00:00:00+09:00`).getTime(),
    }))
    .filter((version) => !Number.isNaN(version.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)

  const rows: ScoreHistoryTableRow[] = []
  const emittedVersionBoundaries = new Set<number>()

  entries.forEach((entry, index) => {
    rows.push({ type: 'score', entry })

    const entryTimestamp = new Date(entry.updated_at).getTime()
    if (Number.isNaN(entryTimestamp)) return

    const nextTimestamp = entries
      .slice(index + 1)
      .map((nextEntry) => new Date(nextEntry.updated_at).getTime())
      .find((timestamp) => !Number.isNaN(timestamp))
    if (nextTimestamp === undefined) return

    versionBoundaries.forEach((version, versionIndex) => {
      if (
        !emittedVersionBoundaries.has(versionIndex) &&
        version.timestamp <= entryTimestamp &&
        version.timestamp > nextTimestamp
      ) {
        rows.push({ type: 'version', name: version.name })
        emittedVersionBoundaries.add(versionIndex)
      }
    })
  })

  const oldestEntryTimestamp = [...entries]
    .reverse()
    .map((entry) => new Date(entry.updated_at).getTime())
    .find((timestamp) => !Number.isNaN(timestamp))
  const oldestEntryVersionIndex = versionBoundaries.findIndex(
    (version, versionIndex) =>
      oldestEntryTimestamp !== undefined &&
      !emittedVersionBoundaries.has(versionIndex) &&
      version.timestamp <= oldestEntryTimestamp
  )
  const oldestEntryVersion = versionBoundaries[oldestEntryVersionIndex]
  if (oldestEntryVersion) {
    rows.push({ type: 'version', name: oldestEntryVersion.name })
  }

  return rows
}
