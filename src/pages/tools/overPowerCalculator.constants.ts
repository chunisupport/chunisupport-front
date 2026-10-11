import { CALCULATOR_VALUE_DECIMALS } from '../../utils/overPowerCalculatorConstants'

/** OVER POWER計算機の表示文言。 */
export const OVER_POWER_CALCULATOR_COPY = {
  lockedSongsSettingsLabel: '未解禁楽曲設定',
  guestMessage: 'ログインして使用すると自動インポートされます。',
  unlockLockedSongsLabel: '未解禁設定曲を解禁扱いにする',
  valueToPercentTitle: '数値→%',
  percentToValueTitle: '%→数値',
  maxLabel: '満点',
  currentLabel: '獲得値',
  addValueLabel: '加算値',
  addButtonLabel: '加算',
  targetPercentLabel: '目標%',
  requiredValueLabel: '必要獲得値',
  differenceLabel: '差分',
  unplayedCalculatorTitle: '未プレイ補完計算',
  loginRequiredMessage: 'ログイン中のみ使用できます。',
  /**
   * 未プレイ曲数を含む補完選択欄のラベルを生成する。
   * @param count - 補完対象の未プレイ曲数。
   * @returns 選択欄の表示文言。
   */
  unplayedModeLabel: (count: number): string => `未プレイ(${count}曲)を以下のスコアで埋める`,
  manualScoreLabel: '指定スコア',
  manualScoreSuffix: '点',
  noPlayedAverageLabel: '平均なし',
  requiredChartCountTitle: '達成までの必要譜面数',
  chartConstantLabel: '譜面定数',
  requiredChartCountHint:
    '未プレイ譜面（獲得OP=0）を、指定定数・スコア・ランプで埋める場合の必要数です。',
  unavailableCountLabel: '—',
  unavailableCountHint: 'AJCは理論値のスコアでのみ成立します。',
  countSuffix: '譜面',
  percentSuffix: '%',
  ratioLabel: '獲得値 / 満点',
  requiredRatioLabel: '必要獲得値 / 満点',
} as const

/** ホームのプロフィールと同じ下線形式で切り替える計算機のタブ。 */
export const OVER_POWER_CALCULATOR_TABS = [
  { value: 'value', label: OVER_POWER_CALCULATOR_COPY.valueToPercentTitle },
  { value: 'percent', label: OVER_POWER_CALCULATOR_COPY.percentToValueTitle },
  { value: 'unplayed', label: OVER_POWER_CALCULATOR_COPY.unplayedCalculatorTitle },
] as const

/** 目標達成率のクイック入力ボタン。ラベルは指定された簡潔な表記を使う。 */
export const QUICK_TARGET_PERCENTS = [
  { value: 97.5, label: '97.5%' },
  { value: 99.0, label: '99.0%' },
  { value: 99.5, label: '99.5%' },
] as const
/** 固定小数入力の初期値。 */
export const DEFAULT_OVER_POWER_INPUT = (0).toFixed(CALCULATOR_VALUE_DECIMALS)
/** 指定スコア補完の初期値。 */
export const DEFAULT_MANUAL_FILL_SCORE = '1007500'
/** 必要譜面数を計算する譜面定数の初期値。 */
export const DEFAULT_REQUIRED_CHART_CONSTANT = '14.0'
/** 未プレイ補完の選択肢。 */
export const UNPLAYED_FILL_OPTIONS = [
  { value: 'none', label: '0点(=現在の値)' },
  { value: 'remove', label: 'そもそも存在を消す' },
  { value: 'theoretical', label: '理論値' },
  { value: 'playedAverage', label: '全曲既プレイ平均' },
  { value: 'targetConstAverage', label: '定数ごとの既プレイ平均' },
  { value: 'targetConstRegressionAverage', label: '定数ごとの線形回帰' },
  { value: 'manual', label: '指定スコア' },
] as const
