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
  const leftValue = left.isPlayed ? left.value : -1
  const rightValue = right.isPlayed ? right.value : -1

  return leftValue - rightValue
}
