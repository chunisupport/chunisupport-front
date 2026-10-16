import type { PlayerRecordDTO } from '../types/api'
import { formatFixed } from './numberFormat'
import { CALCULATOR_VALUE_DECIMALS } from './overPowerCalculatorConstants'
import { formatOverPowerValue } from './overPowerFormat'
import { clampNumber, parseNumberInput } from './rangeInput'
import { MAX_SCORE } from './scoreRank'
import { calculateSingleOverPower } from './singleOverPower'

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
  | 'manual'

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
  /** 利用可能な理論値対象譜面が未プレイか。 */
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
const MAX_OVER_POWER_SCORE = MAX_SCORE
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
const getCurrentOverPowerTargetRecords = <
  T extends Pick<PlayerRecordDTO, 'id' | 'is_op_target' | 'overpower'>,
>(
  records: T[]
): T[] => {
  const recordsBySongId = new Map<string, T[]>()

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
export const calculatePlayedAverageScore = (
  records: Pick<PlayerRecordDTO, 'id' | 'is_op_target' | 'overpower' | 'is_played' | 'score'>[]
): number | null => {
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
  records: Pick<
    PlayerRecordDTO,
    'id' | 'is_op_target' | 'overpower' | 'is_played' | 'score' | 'const'
  >[]
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
 * 同じ定数の既プレイ平均を使い、欠けている定数だけ周辺の平均で線形補間する。
 * 範囲外は近い2定数から外挿し、平均が1定数だけならその値を使用する。
 *
 * @param playedAverageScoreByConst - サンプルがある譜面定数の平均スコア。
 * @param chartConst - 補完対象の譜面定数。
 * @returns 0〜理論スコアに制限した推定値。サンプルがない場合は0。
 */
export const interpolatePlayedAverageScoreByConst = (
  playedAverageScoreByConst: Map<number, number>,
  chartConst: number
): number => {
  const exactAverage = playedAverageScoreByConst.get(chartConst)
  if (exactAverage !== undefined) return exactAverage

  const points = [...playedAverageScoreByConst.entries()].sort(([left], [right]) => left - right)
  if (points.length === 0) return 0
  if (points.length === 1) return points[0][1]

  const upperIndex = points.findIndex(([constant]) => constant > chartConst)
  const rightIndex = upperIndex === -1 ? points.length - 1 : Math.max(1, upperIndex)
  const [leftConst, leftScore] = points[rightIndex - 1]
  const [rightConst, rightScore] = points[rightIndex]
  const score =
    leftScore + ((chartConst - leftConst) / (rightConst - leftConst)) * (rightScore - leftScore)
  return clampNumber(score, 0, MAX_OVER_POWER_SCORE)
}

/**
 * 未プレイ曲の扱いからOVER POWER達成率を計算する。
 * 定数別平均でサンプルのない定数は、周辺の平均から補間・外挿する。
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
                interpolatePlayedAverageScoreByConst(
                  input.playedAverageScoreByConst,
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

  const parsed = parseNumberInput(normalized)
  return parsed !== undefined && Number.isFinite(parsed) ? parsed : null
}

/**
 * OVER POWER値または達成率を入力欄の固定小数表記へ整形する。
 *
 * @param value - 整形する値。
 * @param decimalPlaces - 常時表示する小数桁数。既定はOVER POWERの3桁。
 * @returns 指定桁数に0埋めした入力文字列。
 */
export const formatOverPowerInputValue = (
  value: number,
  decimalPlaces = CALCULATOR_VALUE_DECIMALS
): string => formatFixed(value, decimalPlaces)

/**
 * 計算機の入力を指定範囲と固定小数表記へ正規化する。
 *
 * @param value - 入力された数値文字列。
 * @param decimalPlaces - 小数桁数。
 * @param min - 許可する最小値。
 * @param max - 許可する最大値。
 * @returns 空欄・不正値を0として範囲内に収めた固定小数文字列。
 */
export const normalizeOverPowerCalculatorInput = (
  value: string,
  decimalPlaces: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): string =>
  formatOverPowerInputValue(clampNumber(parseOverPowerInput(value) ?? 0, min, max), decimalPlaces)

/**
 * 指定した現在スコアから目標スコアへ伸ばす場合の必要譜面数を計算する。
 *
 * @param difference - 目標までに必要な追加OVER POWER。
 * @param score - 達成する目標スコア。
 * @param chartConst - 達成する譜面定数。
 * @param comboLamp - コンボランプ。理論値では通常列のみ有効。
 * @param currentScore - 現在スコア。現在のコンボランプは通常として扱う。
 * @returns 必要譜面数。目標達成済みなら0、理論値のランプ列・成立しないAJC・OPが増えない条件はnull。
 */
export const calculateRequiredChartCount = (
  difference: number,
  score: number,
  chartConst: number,
  comboLamp: string | null,
  currentScore = 0
): number | null => {
  if (score === MAX_SCORE && comboLamp !== null) return null
  if (comboLamp === 'ALL JUSTICE CRITICAL' && score !== MAX_SCORE) return null
  if (difference <= 0) return 0
  const gain =
    calculateSingleOverPower(score, chartConst, comboLamp).value -
    calculateSingleOverPower(currentScore, chartConst, null).value
  if (gain <= 0) return null
  const count = difference / gain
  // 境界点の浮動小数誤差で必要数が1つ増えることを防ぐ。
  const epsilon = Number.EPSILON * Math.max(1, count) * 8
  return Math.ceil(count - epsilon)
}

/**
 * OVER POWERの差分を符号付きで整形する。
 * @param value - 表示する差分。
 * @returns 正数に+を付けた小数点以下3桁の表示文字列。
 */
export const formatSignedOverPowerValue = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatOverPowerValue(value)}`

/**
 * 編集済みの計算入力を保持し、集計対象の変更時のみ増減を反映する。
 *
 * @param value - 現在の入力文字列。
 * @param previousBase - 前回の自動集計値。初回はundefined。
 * @param nextBase - 更新後の自動集計値。
 * @param edited - ユーザーが入力または加算した場合はtrue。
 * @param selectionChanged - 未解禁設定による集計対象が変更された場合はtrue。
 * @returns 再取得時は編集値を保持し、対象変更時は差分を反映した文字列。負値の表示制限は呼び出し元で行う。
 */
export const reconcileOverPowerCalculatorValue = (
  value: string,
  previousBase: number | undefined,
  nextBase: number,
  edited: boolean,
  selectionChanged: boolean
): string => {
  if (!edited) return formatOverPowerInputValue(nextBase)
  if (!selectionChanged || previousBase === undefined) return value
  return formatOverPowerInputValue((parseOverPowerInput(value) ?? 0) + nextBase - previousBase)
}
