import * as Tabs from '@kobalte/core/tabs'
import { ToggleGroup } from '@kobalte/core/toggle-group'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { NotificationDot } from './NotificationDot'

export type AppTabOption<TValue extends string> = {
  /** タブの値 */
  value: TValue
  /** タブに表示するラベル */
  label: JSX.Element
  /** タブを無効化するか */
  disabled?: boolean
  /** タブ右上に通知ドットを表示するか */
  hasNotificationDot?: boolean
}

type AppTabsBaseProps<TValue extends string> = {
  /** 表示するタブ選択肢 */
  options: readonly AppTabOption<TValue>[]
  /** 現在選択中のタブ値 */
  value?: TValue
  /** 非制御時の初期タブ値 */
  defaultValue?: TValue
  /** タブ変更時の通知先 */
  onChange?: (value: TValue) => void
  /** タブの内容 */
  children?: JSX.Element
  /** Tabs.Root に追加で適用する Tailwind クラス */
  class?: string
  /** Tabs.List に追加で適用する Tailwind クラス */
  listClass?: string
  /** Tabs.List を包む要素に適用する Tailwind クラス */
  listWrapperClass?: string
  /** Tabs.List と同じ行に追加表示する内容 */
  listAside?: JSX.Element
  /** Tabs.Trigger に追加で適用する Tailwind クラス */
  triggerClass?: string
  /** Tabs.List の末尾に追加表示する内容 */
  listAfter?: JSX.Element
}

type AppTabContentProps<TValue extends string> = {
  /** 対応するタブ値 */
  value: TValue
  /** 非選択時もDOMへ残すか */
  forceMount?: boolean
  /** Tabs.Content に追加で適用する Tailwind クラス */
  class?: string
  /** タブ内容 */
  children?: JSX.Element
}

type AppTabsListProps<TValue extends string> = Pick<
  AppTabsBaseProps<TValue>,
  'options' | 'listClass' | 'listWrapperClass' | 'listAside' | 'triggerClass' | 'listAfter'
> & {
  /** Tabs.List の既定クラス */
  defaultListClass: string
  /** Tabs.Trigger の既定クラス */
  defaultTriggerClass: string
}

type AppSegmentedToggleGroupProps<TValue extends string> = {
  /** 表示する単一選択の選択肢 */
  options: readonly AppTabOption<TValue>[]
  /** 現在選択中の値 */
  value: TValue
  /** 選択変更時の通知先 */
  onChange: (value: TValue) => void
  /** ToggleGroupへ追加で適用するTailwindクラス */
  class?: string
  /** ToggleGroup.Itemへ追加で適用するTailwindクラス */
  itemClass?: string
}

const SEGMENTED_TABS_LIST_CLASS = 'inline-flex gap-1 rounded-lg bg-surface-hover p-1'

const SEGMENTED_CONTROL_CLASS =
  'relative inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-action-secondary hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50'

const SEGMENTED_TABS_TRIGGER_CLASS = `${SEGMENTED_CONTROL_CLASS} data-selected:bg-action-primary data-selected:text-text-inverse data-selected:shadow-sm data-selected:hover:bg-action-primary data-selected:hover:text-text-inverse`

const SEGMENTED_TOGGLE_ITEM_CLASS = `${SEGMENTED_CONTROL_CLASS} data-pressed:bg-action-primary data-pressed:text-text-inverse data-pressed:shadow-sm data-pressed:hover:bg-action-primary data-pressed:hover:text-text-inverse`

const UNDERLINE_TABS_LIST_CLASS = 'flex gap-2 border-b border-border-strong'

const UNDERLINE_TABS_TRIGGER_CLASS =
  'relative rounded-t border-b-2 border-transparent px-3 py-1 text-sm text-text-muted transition-colors hover:border-action-primary hover:text-text data-selected:border-focus-ring data-selected:bg-bg data-selected:text-text data-selected:hover:border-focus-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * タブリストと任意の同列表示要素を描画する。
 *
 * @param props - タブ選択肢、リスト・トリガーのクラス、同列表示要素。
 * @returns Tabs.List、またはそれを包むツールバー。
 */
const AppTabsList = <TValue extends string>(props: AppTabsListProps<TValue>): JSX.Element => {
  const list = (
    <Tabs.List class={`${props.defaultListClass} ${props.listClass ?? ''}`}>
      <For each={props.options}>
        {(option) => (
          <Tabs.Trigger
            value={option.value}
            disabled={option.disabled}
            class={`${props.defaultTriggerClass} ${props.triggerClass ?? ''}`}
          >
            {option.label}
            <NotificationDot visible={option.hasNotificationDot === true} class="right-1 top-1" />
          </Tabs.Trigger>
        )}
      </For>
      {props.listAfter}
    </Tabs.List>
  )

  if (!props.listWrapperClass && !props.listAside) return list

  return (
    <div class={props.listWrapperClass}>
      {list}
      {props.listAside}
    </div>
  )
}

/**
 * 背景付きの segmented 形式タブを表示する。
 *
 * @param props - タブ選択肢、選択状態、変更ハンドラ、表示内容、追加クラス。
 * @returns Kobalte Tabs を使った segmented タブ。
 */
export const SegmentedTabs = <TValue extends string>(
  props: AppTabsBaseProps<TValue>
): JSX.Element => (
  <Tabs.Root
    value={props.value}
    defaultValue={props.defaultValue}
    onChange={(value) => props.onChange?.(value as TValue)}
    class={props.class}
  >
    <AppTabsList
      options={props.options}
      listClass={props.listClass}
      listWrapperClass={props.listWrapperClass}
      listAside={props.listAside}
      triggerClass={props.triggerClass}
      listAfter={props.listAfter}
      defaultListClass={SEGMENTED_TABS_LIST_CLASS}
      defaultTriggerClass={SEGMENTED_TABS_TRIGGER_CLASS}
    />
    {props.children}
  </Tabs.Root>
)

/**
 * タブと同じ外観の単一選択ToggleGroupを表示する。
 *
 * @param props - 選択肢、現在値、変更ハンドラ、追加クラス。
 * @returns Kobalte ToggleGroupを使った単一選択コントロール。
 */
export const SegmentedToggleGroup = <TValue extends string>(
  props: AppSegmentedToggleGroupProps<TValue>
): JSX.Element => (
  <ToggleGroup
    value={props.value}
    onChange={(value) => typeof value === 'string' && value && props.onChange(value as TValue)}
    class={`${SEGMENTED_TABS_LIST_CLASS} ${props.class ?? ''}`}
  >
    <For each={props.options}>
      {(option) => (
        <ToggleGroup.Item
          value={option.value}
          disabled={option.disabled}
          class={`${SEGMENTED_TOGGLE_ITEM_CLASS} ${props.itemClass ?? ''}`}
        >
          {option.label}
        </ToggleGroup.Item>
      )}
    </For>
  </ToggleGroup>
)

/**
 * ページ上部の下線形式タブを表示する。
 *
 * @param props - タブ選択肢、選択状態、変更ハンドラ、表示内容、追加クラス。
 * @returns Kobalte Tabs を使った underline タブ。
 */
export const UnderlineTabs = <TValue extends string>(
  props: AppTabsBaseProps<TValue>
): JSX.Element => (
  <Tabs.Root
    value={props.value}
    defaultValue={props.defaultValue}
    onChange={(value) => props.onChange?.(value as TValue)}
    class={props.class}
  >
    <AppTabsList
      options={props.options}
      listClass={props.listClass}
      listWrapperClass={props.listWrapperClass}
      listAside={props.listAside}
      triggerClass={props.triggerClass}
      listAfter={props.listAfter}
      defaultListClass={UNDERLINE_TABS_LIST_CLASS}
      defaultTriggerClass={UNDERLINE_TABS_TRIGGER_CLASS}
    />
    {props.children}
  </Tabs.Root>
)

/**
 * AppTabs 系コンポーネントで使うタブ内容を表示する。
 *
 * @param props - 対応タブ値、forceMount設定、追加クラス、表示内容。
 * @returns Kobalte Tabs.Content。
 */
export const AppTabContent = <TValue extends string>(
  props: AppTabContentProps<TValue>
): JSX.Element => (
  <Tabs.Content value={props.value} forceMount={props.forceMount} class={props.class}>
    {props.children}
  </Tabs.Content>
)
