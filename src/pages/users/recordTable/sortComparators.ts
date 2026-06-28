/**
 * 未プレイのレコードをソート方向に関係なく末尾へ寄せる。
 *
 * @param leftPlayed - 左側レコードがプレイ済みかどうか。
 * @param rightPlayed - 右側レコードがプレイ済みかどうか。
 * @returns 未プレイ判定だけで順序が決まる場合は比較結果、両方プレイ済みの場合は null。
 */
export const compareUnplayedRecords = (
  leftPlayed: boolean,
  rightPlayed: boolean
): number | null => {
  if (!leftPlayed && !rightPlayed) {
    return 0
  }

  if (!leftPlayed) {
    return 1
  }

  if (!rightPlayed) {
    return -1
  }

  return null
}
