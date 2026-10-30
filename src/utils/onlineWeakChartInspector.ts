import {
  MASTER_ULTIMA_DIFFICULTIES,
  THEORETICAL_OVER_POWER_TARGET_FILTER,
} from '../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { formatChartConst } from './chartConstFormat'
import { isNullableSelectionMatched } from './filterSelection'
import { formatInteger } from './numberFormat'
import { formatScoreDifference } from './scoreDifference'
import { compareSongsByReading } from './songTitleSorting'
import { isTheoreticalOverPowerTargetDifficulty } from './theoreticalOverPowerTarget'

/** 苦手譜面インスペクター Online で理論値OVER POWER対象を表す選択値 */
export const ONLINE_WEAK_CHART_OP_TARGET_FILTER = THEORETICAL_OVER_POWER_TARGET_FILTER

/** 苦手譜面インスペクター Online で選択できる通常難易度または理論値OVER POWER対象 */
export type OnlineWeakChartDifficulty =
  | PlayerDataDifficulty
  | typeof ONLINE_WEAK_CHART_OP_TARGET_FILTER

/** 苦手譜面インスペクター Online の比較表で表示する平均との比較条件 */
export const ONLINE_WEAK_CHART_TABLE_FILTER = {
  all: 'all',
  aboveAverage: 'aboveAverage',
  belowAverage: 'belowAverage',
} as const

/** 苦手譜面インスペクター Online の比較表で表示する平均との比較条件の型 */
export type OnlineWeakChartTableFilter =
  (typeof ONLINE_WEAK_CHART_TABLE_FILTER)[keyof typeof ONLINE_WEAK_CHART_TABLE_FILTER]

/** 同じレート帯の平均と比較できるプレイ済み譜面 */
export interface OnlineWeakChartEntry {
  record: PlayerRecordDTO
  averageScore: number
  difference: number
}

/** 苦手譜面インスペクター（Online・Unified）で共通の表示・集計範囲 */
export interface WeakChartSettings {
  /** 通常難易度または理論値OVER POWER対象の選択値 */
  difficulties: readonly OnlineWeakChartDifficulty[]
  constMin: number
  constMax: number
  genres: readonly string[] | null
  versions: readonly string[] | null
  /** 楽曲名順フォルダのコード。null は全選択、空配列は全件不一致を表す */
  nameFolders: readonly string[] | null
}

/** Online の表示条件 */
export interface OnlineWeakChartFilter extends WeakChartSettings {
  /** 散布図の縦軸に表示するスコア差の絶対値範囲。比較表と平均値の集計範囲は制限しない。 */
  displayScoreRange: number
}

/** 比較表をジャンル・バージョン・楽曲名順で絞り込むための楽曲属性。 */
export type OnlineWeakChartSongAttributes = {
  genre: string | null
  version: string
  /** 楽曲名順フォルダのコード。不明な場合は null */
  nameFolder: string | null
}

/** 苦手譜面インスペクター Online の比較表で利用できるソートキー */
export type OnlineWeakChartSortKey =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'averageScore'
  | 'difference'

/**
 * 理論値OVER POWER対象と通常難易度が同時に選ばれない次の選択状態を作る。
 *
 * @param current - 現在選択中の難易度。
 * @param toggled - 切り替える難易度。
 * @returns 切り替え後の難易度。
 */
export const toggleOnlineWeakChartDifficulty = (
  current: readonly OnlineWeakChartDifficulty[],
  toggled: OnlineWeakChartDifficulty
): OnlineWeakChartDifficulty[] => {
  if (toggled === ONLINE_WEAK_CHART_OP_TARGET_FILTER) {
    return current.includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER)
      ? []
      : [ONLINE_WEAK_CHART_OP_TARGET_FILTER]
  }

  const withoutOpTarget = current.filter(
    (difficulty) => difficulty !== ONLINE_WEAK_CHART_OP_TARGET_FILTER
  )
  return withoutOpTarget.includes(toggled)
    ? withoutOpTarget.filter((difficulty) => difficulty !== toggled)
    : [...withoutOpTarget, toggled]
}

/**
 * 平均スコア統計の取得に使う通常難易度を選択値から解決する。
 *
 * @param difficulties - 通常難易度または理論値OVER POWER対象の選択値。
 * @returns 静的スコア統計を取得する通常難易度。
 */
export const resolveOnlineWeakChartScoreDifficulties = (
  difficulties: readonly OnlineWeakChartDifficulty[]
): PlayerDataDifficulty[] => {
  if (difficulties.includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER)) {
    return [...MASTER_ULTIMA_DIFFICULTIES]
  }

  return PLAYER_DATA_DIFFICULTIES.filter((difficulty) => difficulties.includes(difficulty))
}

/**
 * レコードが選択した難易度に含まれるか判定する。
 * 理論値OVER POWER対象を選択した場合は、曲ごとの対象難易度の譜面だけを含める。
 *
 * @param record - 判定する譜面レコード。
 * @param difficulties - 通常難易度または理論値OVER POWER対象の選択値。
 * @param targetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @returns 選択した難易度に含まれる場合は true。
 */
export const isWeakChartDifficultySelected = (
  record: Pick<PlayerRecordDTO, 'id' | 'difficulty'>,
  difficulties: readonly OnlineWeakChartDifficulty[],
  targetDifficultyBySongId?: ReadonlyMap<string, PlayerDataDifficulty>
): boolean => {
  const recordDifficulty = record.difficulty.toUpperCase() as PlayerDataDifficulty
  return difficulties.includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER)
    ? isTheoreticalOverPowerTargetDifficulty(
        targetDifficultyBySongId?.get(record.id),
        recordDifficulty
      )
    : difficulties.includes(recordDifficulty)
}

/**
 * 比較結果から表示条件に含まれる譜面を抽出する。
 *
 * @param entries - レコードを持つ比較結果。Online の平均比較と Unified の判定結果の両方に使う。
 * @param filter - 難易度、譜面定数、ジャンル、バージョン、楽曲名順の表示条件。
 * @param attributesBySongId - 楽曲IDごとのジャンル・バージョン。未取得時は属性条件を適用しない。
 * @param targetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @returns 表示対象の比較結果。
 */
export const filterOnlineWeakChartEntries = <TEntry extends { record: PlayerRecordDTO }>(
  entries: readonly TEntry[],
  filter: WeakChartSettings,
  attributesBySongId?: ReadonlyMap<string, OnlineWeakChartSongAttributes>,
  targetDifficultyBySongId?: ReadonlyMap<string, PlayerDataDifficulty>
): TEntry[] => {
  const filteredEntries = entries.filter(
    ({ record }) =>
      isWeakChartDifficultySelected(record, filter.difficulties, targetDifficultyBySongId) &&
      record.const >= filter.constMin &&
      record.const <= filter.constMax
  )

  if (
    !attributesBySongId ||
    (filter.genres === null && filter.versions === null && filter.nameFolders === null)
  ) {
    return filteredEntries
  }

  return filteredEntries.filter(({ record }) => {
    const attributes = attributesBySongId.get(record.id) ?? {
      genre: null,
      version: '不明',
      nameFolder: null,
    }
    if (
      filter.genres !== null &&
      (attributes.genre === null || !filter.genres.includes(attributes.genre))
    ) {
      return false
    }
    if (filter.versions !== null && !filter.versions.includes(attributes.version)) {
      return false
    }
    return isNullableSelectionMatched(attributes.nameFolder, filter.nameFolders)
  })
}

/**
 * 比較表の平均との比較条件に一致する譜面を抽出する。
 *
 * @param entries - 表示対象の比較結果。
 * @param filter - 表示する平均との比較条件。
 * @returns 比較条件に一致した比較結果。
 */
export const filterOnlineWeakChartTableEntries = (
  entries: readonly OnlineWeakChartEntry[],
  filter: OnlineWeakChartTableFilter
): OnlineWeakChartEntry[] => {
  switch (filter) {
    case ONLINE_WEAK_CHART_TABLE_FILTER.aboveAverage:
      return entries.filter(({ difference }) => difference >= 0)
    case ONLINE_WEAK_CHART_TABLE_FILTER.belowAverage:
      return entries.filter(({ difference }) => difference < 0)
    default:
      return [...entries]
  }
}

/**
 * 苦手譜面インスペクター Online の比較結果を指定列でソートする。
 *
 * @param entries - ソート対象の比較結果。
 * @param sortKey - ソート対象列。未指定時は入力順を維持する。
 * @param sortDirection - ソート方向。未指定時は入力順を維持する。
 * @returns ソート済みの比較結果配列。
 */
export const sortOnlineWeakChartEntries = (
  entries: readonly OnlineWeakChartEntry[],
  sortKey: OnlineWeakChartSortKey | null,
  sortDirection: 'asc' | 'desc' | null
): OnlineWeakChartEntry[] => {
  if (!sortKey || !sortDirection) return [...entries]

  const direction = sortDirection === 'asc' ? 1 : -1

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const leftRecord = left.entry.record
      const rightRecord = right.entry.record
      let comparison = 0

      switch (sortKey) {
        case 'title':
          comparison = compareSongsByReading(leftRecord, rightRecord)
          break
        case 'difficulty':
          comparison = leftRecord.difficulty.localeCompare(rightRecord.difficulty)
          break
        case 'const':
          comparison = leftRecord.const - rightRecord.const
          break
        case 'score':
          comparison = leftRecord.score - rightRecord.score
          break
        case 'averageScore':
          comparison = left.entry.averageScore - right.entry.averageScore
          break
        case 'difference':
          comparison = left.entry.difference - right.entry.difference
          break
      }

      return comparison === 0 ? left.index - right.index : comparison * direction
    })
    .map(({ entry }) => entry)
}

/**
 * 苦手譜面インスペクター Online のツールチップへ表示する譜面情報を整形する。
 *
 * @param record - 表示する譜面レコード。
 * @param difference - 自分のスコアとレート帯平均の差。
 * @returns 難易度、譜面定数、自分のスコア、差分を含む表示文字列。
 */
export const formatOnlineWeakChartTooltipDetail = (
  record: Pick<PlayerRecordDTO, 'difficulty' | 'const' | 'score'>,
  difference: number
): string =>
  `${record.difficulty} ${formatChartConst(record.const)} / ${formatInteger(record.score)} (${formatScoreDifference(difference)})`

/**
 * プレイ済み譜面と選択レート帯の平均スコアを照合する。
 *
 * @param records - ログインユーザーの通常譜面レコード。
 * @param scoreSnapshots - 難易度別の公開スコア統計。
 * @param ratingBand - 比較するベスト枠平均レート帯。
 * @returns 比較先の平均があるプレイ済み譜面とスコア差。
 */
export const compareRecordsWithRatingBand = (
  records: readonly PlayerRecordDTO[],
  scoreSnapshots: readonly ChartScoresResponse[],
  ratingBand: string
): OnlineWeakChartEntry[] => {
  const averages = new Map<string, number>()

  for (const snapshot of scoreSnapshots) {
    for (const chart of snapshot.charts) {
      const average = chart.scores.find((score) => score.rating_band === ratingBand)?.average_score
      if (average !== null && average !== undefined) {
        averages.set(`${chart.song_id}:${snapshot.difficulty}`, average)
      }
    }
  }

  return records.flatMap((record) => {
    if (!record.is_played) return []
    const averageScore = averages.get(`${record.id}:${record.difficulty.toUpperCase()}`)
    if (averageScore === undefined) return []
    return [{ record, averageScore, difference: record.score - Math.trunc(averageScore) }]
  })
}
