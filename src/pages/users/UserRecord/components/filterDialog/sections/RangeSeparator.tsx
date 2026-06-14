import { WeightTilde } from 'lucide-solid'
import type { Component } from 'solid-js'

/** 範囲の開始側フィールドに使うスクリーンリーダー向け接尾辞。 */
export const RANGE_START_LABEL_SUFFIX = 'ここから'

/** 範囲の終了側フィールドに使うスクリーンリーダー向け接尾辞。 */
export const RANGE_END_LABEL_SUFFIX = 'ここまで'

/** 範囲区切りアイコンのアクセシビリティ用ラベル。 */
const RANGE_SEPARATOR_LABEL = '範囲'

/**
 * 範囲入力の左右フィールドをつなぐ区切りアイコンを表示する。
 *
 * @returns 範囲を表す装飾アイコン。
 */
const RangeSeparator: Component = () => (
  <div class="flex h-10 shrink-0 items-center justify-center self-end text-text-muted">
    <WeightTilde aria-hidden="true" class="h-5 w-5" />
    <span class="sr-only">{RANGE_SEPARATOR_LABEL}</span>
  </div>
)

export default RangeSeparator
