import type { Component } from 'solid-js'
import { buildEmptyRatingSlotLabel } from '../UserProfileView.constants'

type Props = {
  /** 一覧内の0始まりインデックス */
  index: number
  /** 枠番号の大きさ。`normal` は UserRecordCard、`large` はレーティング画像の番号に揃える。 */
  size?: 'normal' | 'large'
}

/** 枠番号の大きさごとのクラス */
const SLOT_NUMBER_SIZE_CLASS = {
  normal: 'h-8 w-8 text-lg',
  large: 'h-11 w-11 text-2xl',
} as const

/**
 * レーティング対象の空き枠を薄いカード形式で表示する。
 *
 * @param props - 表示する空き枠の一覧内インデックスと番号の大きさ。
 * @returns 枠番号のみを示す非操作のプレースホルダーカード。
 */
export const UserRecordPlaceholderCard: Component<Props> = (props) => {
  /**
   * 表示する1始まりの枠番号を返す。
   *
   * @returns プレースホルダーカードの枠番号。
   */
  const slotNumber = () => props.index + 1

  return (
    <div class="relative h-16 select-none overflow-hidden border-y border-r border-border bg-surface opacity-50 before:absolute before:inset-y-0 before:left-0 before:w-2 before:bg-surface-hover">
      <span class="sr-only">{buildEmptyRatingSlotLabel(slotNumber())}</span>
      <div class="flex h-full items-center p-1.5 pl-4">
        <div
          class={`flex ${SLOT_NUMBER_SIZE_CLASS[props.size ?? 'normal']} items-center justify-center rounded-full bg-surface-hover font-oswald font-bold leading-none text-disabled-text`}
          aria-hidden="true"
        >
          {slotNumber()}
        </div>
      </div>
    </div>
  )
}
