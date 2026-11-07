import { SCORE_MIN } from '../../../../../constants/chart'
import type { GoalAchievementType } from '../../../../../types/api'
import { truncateDecimal } from '../../../../../utils/numberFormat'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import { GOAL_TITLE_MAX_LENGTH } from '../../constants'
import {
  buildGaugeStartDecimalErrorMessage,
  ERROR_MESSAGE_GAUGE_START_CURRENT_NO_TARGET,
  ERROR_MESSAGE_GAUGE_START_CURRENT_NOT_POSITIVE,
  ERROR_MESSAGE_GAUGE_START_CURRENT_REACHED_TARGET,
  ERROR_MESSAGE_GAUGE_START_INTEGER,
  ERROR_MESSAGE_GAUGE_START_NOT_BELOW_TARGET,
  ERROR_MESSAGE_INVALID_COUNT_TARGET,
  OVERPOWER_TARGET_DECIMAL_PLACES,
  RATING_GOAL_DECIMAL_PLACES,
  RATING_GOAL_MIN_VALUE,
} from './constants'
import {
  canUseDynamicTotalTarget,
  type GoalFormGaugeStartValueInput,
  type GoalGaugeStartMode,
  getGoalGaugeStartDecimalPlaces,
  getRankGoalScore,
  isCountAchievementType,
  type RankGoalValue,
  resolveGoalFormGaugeStart,
} from './goalFormModel'

const MAX_OVERPOWER_PERCENT = 100

export interface GoalFormValidationInput {
  title: string
  achievementType: GoalAchievementType
  score: string
  rating?: string
  rank: RankGoalValue
  count: string
  countMode: GoalTargetMode
  total: string
  totalMode: GoalTargetMode
  constMin: string
  constMax: string
  allCount: number
  theoreticalTotal: number
}

/**
 * 数値が指定した小数桁数以内か判定する。
 * `17.1` のような2進浮動小数点誤差は、既存の切り捨て処理と同じ許容差で吸収する。
 *
 * @param value - 判定対象の数値。
 * @param decimalPlaces - 許容する小数桁数。
 * @returns 許容範囲内ならtrue。
 */
export const isWithinDecimalPlaces = (value: number, decimalPlaces: number): boolean =>
  Number.isFinite(value) && truncateDecimal(value, decimalPlaces) === value

/**
 * 目標フォームの保存前検証を行う。
 *
 * @param input - 保存しようとしているフォーム値と、対象条件から解決した上限値。
 * @returns 検証エラーがあれば表示メッセージ、問題なければundefined。
 */
export const validateGoalForm = (input: GoalFormValidationInput): string | undefined => {
  const trimmed = input.title.trim()
  if (!trimmed) return 'タイトルを入力してください。'
  if (trimmed.length > GOAL_TITLE_MAX_LENGTH) {
    return `タイトルは${GOAL_TITLE_MAX_LENGTH}文字以内で入力してください。`
  }

  const parsedScore =
    input.achievementType === 'rank_count' ? getRankGoalScore(input.rank) : Number(input.score)
  const parsedCount = Number(input.count)
  const parsedRating = Number(input.rating)
  const parsedTotal =
    canUseDynamicTotalTarget(input.achievementType) && input.totalMode === 'all'
      ? input.theoreticalTotal
      : Number(input.total)
  const parsedConstMin = input.constMin === '' ? undefined : Number(input.constMin)
  const parsedConstMax = input.constMax === '' ? undefined : Number(input.constMax)
  const isCountType = isCountAchievementType(input.achievementType)

  if (
    input.achievementType !== 'rainbow_count' &&
    ((typeof parsedConstMin === 'number' && !Number.isFinite(parsedConstMin)) ||
      (typeof parsedConstMax === 'number' && !Number.isFinite(parsedConstMax)))
  ) {
    return '定数範囲が不正です。'
  }

  if (
    input.achievementType === 'rating_count' &&
    (!Number.isFinite(parsedRating) ||
      parsedRating < RATING_GOAL_MIN_VALUE ||
      !isWithinDecimalPlaces(parsedRating, RATING_GOAL_DECIMAL_PLACES))
  ) {
    return `単曲レートは${RATING_GOAL_MIN_VALUE}以上、小数第${RATING_GOAL_DECIMAL_PLACES}位以内で入力してください。`
  }
  if (
    input.achievementType !== 'rainbow_count' &&
    typeof parsedConstMin === 'number' &&
    typeof parsedConstMax === 'number' &&
    parsedConstMin > parsedConstMax
  ) {
    return '定数の最小値は最大値以下にしてください。'
  }

  if (input.allCount <= 0) {
    return input.achievementType === 'rainbow_count'
      ? '条件に当てはまる楽曲がありません。条件を見直してください。'
      : '条件に当てはまる譜面がありません。条件を見直してください。'
  }

  if (
    (input.achievementType === 'score_count' ||
      input.achievementType === 'rank_count' ||
      input.achievementType === 'avg_score') &&
    (!Number.isFinite(parsedScore) || parsedScore < SCORE_MIN || parsedScore > MAX_SCORE)
  ) {
    return 'スコアは 0 ～ 1,010,000 の範囲で入力してください。'
  }

  if (isCountType && input.countMode !== 'all') {
    const countMin = input.countMode === 'number' ? 1 : 0
    const requiresInteger = input.countMode !== 'percent'
    if (
      !Number.isFinite(parsedCount) ||
      (requiresInteger && !Number.isInteger(parsedCount)) ||
      parsedCount < countMin
    ) {
      const inputLabel = input.countMode === 'percent' ? '割合' : '件数'
      return `${inputLabel}は${countMin}以上の${requiresInteger ? '整数' : '数値'}で入力してください。`
    }
    const countMax = input.countMode === 'percent' ? MAX_OVERPOWER_PERCENT : input.allCount
    if (parsedCount > countMax) {
      const unit = input.countMode === 'percent' ? '%' : '件'
      return `${input.countMode === 'percent' ? '割合' : '件数'}は${countMax.toLocaleString('ja-JP')}${unit}以内で入力してください。`
    }
  }

  if (
    (input.achievementType === 'overpower_percent' ||
      (canUseDynamicTotalTarget(input.achievementType) && input.totalMode !== 'all')) &&
    (!Number.isFinite(parsedTotal) || parsedTotal < 0)
  ) {
    return '合計/割合の目標値は0以上で入力してください。'
  }

  if (input.achievementType === 'overpower_percent' && parsedTotal > MAX_OVERPOWER_PERCENT) {
    return 'OVER POWER達成率は100%以下で入力してください。'
  }

  if (
    input.achievementType === 'total_score' &&
    (input.totalMode === 'number' || input.totalMode === 'remaining') &&
    !Number.isInteger(parsedTotal)
  ) {
    return '総スコアの目標値と残数は整数で入力してください。'
  }

  if (
    (input.achievementType === 'overpower_percent' ||
      (input.achievementType === 'overpower_value' && input.totalMode !== 'all')) &&
    !isWithinDecimalPlaces(parsedTotal, OVERPOWER_TARGET_DECIMAL_PLACES)
  ) {
    const targetLabel =
      input.achievementType === 'overpower_percent'
        ? 'OVER POWER達成率'
        : 'OVER POWERの目標値・残数・割合'
    return `${targetLabel}は小数第${OVERPOWER_TARGET_DECIMAL_PLACES}位以内で入力してください。`
  }

  const dynamicTotalMax = canUseDynamicTotalTarget(input.achievementType)
    ? input.totalMode === 'percent'
      ? MAX_OVERPOWER_PERCENT
      : input.totalMode === 'all'
        ? undefined
        : input.theoreticalTotal
    : undefined
  if (dynamicTotalMax !== undefined && parsedTotal > dynamicTotalMax) {
    const targetLabel =
      input.achievementType === 'total_score' ? '総スコア目標' : 'OVER POWER合計目標'
    return `${targetLabel}は最大 ${dynamicTotalMax.toLocaleString('ja-JP')} 以下で入力してください。`
  }

  if (isCountType && input.countMode === 'number' && parsedCount <= 0) {
    return ERROR_MESSAGE_INVALID_COUNT_TARGET
  }

  return undefined
}

/** ゲージのスタート位置の保存前検証に使う入力 */
export interface GoalGaugeStartValidationInput extends GoalFormGaugeStartValueInput {
  /** 現在の入力内容から解決した目標値 */
  target: number
}

/** 「現在値から」の選択欄に出すエラーを決める入力 */
export interface GoalGaugeStartGroupErrorInput {
  /** 選択中のスタート位置の決め方 */
  gaugeStartMode: GoalGaugeStartMode
  /** 目標種別の桁数で切り捨てた、保存される現在値 */
  currentGaugeStart: number
  /** プレビュー進捗が達成済みか */
  achieved: boolean
  /** 条件に一致する対象数。0件のとき「現在値から」は使えない */
  targetCount: number
}

/**
 * ゲージのスタート位置を保存前に検証する。
 * 0から描く指定は目標値に関係なく許可する。
 * 「現在値から」は、切り捨て後の現在値が0以下のときと目標値以上のときにエラーにする。
 *
 * @param input - 目標種別、スタート位置の決め方と入力値、現在値、現在の目標値。
 * @returns スタート位置の欄に表示するエラーメッセージ。問題なければundefined。
 */
export const validateGoalGaugeStart = (
  input: GoalGaugeStartValidationInput
): string | undefined => {
  const gaugeStart = resolveGoalFormGaugeStart(input)
  if (input.gaugeStartMode === 'current') {
    // 0以下を保存すると「最初から」と同じ起点になるため、選択済みでもエラーにする。
    if (!(gaugeStart > 0)) return ERROR_MESSAGE_GAUGE_START_CURRENT_NOT_POSITIVE
    // 選択後に目標値を下げて達成済みになった場合は、現在値を起点にできない。
    if (gaugeStart >= input.target) return ERROR_MESSAGE_GAUGE_START_CURRENT_REACHED_TARGET
    return undefined
  }
  if (input.gaugeStartMode === 'zero') return undefined

  const decimalPlaces = getGoalGaugeStartDecimalPlaces(input.achievementType)
  if (!isWithinDecimalPlaces(gaugeStart, decimalPlaces) || gaugeStart < 0) {
    return decimalPlaces > 0
      ? buildGaugeStartDecimalErrorMessage(decimalPlaces)
      : ERROR_MESSAGE_GAUGE_START_INTEGER
  }
  if (gaugeStart > 0 && gaugeStart >= input.target) {
    return ERROR_MESSAGE_GAUGE_START_NOT_BELOW_TARGET
  }
  return undefined
}

/**
 * 「現在値から」を選んだまま条件が変わり、使えなくなったときの選択欄エラーを返す。
 * 対象0件・現在値0・達成済みは選択を残したまま示し、「最初から」へは書き換えない。
 *
 * @param input - スタート位置の決め方と、プレビューから分かる現在値・達成状態・対象数。
 * @returns 選択欄の下に表示するメッセージ。問題なければ空文字。
 */
export const resolveGoalGaugeStartGroupErrorMessage = (
  input: GoalGaugeStartGroupErrorInput
): string => {
  if (input.gaugeStartMode !== 'current') return ''
  if (input.targetCount <= 0) return ERROR_MESSAGE_GAUGE_START_CURRENT_NO_TARGET
  if (!(input.currentGaugeStart > 0)) return ERROR_MESSAGE_GAUGE_START_CURRENT_NOT_POSITIVE
  if (input.achieved) return ERROR_MESSAGE_GAUGE_START_CURRENT_REACHED_TARGET
  return ''
}
