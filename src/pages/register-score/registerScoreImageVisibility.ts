import type { PlayerDataRecordChange } from '../../types/api'

/**
 * 更新差分セクションに画像へ含めるカードが残っているか判定する。
 *
 * @param changes - セクションに属する更新差分。
 * @param excludedChangeKeys - 画像から除外する更新差分キー。
 * @param resolveChangeKey - 更新差分から一意キーを生成する関数。
 * @returns 画像へ含めるカードが1枚以上ある場合はtrue。
 */
export const hasRegisterScoreImageChanges = (
  changes: readonly PlayerDataRecordChange[],
  excludedChangeKeys: ReadonlySet<string>,
  resolveChangeKey: (change: PlayerDataRecordChange) => string
): boolean => changes.some((change) => !excludedChangeKeys.has(resolveChangeKey(change)))
