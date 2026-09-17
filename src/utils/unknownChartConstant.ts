/** 定数未判明フラグを持つ譜面またはレコード */
type ChartConstantUnknownFlag = {
  is_const_unknown: boolean
}

/** 現在OVER POWER集計対象フラグと定数未判明フラグを持つレコード */
type OverPowerUnknownFlag = ChartConstantUnknownFlag & {
  is_op_target: boolean
}

/**
 * 対象に定数未判明の譜面が含まれるか判定する。
 *
 * @param records - 判定対象の譜面またはレコード。
 * @returns 定数未判明の譜面を含む場合はtrue。
 */
export const hasUnknownChartConstants = (records: readonly ChartConstantUnknownFlag[]): boolean =>
  records.some((record) => record.is_const_unknown)

/**
 * 現在OVER POWER集計対象に定数未判明の譜面が含まれるか判定する。
 *
 * @param records - 判定対象のプレイヤーレコード。
 * @returns 現在OP対象に定数未判明の譜面を含む場合はtrue。
 */
export const hasUnknownOverPowerChartConstants = (
  records: readonly OverPowerUnknownFlag[]
): boolean => hasUnknownChartConstants(records.filter((record) => record.is_op_target))
