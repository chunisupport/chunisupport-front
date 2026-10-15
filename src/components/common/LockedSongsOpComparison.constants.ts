/** 未解禁楽曲設定ダイアログで公式値と計算値を見比べる表示の文言 */
export const LOCKED_SONGS_OP_COMPARISON_COPY = {
  disclosureLabel: '公式値との照合',
  official: '公式値',
  calculated: '計算値',
  kind: '種別',
  overPower: 'OP',
  overPowerPercent: 'OP%',
  matched: '一致',
  mismatched: '差異あり',
  missingValue: '-',
  guidance: {
    overPowerHigher: 'プレイ済みの未解禁楽曲があります',
    overPowerLower: 'プレイ済み・解禁済みの楽曲を未解禁に指定しています',
    overPowerPercentHigher: '解禁済み楽曲を未解禁設定しています',
    overPowerPercentLower: '未設定の未解禁曲があります',
  },
} as const
