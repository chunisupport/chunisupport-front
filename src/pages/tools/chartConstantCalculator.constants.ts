import type { ChartConstantLamp } from '../../utils/chartConstantCalculator'

/** 譜面定数計算機の表示文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const CHART_CONSTANT_CALCULATOR_COPY = {
  scoreLabel: 'スコア',
  overPowerChangeLabel: 'OVER POWER 増加幅',
  lampLabel: 'ランプ',
  resultLabel: '推定譜面定数',
  rawResultLabel: '逆算値',
} as const

export const CHART_CONSTANT_DEFAULTS = {
  score: '1009540',
  overPowerChange: '91.06',
  lamp: 'ALL_JUSTICE' as ChartConstantLamp,
} as const

export const CHART_CONSTANT_LAMP_OPTIONS: ReadonlyArray<{
  value: ChartConstantLamp
  label: string
}> = [
  { value: 'NONE', label: 'なし' },
  { value: 'FULL_COMBO', label: 'FULL COMBO' },
  { value: 'ALL_JUSTICE', label: 'ALL JUSTICE' },
  { value: 'ALL_JUSTICE_CRITICAL', label: 'ALL JUSTICE CRITICAL' },
]
