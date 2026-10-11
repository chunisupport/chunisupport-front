/** OVER POWER計算機の表示文言・初期値・補完選択肢。 */
export const OVER_POWER_CALCULATOR_COPY = {
  lockedSongsSettingsLabel: '未解禁楽曲設定',
  guestMessage: 'ログインして使用すると自動インポートされます。',
  unlockLockedSongsLabel: '未解禁設定曲を解禁扱いにする',
  lockedSongsButtonLabel: '未解禁曲',
  valueToPercentTitle: '数値→%',
  percentToValueTitle: '%→数値',
  maxLabel: '満点',
  currentLabel: '獲得値',
  addValueLabel: '加算値',
  addButtonLabel: '加算',
  targetPercentLabel: '目標%',
  requiredValueLabel: '必要獲得値',
  differenceLabel: '差分',
  borderTableTitle: 'ボーダー表',
  unplayedCalculatorTitle: '未プレイ除外計算',
  loginRequiredMessage: 'ログイン中のみ使用できます。',
  unplayedModeLabel: '未プレイの扱い',
  manualScoreLabel: '指定したスコアで埋める',
  manualScoreSuffix: '点',
  songCountSuffix: '曲',
  noPlayedAverageLabel: '平均なし',
} as const

/** ボーダー表の目標達成率。 */
export const BORDER_PERCENTS = [97.5, 99.0, 99.5] as const
/** 指定スコア補完の初期値。 */
export const DEFAULT_MANUAL_FILL_SCORE = '1007500'
/** 未プレイ補完の選択肢。 */
export const UNPLAYED_FILL_OPTIONS = [
  { value: 'none', label: '何もしない(現在の値)' },
  { value: 'remove', label: '存在を消す', description: '未プレイ分を獲得値と満点から除外' },
  { value: 'theoretical', label: '理論値で埋める' },
  { value: 'playedAverage', label: '既プレイ平均で埋める' },
  {
    value: 'targetConstAverage',
    label: '定数ごとの既プレイ平均で埋める',
    description: '同じ定数の既プレイ対象がなければ0点',
  },
  {
    value: 'targetConstRegressionAverage',
    label: '定数ごとの線形回帰で埋める',
    description: '定数別平均からスコアを推定',
  },
  { value: 'manual', label: '指定したスコアで埋める' },
] as const
