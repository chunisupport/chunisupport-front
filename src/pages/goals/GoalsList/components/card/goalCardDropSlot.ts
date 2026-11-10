/** 縦方向の位置計算に使う要素の上端と下端 */
export interface VerticalBounds {
  /** 上端の Y 座標（px） */
  top: number
  /** 下端の Y 座標（px） */
  bottom: number
}

/**
 * 縦並びの一覧でカードを移動先へドロップしたとき、元の位置から入る位置までの縦方向のずれを返す。
 *
 * 上へ移動する場合は移動先カードの上端に、下へ移動する場合は移動先カードの下端にそろう。
 * 移動先との間にあるカードがドラッグ中のカードの高さ分だけ詰まるため、高さが異なるカード同士でも
 * 実際の並び替え後の位置と一致する。
 *
 * @param source - ドラッグ中カードの元の位置。
 * @param target - 移動先カードの元の位置。
 * @returns ドロップ後に入る位置までのずれ（px）。下方向が正。
 */
export function computeDropSlotOffsetY(source: VerticalBounds, target: VerticalBounds): number {
  return target.top > source.top ? target.bottom - source.bottom : target.top - source.top
}
