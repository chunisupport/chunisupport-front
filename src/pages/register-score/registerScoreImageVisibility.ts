import type { PlayerDataRecordChange } from '../../types/api'

/**
 * 更新差分を一時的な画像除外状態で識別するキーへ変換する。
 *
 * @param change - APIから返却された1件分の更新差分。
 * @returns 楽曲は種別・ID・難易度、コースは種別・ID・クラスで一意に識別するキー。
 */
export const createRegisterScoreChangeKey = (change: PlayerDataRecordChange): string =>
  change.record_type === 'course'
    ? `${change.record_type}:${change.idx}:${change.course_class}`
    : `${change.record_type}:${change.idx}:${change.diff}`

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

/**
 * カードを持つ更新差分セクションを、すべてのカードが除外された場合だけ画像から除外するか判定する。
 *
 * @param changes - セクションに表示中の更新差分。
 * @param excludedChangeKeys - 画像から除外する更新差分キー。
 * @returns カードが1枚以上あり、そのすべてが画像から除外されている場合はtrue。
 */
export const isRegisterScoreImageSectionExcluded = (
  changes: readonly PlayerDataRecordChange[],
  excludedChangeKeys: ReadonlySet<string>
): boolean =>
  changes.length > 0 &&
  !hasRegisterScoreImageChanges(changes, excludedChangeKeys, createRegisterScoreChangeKey)

/**
 * 画像除外キーの集合へ1件分の除外状態を反映した新しい集合を返す。
 *
 * @param current - 現在の画像除外キー。
 * @param key - 更新する更新差分のキー。
 * @param excluded - 画像から除外する場合はtrue。
 * @returns 元の集合を変更せずに更新した画像除外キー。
 */
export const updateRegisterScoreExcludedChangeKeys = (
  current: ReadonlySet<string>,
  key: string,
  excluded: boolean
): ReadonlySet<string> => {
  const next = new Set(current)
  if (excluded) {
    next.add(key)
  } else {
    next.delete(key)
  }
  return next
}
