import type { PlayerDataDifficulty } from '../types/api'
import { isTheoreticalOverPowerTargetDifficulty } from './theoreticalOverPowerTarget'

/** 定数未判明フラグを持つ譜面またはレコード */
type ChartConstantUnknownFlag = {
  is_const_unknown: boolean
}

/** 現在OVER POWER集計対象フラグと定数未判明フラグを持つレコード */
type OverPowerUnknownFlag = ChartConstantUnknownFlag & {
  is_op_target: boolean
}

/** OVER POWER達成率の定数未判明判定に使うレコード */
type OverPowerPercentUnknownFlag = ChartConstantUnknownFlag & {
  id: string
  difficulty: PlayerDataDifficulty
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

/**
 * OVER POWER達成率の計算対象に定数未判明の譜面が含まれるか判定する。
 * 理論値OVER POWER対象譜面だけを見る。
 *
 * @param records - 判定対象のプレイヤーレコード。
 * @param targetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @returns 理論値OP対象譜面に定数未判明が含まれる場合はtrue。
 */
export const hasUnknownOverPowerPercentChartConstants = (
  records: readonly OverPowerPercentUnknownFlag[],
  targetDifficultyBySongId: ReadonlyMap<string, PlayerDataDifficulty>
): boolean =>
  hasUnknownChartConstants(
    records.filter((record) =>
      isTheoreticalOverPowerTargetDifficulty(
        targetDifficultyBySongId.get(record.id),
        record.difficulty
      )
    )
  )
