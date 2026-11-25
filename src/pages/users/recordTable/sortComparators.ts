/**
 * 未プレイをソート方向に関係なく末尾へ寄せ、プレイ済み同士は方向を反映して数値で比較する。
 *
 * @param left - 左側レコードの数値とプレイ状態。
 * @param right - 右側レコードの数値とプレイ状態。
 * @param direction - 昇順なら1、降順なら-1のソート方向係数。
 * @returns 未プレイを末尾固定にする数値列の比較結果。
 */
export const compareNumberWithUnplayedLast = (
  left: { isPlayed: boolean; value: number },
  right: { isPlayed: boolean; value: number },
  direction: 1 | -1
): number => {
  if (!left.isPlayed && !right.isPlayed) {
    return 0
  }

  if (!left.isPlayed) {
    return 1
  }

  if (!right.isPlayed) {
    return -1
  }

  return (left.value - right.value) * direction
}

/**
 * 未プレイまたは欠損値（null / undefined）をソート方向に関係なく末尾へ寄せ、有効値同士は方向を反映して数値で比較する。
 *
 * @param left - 左側レコードの数値とプレイ状態。
 * @param right - 右側レコードの数値とプレイ状態。
 * @param direction - 昇順なら1、降順なら-1のソート方向係数。
 * @returns 未プレイ・欠損値を末尾固定にする数値列の比較結果。
 */
export const compareNullableNumberWithMissingLast = (
  left: { isPlayed: boolean; value: number | null | undefined },
  right: { isPlayed: boolean; value: number | null | undefined },
  direction: 1 | -1
): number => {
  const leftMissing = !left.isPlayed || typeof left.value !== 'number'
  const rightMissing = !right.isPlayed || typeof right.value !== 'number'

  if (leftMissing && rightMissing) {
    return 0
  }

  if (leftMissing) {
    return 1
  }

  if (rightMissing) {
    return -1
  }

  return ((left.value as number) - (right.value as number)) * direction
}
