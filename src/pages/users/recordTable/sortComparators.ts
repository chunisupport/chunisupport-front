/**
 * 未プレイを0より低い数値として扱い、数値列の昇降順に従って比較する。
 *
 * @param left - 左側レコードの数値とプレイ状態。
 * @param right - 右側レコードの数値とプレイ状態。
 * @returns 数値列で利用する比較結果。
 */
export const compareNumberWithUnplayedBelowZero = (
  left: { isPlayed: boolean; value: number },
  right: { isPlayed: boolean; value: number }
): number => {
  if (!left.isPlayed && !right.isPlayed) {
    return 0
  }

  if (!left.isPlayed) {
    return -1
  }

  if (!right.isPlayed) {
    return 1
  }

  return left.value - right.value
}

/**
 * 未プレイをソート方向に関係なく末尾へ寄せ、プレイ済み同士は数値で比較する。
 *
 * @param left - 左側レコードの数値とプレイ状態。
 * @param right - 右側レコードの数値とプレイ状態。
 * @returns 未プレイを末尾固定にする数値列の比較結果。
 */
export const compareNumberWithUnplayedLast = (
  left: { isPlayed: boolean; value: number },
  right: { isPlayed: boolean; value: number }
): { comparison: number; skipDirection: boolean } => {
  if (!left.isPlayed && !right.isPlayed) {
    return { comparison: 0, skipDirection: true }
  }

  if (!left.isPlayed) {
    return { comparison: 1, skipDirection: true }
  }

  if (!right.isPlayed) {
    return { comparison: -1, skipDirection: true }
  }

  return { comparison: left.value - right.value, skipDirection: false }
}
