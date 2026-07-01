import { Button } from '@kobalte/core/button'
import { type JSX, Show } from 'solid-js'

export type SortDirection = 'asc' | 'desc' | null
type HeaderAlign = 'start' | 'center'

const SORT_ICON_WRAPPER_CLASS = 'inline-flex h-[3px] w-[18px] shrink-0 items-center justify-center'
const SORT_TRIANGLE_BASE_CLASS = 'h-0 w-0 border-x-[8px] border-x-transparent'
const HEADER_BUTTON_BASE_CLASS =
  'flex w-full items-center text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset'

type SortIndicatorProps = {
  /** 現在の列がソート対象かどうか。 */
  active: boolean
  /** 現在のソート方向。 */
  direction: SortDirection
}

export type SortableHeaderButtonProps = SortIndicatorProps & {
  /** ヘッダーに表示するラベル。 */
  label: string
  /** ヘッダー内容の配置。 */
  align?: HeaderAlign
  /** ボタンへ追加するクラス。 */
  class?: string
  /** ヘッダークリック時の処理。 */
  onClick: () => void
}

export type SortableTableHeaderCellProps = Omit<SortableHeaderButtonProps, 'class'> & {
  /** th要素へ追加するクラス。 */
  thClass?: string
  /** ヘッダーボタンへ追加するクラス。 */
  buttonClass?: string
}

/**
 * aria-sort用の値へソート状態を変換する。
 *
 * @param active - 対象列が現在ソート対象かどうか。
 * @param direction - 現在のソート方向。
 * @returns aria-sortへ渡すソート状態。
 */
export const getSortAriaValue = (
  active: boolean,
  direction: SortDirection
): 'ascending' | 'descending' | 'none' => {
  if (!active || !direction) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}

/**
 * 共通のソート方向インジケーターを表示する。
 *
 * @param props - ソート対象状態と方向。
 * @returns ソート状態に追従する昇順または降順の表示要素。
 */
export const SortIndicator = (props: SortIndicatorProps): JSX.Element => (
  <>
    <Show when={props.active && props.direction === 'asc'}>
      <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
        <span class={`${SORT_TRIANGLE_BASE_CLASS} border-b-[3px] border-b-danger`} />
      </span>
    </Show>
    <Show when={props.active && props.direction === 'desc'}>
      <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
        <span class={`${SORT_TRIANGLE_BASE_CLASS} border-t-[3px] border-t-info`} />
      </span>
    </Show>
  </>
)

/**
 * ソート操作可能な表ヘッダーボタンを表示する。
 *
 * @param props - ラベル、ソート状態、配置、クリック時の処理。
 * @returns ソート表示を含むヘッダーボタン。
 */
export const SortableHeaderButton = (props: SortableHeaderButtonProps): JSX.Element => (
  <Button
    type="button"
    class={`${HEADER_BUTTON_BASE_CLASS} ${props.class ?? ''}`}
    onClick={props.onClick}
  >
    <span
      class={`flex flex-col ${props.align === 'start' ? 'items-start' : 'items-center'} justify-center gap-0.5 leading-none`}
    >
      <span>{props.label}</span>
      <SortIndicator active={props.active} direction={props.direction} />
    </span>
  </Button>
)

/**
 * th要素とソートボタンをまとめて表示する。
 *
 * @param props - thとボタンのクラス、ラベル、ソート状態、クリック時の処理。
 * @returns aria-sort付きのソート可能な列ヘッダー。
 */
export const SortableTableHeaderCell = (props: SortableTableHeaderCellProps): JSX.Element => (
  <th class={props.thClass} scope="col" aria-sort={getSortAriaValue(props.active, props.direction)}>
    <SortableHeaderButton
      label={props.label}
      active={props.active}
      direction={props.direction}
      align={props.align}
      class={props.buttonClass}
      onClick={props.onClick}
    />
  </th>
)
