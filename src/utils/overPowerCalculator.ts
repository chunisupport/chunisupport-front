import type { PlayerRecordDTO } from '../types/api'

/**
 * OVER POWER計算機で扱う基準値。
 */
export type OverPowerCalculatorBase = {
  /** 未解禁曲を除いた理論OVER POWER合計。 */
  max: number
  /** 現在獲得しているOVER POWER合計。 */
  current: number
}

/**
 * 未プレイ除外計算で使う未プレイ曲の扱い。
 */
export type UnplayedOverPowerFillMode =
  | 'none'
  | 'remove'
  | 'theoretical'
  | 'playedAverage'
  | 'targetConstAverage'
  | 'targetConstRegressionAverage'
  | 'manual'

/**
 * 譜面定数から予測スコアを出す線形回帰モデル。
 */
export type PlayedAverageScoreRegression = {
  /** score = slope * const + intercept の傾き。 */
  slope: number
  /** score = slope * const + intercept の切片。 */
  intercept: number
}

/**
 * 未プレイ除外計算で扱う曲ごとのOVER POWER情報。
 */
export type UnplayedOverPowerEntry = {
  /** 現在獲得している曲内最大OVER POWER。 */
  current: number
  /** 曲の理論OVER POWER。 */
  max: number
  /** 未プレイをスコアで埋める場合に使う理論値対象譜面の譜面定数。 */
  targetConst: number
  /** 曲に既プレイ譜面が1つもないか。 */
  isUnplayed: boolean
}

/**
 * 未プレイ除外計算の入力値。
 */
export type UnplayedOverPowerCalculationInput = {
  /** 曲ごとのOVER POWER情報。 */
  entries: UnplayedOverPowerEntry[]
  /** 現在OP対象になっている既プレイ譜面の平均スコア。 */
  playedAverageScore: number | null
  /** 現在OP対象の既プレイ譜面を譜面定数ごとに集計した平均スコア。 */
  playedAverageScoreByConst: Map<number, number>
  /** 譜面定数ごとの平均スコアから作った線形回帰モデル。 */
  playedAverageScoreRegression: PlayedAverageScoreRegression | null
  /** 未プレイ曲の扱い。 */
  mode: UnplayedOverPowerFillMode
  /** 手動指定で埋めるスコア。 */
  manualScore: number
}

/**
 * 未プレイ除外計算の結果。
 */
export type UnplayedOverPowerCalculationResult = OverPowerCalculatorBase & {
  /** 現在値と理論値から計算したOVER POWER達成率。 */
  percent: number
}

const MIN_OVER_POWER_SCORE = 975000
const MAX_OVER_POWER_SCORE = 1010000
const SSS_OVER_POWER_SCORE = 1007500
const SSS_OVER_POWER_RATE = 0.0015
const OP_MULTIPLIER = 5
const SSS_CONSTANT_BONUS = 2

/**
 * 曲ごとに現在OVER POWER対象として扱う譜面レコードを抽出する。
 *
 * @param records - 集計対象のプレイヤーレコード一覧。
 * @returns 曲ごとの現在OVER POWER対象レコード一覧。
 */
const getCurrentOverPowerTargetRecords = (records: PlayerRecordDTO[]): PlayerRecordDTO[] => {
  const recordsBySongId = new Map<string, PlayerRecordDTO[]>()

  for (const record of records) {
    const songRecords = recordsBySongId.get(record.id) ?? []
    songRecords.push(record)
    recordsBySongId.set(record.id, songRecords)
  }

  return [...recordsBySongId.values()].map((songRecords) => {
    const targetRecords = songRecords.some((record) => record.is_op_target)
      ? songRecords.filter((record) => record.is_op_target)
      : songRecords
    return targetRecords.reduce((maxRecord, record) =>
      record.overpower > maxRecord.overpower ? record : maxRecord
    )
  })
}

/**
 * 現在値と理論値からOVER POWER達成率を計算する。
 *
 * @param current - 現在獲得しているOVER POWER合計。
 * @param max - 未解禁曲を除いた理論OVER POWER合計。
 * @returns OVER POWER達成率。理論値が0以下の場合は0。
 */
export const calculateOverPowerPercent = (current: number, max: number): number =>
  max > 0 ? (current / max) * 100 : 0

/**
 * 目標達成率から必要OVER POWER値を計算する。
 *
 * @param percent - 目標OVER POWER達成率。
 * @param max - 未解禁曲を除いた理論OVER POWER合計。
 * @returns 目標達成率に必要なOVER POWER値。
 */
export const calculateRequiredOverPower = (percent: number, max: number): number =>
  (max * percent) / 100

/**
 * 目標OVER POWER値と現在値の差分を計算する。
 *
 * @param required - 目標達成に必要なOVER POWER値。
 * @param current - 現在獲得しているOVER POWER合計。
 * @returns 必要値から現在値を引いた差分。
 */
export const calculateOverPowerDifference = (required: number, current: number): number =>
  required - current

/**
 * スコアからコンボ補正なしのOVER POWERを計算する。
 *
 * @param score - 計算に使うスコア。
 * @param chartConst - 対象譜面の譜面定数。
 * @returns スコアと譜面定数から計算したOVER POWER。975,000未満は0。
 */
export const calculateOverPowerForScore = (score: number, chartConst: number): number => {
  if (!Number.isFinite(score) || !Number.isFinite(chartConst) || score < MIN_OVER_POWER_SCORE) {
    return 0
  }

  const normalizedScore = Math.min(score, MAX_OVER_POWER_SCORE)
  if (normalizedScore > SSS_OVER_POWER_SCORE) {
    return (
      (chartConst + SSS_CONSTANT_BONUS) * OP_MULTIPLIER +
      (normalizedScore - SSS_OVER_POWER_SCORE) * SSS_OVER_POWER_RATE
    )
  }

  if (normalizedScore < 1000000) {
    return (chartConst + (normalizedScore - 975000) / 25000) * OP_MULTIPLIER
  }

  if (normalizedScore < 1005000) {
    return (chartConst + 1 + (normalizedScore - 1000000) / 10000) * OP_MULTIPLIER
  }

  return (chartConst + 1.5 + (normalizedScore - 1005000) / 5000) * OP_MULTIPLIER
}

/**
 * 現在OVER POWER対象になっている既プレイ譜面の平均スコアを計算する。
 *
 * @param records - 集計対象のプレイヤーレコード一覧。
 * @returns 対象譜面がある場合は平均スコア。ない場合はnull。
 */
export const calculatePlayedAverageScore = (records: PlayerRecordDTO[]): number | null => {
  const targetPlayedRecords = getCurrentOverPowerTargetRecords(records).filter(
    (record) => record.is_played
  )

  if (targetPlayedRecords.length === 0) return null

  return (
    targetPlayedRecords.reduce((sum, record) => sum + record.score, 0) / targetPlayedRecords.length
  )
}

/**
 * 現在OVER POWER対象になっている既プレイ譜面の平均スコアを譜面定数ごとに計算する。
 *
 * @param records - 集計対象のプレイヤーレコード一覧。
 * @returns 譜面定数をキーにした平均スコア。
 */
export const calculatePlayedAverageScoreByConst = (
  records: PlayerRecordDTO[]
): Map<number, number> => {
  const groupedScores = new Map<number, { total: number; count: number }>()

  for (const record of getCurrentOverPowerTargetRecords(records)) {
    if (!record.is_played) continue

    const group = groupedScores.get(record.const) ?? { total: 0, count: 0 }
    group.total += record.score
    group.count += 1
    groupedScores.set(record.const, group)
  }

  return new Map(
    [...groupedScores.entries()].map(([chartConst, group]) => [
      chartConst,
      group.total / group.count,
    ])
  )
}

/**
 * 譜面定数ごとの平均スコアから線形回帰モデルを作成する。
 *
 * @param playedAverageScoreByConst - 譜面定数をキーにした平均スコア。
 * @returns 予測に使う線形回帰モデル。点がない場合はnull。
 */
export const calculatePlayedAverageScoreRegression = (
  playedAverageScoreByConst: Map<number, number>
): PlayedAverageScoreRegression | null => {
  const points = [...playedAverageScoreByConst.entries()]
  if (points.length === 0) return null
  if (points.length === 1) {
    return { slope: 0, intercept: points[0][1] }
  }

  const averageConst = points.reduce((sum, [chartConst]) => sum + chartConst, 0) / points.length
  const averageScore = points.reduce((sum, [, score]) => sum + score, 0) / points.length
  const variance = points.reduce((sum, [chartConst]) => sum + (chartConst - averageConst) ** 2, 0)
  if (variance === 0) return { slope: 0, intercept: averageScore }

  const covariance = points.reduce(
    (sum, [chartConst, score]) => sum + (chartConst - averageConst) * (score - averageScore),
    0
  )
  const slope = covariance / variance
  return {
    slope,
    intercept: averageScore - slope * averageConst,
  }
}

/**
 * 線形回帰モデルから指定譜面定数の予測スコアを計算する。
 *
 * @param regression - 譜面定数ごとの平均スコアから作った線形回帰モデル。
 * @param chartConst - 予測対象の譜面定数。
 * @returns 予測スコア。モデルがない場合は0。
 */
export const predictPlayedAverageScoreByConstRegression = (
  regression: PlayedAverageScoreRegression | null,
  chartConst: number
): number => {
  if (regression === null) return 0
  return Math.max(
    0,
    Math.min(MAX_OVER_POWER_SCORE, regression.slope * chartConst + regression.intercept)
  )
}

/**
 * 未プレイ曲の扱いからOVER POWER達成率を計算する。
 *
 * @param input - 曲ごとのOVER POWER情報、平均スコア、選択中の扱い。
 * @returns 未プレイの扱いを反映した現在値・理論値・達成率。
 */
export const calculateUnplayedOverPower = (
  input: UnplayedOverPowerCalculationInput
): UnplayedOverPowerCalculationResult => {
  const summary = input.entries.reduce(
    (acc, entry) => {
      if (entry.isUnplayed && input.mode === 'remove') {
        return acc
      }

      const filledCurrent = (() => {
        if (!entry.isUnplayed) return entry.current
        if (input.mode === 'theoretical') return entry.max
        if (input.mode === 'playedAverage' && input.playedAverageScore !== null) {
          return Math.max(
            entry.current,
            Math.min(
              calculateOverPowerForScore(input.playedAverageScore, entry.targetConst),
              entry.max
            )
          )
        }
        if (input.mode === 'targetConstAverage') {
          return Math.max(
            entry.current,
            Math.min(
              calculateOverPowerForScore(
                input.playedAverageScoreByConst.get(entry.targetConst) ?? 0,
                entry.targetConst
              ),
              entry.max
            )
          )
        }
        if (input.mode === 'targetConstRegressionAverage') {
          return Math.max(
            entry.current,
            Math.min(
              calculateOverPowerForScore(
                predictPlayedAverageScoreByConstRegression(
                  input.playedAverageScoreRegression,
                  entry.targetConst
                ),
                entry.targetConst
              ),
              entry.max
            )
          )
        }
        if (input.mode === 'manual') {
          return Math.max(
            entry.current,
            Math.min(calculateOverPowerForScore(input.manualScore, entry.targetConst), entry.max)
          )
        }
        return entry.current
      })()

      return {
        current: acc.current + filledCurrent,
        max: acc.max + entry.max,
      }
    },
    { current: 0, max: 0 }
  )

  return {
    ...summary,
    percent: calculateOverPowerPercent(summary.current, summary.max),
  }
}

/**
 * 入力文字列をOVER POWER計算用の数値へ変換する。
 *
 * @param value - 入力欄の文字列。
 * @returns 空欄または数値化できない場合はnull、それ以外は数値。
 */
export const parseOverPowerInput = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * OVER POWER値を入力欄向けの文字列へ整形する。
 *
 * @param value - 整形するOVER POWER値。
 * @returns 不要な末尾0を省いた文字列。
 */
export const formatOverPowerInputValue = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
