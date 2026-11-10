import type { Component } from 'solid-js'
import { buildEmptyRatingSlotLabel } from '../UserProfileView.constants'

type Props = {
  /** 一覧内の0始まりインデックス */
  index: number
}

/**
 * レーティング対象の空き枠を薄いカード形式で表示する。
 *
 * @param props - 表示する空き枠の一覧内インデックス。
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
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-hover font-oswald text-2xl font-bold leading-none text-disabled-text"
          aria-hidden="true"
        >
          {slotNumber()}
        </div>
      </div>
    </div>
  )
}
