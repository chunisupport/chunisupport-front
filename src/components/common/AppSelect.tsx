import type { SelectRootItemComponentProps, SelectRootProps } from '@kobalte/core/select'
import { Select } from '@kobalte/core/select'
import { Check, ChevronDown, ChevronsUpDown } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { For, Show, splitProps } from 'solid-js'

type KobalteSingleSelectProps<T> = Omit<
  SelectRootProps<T>,
  | 'children'
  | 'class'
  | 'defaultValue'
  | 'fitViewport'
  | 'gutter'
  | 'itemComponent'
  | 'multiple'
  | 'onChange'
  | 'sameWidth'
  | 'value'
> & {
  /** 現在選択されている値。 */
  value?: T | null
  /** 非制御時に初期選択する値。 */
  defaultValue?: T
  /** 選択値が変更されたときの通知先。 */
  onChange?: (value: T | null) => void
}

type KobalteMultipleSelectProps<T> = Omit<
  SelectRootProps<T>,
  | 'children'
  | 'class'
  | 'defaultValue'
  | 'fitViewport'
  | 'gutter'
  | 'itemComponent'
  | 'multiple'
  | 'onChange'
  | 'placeholder'
  | 'sameWidth'
  | 'value'
> & {
  /** 現在選択されている値。 */
  value?: T[]
  /** 非制御時に初期選択する値。 */
  defaultValue?: T[]
  /** 選択値が変更されたときの通知先。 */
  onChange?: (value: T[]) => void
}

export type AppSelectLabelVariant = 'visible' | 'srOnly'

export type AppSelectProps<T> = KobalteSingleSelectProps<T> & {
  /** Select のルートに適用する Tailwind クラス。 */
  rootClass?: string
  /** 入力欄のラベル。 */
  label?: JSX.Element
  /** ラベルを表示するかスクリーンリーダー専用にするか。 */
  labelVariant?: AppSelectLabelVariant
  /** 補足説明として表示する内容。 */
  description?: JSX.Element
  /** エラーとして表示する内容。 */
  errorMessage?: JSX.Element
  /** 選択肢と選択中の値を表示用ラベルへ変換する処理。 */
  formatLabel?: (option: T) => JSX.Element
  /** Trigger に追加で適用する Tailwind クラス。 */
  triggerClass?: string
  /** Trigger に付与する id。 */
  triggerId?: string
  /** Value に追加で適用する Tailwind クラス。 */
  valueClass?: string
  /** Item に追加で適用する Tailwind クラス。 */
  itemClass?: string
  /** Content に追加で適用する Tailwind クラス。 */
  contentClass?: string
  /** Content の z-index を調整する Tailwind クラス。 */
  contentZIndexClass?: string
  /** Listbox に追加で適用する Tailwind クラス。 */
  listboxClass?: string
}

export type FormSelectProps<T> = Omit<AppSelectProps<T>, 'labelVariant'> & {
  /** フォーム項目として表示するラベル。 */
  label: JSX.Element
}

export type AppMultiSelectProps<T> = KobalteMultipleSelectProps<T> & {
  /** Select のルートに適用する Tailwind クラス。 */
  rootClass?: string
  /** 未選択時に表示するプレースホルダー。 */
  placeholder: JSX.Element
  /** 選択肢と選択中の値を表示用ラベルへ変換する処理。 */
  formatLabel: (option: T) => JSX.Element
  /** Trigger に追加で適用する Tailwind クラス。 */
  triggerClass?: string
  /** Trigger に付与する id。 */
  triggerId?: string
  /** Item に追加で適用する Tailwind クラス。 */
  itemClass?: string
  /** Content に追加で適用する Tailwind クラス。 */
  contentClass?: string
  /** Content の z-index を調整する Tailwind クラス。 */
  contentZIndexClass?: string
  /** Listbox に追加で適用する Tailwind クラス。 */
  listboxClass?: string
  /** トリガー内に表示する選択済み項目数の上限。 */
  selectedPreviewLimit?: number
}

const APP_SELECT_TRIGGER_CLASS =
  'grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

const APP_MULTI_SELECT_TRIGGER_CLASS =
  'flex w-full items-center rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

const APP_SELECT_VALUE_CLASS =
  'overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder'

const APP_SELECT_ITEM_CLASS =
  'flex h-8 cursor-pointer items-center justify-between rounded px-2 text-sm text-text outline-none hover:bg-success-bg data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-success-bg data-selected:bg-success-bg'

const APP_MULTI_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-sm text-text outline-none hover:bg-success-bg data-disabled:pointer-events-none data-disabled:opacity-50 data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'

const APP_SELECT_CONTENT_BASE_CLASS =
  'max-h-90 w-[--kb-select-content-width] overflow-y-auto rounded-md border border-border-strong bg-surface shadow-lg'

const DEFAULT_APP_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'

/**
 * 選択肢を既定の表示ラベルへ変換する。
 *
 * @param option - 表示対象の選択肢。
 * @returns Select 内に表示する文字列。
 */
const formatDefaultSelectLabel = <T,>(option: T): string => String(option)

/**
 * 単一選択 Select の選択肢表示を組み立てる。
 *
 * @param props - 選択肢と表示ラベル生成に使う設定。
 * @returns Kobalte Select.Item の JSX 要素。
 */
const renderAppSelectItem = <T,>(props: {
  item: SelectRootItemComponentProps<T>['item']
  formatLabel: (option: T) => JSX.Element
  itemClass?: string
}): JSX.Element => (
  <Select.Item item={props.item} class={`${APP_SELECT_ITEM_CLASS} ${props.itemClass ?? ''}`}>
    <Select.ItemLabel>{props.formatLabel(props.item.rawValue)}</Select.ItemLabel>
    <Select.ItemIndicator class="inline-flex h-5 w-5 items-center justify-center text-success">
      <Check class="h-4 w-4" />
    </Select.ItemIndicator>
  </Select.Item>
)

/**
 * 複数選択 Select の選択肢表示を組み立てる。
 *
 * @param props - 選択肢と表示ラベル生成に使う設定。
 * @returns Kobalte Select.Item の JSX 要素。
 */
const renderAppMultiSelectItem = <T,>(props: {
  item: SelectRootItemComponentProps<T>['item']
  formatLabel: (option: T) => JSX.Element
  itemClass?: string
}): JSX.Element => (
  <Select.Item item={props.item} class={`${APP_MULTI_SELECT_ITEM_CLASS} ${props.itemClass ?? ''}`}>
    <div class="flex items-center gap-2">
      <span class="inline-flex w-4 justify-center text-success">
        <Select.ItemIndicator>
          <Check class="h-3.5 w-3.5" />
        </Select.ItemIndicator>
      </span>
      <Select.ItemLabel>{props.formatLabel(props.item.rawValue)}</Select.ItemLabel>
    </div>
  </Select.Item>
)

/**
 * アプリ全体で使う単一選択 Select を表示する。
 *
 * @param props - 選択肢、選択値、ラベル、表示変換、Kobalte Select の属性。
 * @returns 共通スタイルを適用した Kobalte Select。
 */
export const AppSelect = <T,>(props: AppSelectProps<T>): JSX.Element => {
  const [local, selectProps] = splitProps(props, [
    'rootClass',
    'label',
    'labelVariant',
    'description',
    'errorMessage',
    'formatLabel',
    'triggerClass',
    'triggerId',
    'valueClass',
    'itemClass',
    'contentClass',
    'contentZIndexClass',
    'listboxClass',
  ])
  const formatLabel = (option: T): JSX.Element =>
    local.formatLabel?.(option) ?? formatDefaultSelectLabel(option)

  return (
    <Select<T>
      {...selectProps}
      class={local.rootClass}
      gutter={0}
      multiple={false}
      sameWidth
      fitViewport
      itemComponent={(itemProps) =>
        renderAppSelectItem({
          item: itemProps.item,
          formatLabel,
          itemClass: local.itemClass,
        })
      }
    >
      <Show when={local.label}>
        {(label) => (
          <Select.Label
            class={
              local.labelVariant === 'srOnly' ? 'sr-only' : 'mb-1 block text-sm text-text-muted'
            }
          >
            {label()}
          </Select.Label>
        )}
      </Show>
      <Select.Trigger
        id={local.triggerId}
        class={`${APP_SELECT_TRIGGER_CLASS} ${local.triggerClass ?? ''}`}
      >
        <Select.Value<T> class={`${APP_SELECT_VALUE_CLASS} ${local.valueClass ?? ''}`}>
          {(state) => {
            const selectedOption = state.selectedOption()
            return selectedOption === null ? undefined : formatLabel(selectedOption)
          }}
        </Select.Value>
        <Select.Icon class="flex h-5 w-5 items-center justify-center text-text-subtle">
          <ChevronDown class="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>
      <Show when={local.description}>
        {(description) => (
          <Select.Description class="mt-1 text-xs text-text-muted">
            {description()}
          </Select.Description>
        )}
      </Show>
      <Show when={local.errorMessage}>
        {(errorMessage) => (
          <Select.ErrorMessage class="mt-1 text-xs text-danger">
            {errorMessage()}
          </Select.ErrorMessage>
        )}
      </Show>
      <Select.Portal>
        <Select.Content
          class={`${local.contentZIndexClass ?? DEFAULT_APP_SELECT_CONTENT_Z_INDEX_CLASS} ${
            APP_SELECT_CONTENT_BASE_CLASS
          } ${local.contentClass ?? ''}`}
        >
          <Select.Listbox class={local.listboxClass} />
        </Select.Content>
      </Select.Portal>
    </Select>
  )
}

/**
 * フォーム項目として使う単一選択 Select を表示する。
 *
 * @param props - 表示ラベルを必須にした AppSelect の設定。
 * @returns ラベルを画面表示する AppSelect。
 */
export const FormSelect = <T,>(props: FormSelectProps<T>): JSX.Element => (
  <AppSelect<T> {...props} labelVariant="visible" />
)

/**
 * アプリ全体で使う複数選択 Select を表示する。
 *
 * @param props - 選択肢、選択値、表示変換、Kobalte Select の属性。
 * @returns 選択済み項目をチップ表示する Kobalte Select。
 */
export const AppMultiSelect = <T,>(props: AppMultiSelectProps<T>): JSX.Element => {
  const [local, selectProps] = splitProps(props, [
    'rootClass',
    'placeholder',
    'formatLabel',
    'triggerClass',
    'triggerId',
    'itemClass',
    'contentClass',
    'contentZIndexClass',
    'listboxClass',
    'selectedPreviewLimit',
  ])
  const selectedOptions = (): T[] => props.value ?? []
  const visibleSelectedOptions = (): T[] =>
    typeof local.selectedPreviewLimit === 'number'
      ? selectedOptions().slice(0, local.selectedPreviewLimit)
      : selectedOptions()
  const hiddenSelectedCount = (): number =>
    selectedOptions().length - visibleSelectedOptions().length

  return (
    <Select<T>
      {...selectProps}
      class={local.rootClass}
      gutter={0}
      multiple
      sameWidth
      fitViewport
      itemComponent={(itemProps) =>
        renderAppMultiSelectItem({
          item: itemProps.item,
          formatLabel: local.formatLabel,
          itemClass: local.itemClass,
        })
      }
    >
      <Select.Trigger
        id={local.triggerId}
        class={`${APP_MULTI_SELECT_TRIGGER_CLASS} ${local.triggerClass ?? ''}`}
      >
        <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
          <Show
            when={selectedOptions().length > 0}
            fallback={<span class="text-text-subtle">{local.placeholder}</span>}
          >
            <For each={visibleSelectedOptions()}>
              {(option) => (
                <span class="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                  {local.formatLabel(option)}
                </span>
              )}
            </For>
            <Show when={hiddenSelectedCount() > 0}>
              <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                +{hiddenSelectedCount()}
              </span>
            </Show>
          </Show>
        </div>
        <span class="text-text-subtle" aria-hidden="true">
          <ChevronsUpDown class="h-4 w-4" />
        </span>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          class={`${local.contentZIndexClass ?? DEFAULT_APP_SELECT_CONTENT_Z_INDEX_CLASS} ${
            APP_SELECT_CONTENT_BASE_CLASS
          } ${local.contentClass ?? ''}`}
        >
          <Select.Listbox class={local.listboxClass} />
        </Select.Content>
      </Select.Portal>
    </Select>
  )
}
