import { Button } from '@kobalte/core/button'
import { RadioGroup } from '@kobalte/core/radio-group'
import { A } from '@solidjs/router'
import type { ComponentProps, JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

type KobalteButtonProps = ComponentProps<typeof Button>
type AnchorProps = ComponentProps<typeof A>

export type SelectableCardLayout = 'row' | 'block'
export type SelectableCardDensity = 'default' | 'compact'

type SelectableCardClassOptions = {
  /** カード内容の基本レイアウト。 */
  layout?: SelectableCardLayout
  /** カードの表示密度。 */
  density?: SelectableCardDensity
  /** 選択状態の見た目にするか。 */
  selected?: boolean
  /** 無効状態の見た目にするか。 */
  disabled?: boolean
  /** 危険操作向けの色調にするか。 */
  danger?: boolean
  /** 追加で適用する Tailwind クラス。 */
  class?: string
}

type SelectableCardContentProps = {
  /** 左側に表示するアイコンや装飾。 */
  icon?: JSX.Element
  /** カードの主ラベル。 */
  title: JSX.Element
  /** カードの補足説明。 */
  description?: JSX.Element
  /** タイトル行の右側に表示する補足要素。 */
  children?: JSX.Element
  /** 内容全体へ追加で適用する Tailwind クラス。 */
  contentClass?: string
  /** 主ラベルへ追加で適用する Tailwind クラス。 */
  titleClass?: string
  /** 補足説明へ追加で適用する Tailwind クラス。 */
  descriptionClass?: string
}

type SelectableCardBaseProps = SelectableCardContentProps & {
  /** 選択状態の見た目にするか。 */
  selected?: boolean
  /** 危険操作向けの色調にするか。 */
  danger?: boolean
  /** カード内容の基本レイアウト。 */
  layout?: SelectableCardLayout
  /** カードの表示密度。 */
  density?: SelectableCardDensity
  /** 追加で適用する Tailwind クラス。 */
  class?: string
}

export type SelectableCardButtonProps = Omit<KobalteButtonProps, 'class' | 'children'> &
  SelectableCardBaseProps

export type SelectableCardLinkProps = Omit<AnchorProps, 'class' | 'children'> &
  SelectableCardBaseProps & {
    /** リンク遷移を無効化するか。 */
    disabled?: boolean
  }

export type SelectableCardItemProps = SelectableCardBaseProps & {
  /** RadioGroup の選択値。 */
  value: string
  /** 選択肢を操作不可にするか。 */
  disabled?: boolean
  /** スクリーンリーダーへ渡す選択肢名。 */
  ariaLabel: string
  /** RadioGroup の hidden input へ追加で適用する Tailwind クラス。 */
  inputClass?: string
  /** ラジオ丸へ追加で適用する Tailwind クラス。 */
  controlClass?: string
  /** ラジオ丸の選択表示へ追加で適用する Tailwind クラス。 */
  indicatorClass?: string
  /** カード全面クリック用ラベルへ追加で適用する Tailwind クラス。 */
  labelClass?: string
}

const SELECTABLE_CARD_BASE_CLASS =
  'relative w-full rounded-lg border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-70 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70'

const SELECTABLE_CARD_LAYOUT_CLASS: Record<
  SelectableCardLayout,
  Record<SelectableCardDensity, string>
> = {
  row: {
    default: 'flex min-h-12 items-center gap-3 p-4',
    compact: 'flex min-h-6 items-center gap-3 px-3 py-2',
  },
  block: {
    default: 'block p-4',
    compact: 'block px-3 py-2',
  },
}

const SELECTABLE_CARD_DEFAULT_CLASS =
  'border-border bg-surface text-text hover:border-border-strong hover:bg-surface-muted'

const SELECTABLE_CARD_SELECTED_CLASS =
  'border-action-primary bg-action-primary-muted text-text hover:border-action-primary hover:bg-action-primary-muted'

const SELECTABLE_CARD_DANGER_CLASS = 'border-danger bg-surface text-danger hover:bg-danger-bg'

const SELECTABLE_CARD_DANGER_SELECTED_CLASS =
  'border-danger bg-danger-bg text-danger hover:border-danger hover:bg-danger-bg'

const SELECTABLE_CARD_DISABLED_CLASS =
  'cursor-not-allowed border-border bg-surface-muted opacity-70 hover:border-border hover:bg-surface-muted'

const SELECTABLE_CARD_CONTENT_CLASS = 'flex min-w-0 flex-1 flex-col gap-1'
const SELECTABLE_CARD_TITLE_ROW_CLASS = 'flex min-w-0 flex-wrap items-center gap-2'
const SELECTABLE_CARD_TITLE_CLASS = 'min-w-0 text-sm font-semibold text-text'
const SELECTABLE_CARD_DESCRIPTION_CLASS = 'text-xs text-text-muted'

const SELECTABLE_CARD_RADIO_CONTROL_CLASS =
  'pointer-events-none relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-input-bg data-[checked]:border-action-primary'

const SELECTABLE_CARD_RADIO_INDICATOR_CLASS = 'h-2.5 w-2.5 rounded-full bg-action-primary'

const SELECTABLE_CARD_LABEL_CLASS =
  'absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring'

/**
 * 選択式カード UI に適用する Tailwind クラスを返す。
 *
 * @param options - 選択状態、無効状態、危険色調、追加クラス。
 * @returns SelectableCardButton 系の見た目を再利用するためのクラス文字列。
 */
export const getSelectableCardButtonClass = (options: SelectableCardClassOptions): string => {
  const stateClass = options.danger
    ? options.selected
      ? SELECTABLE_CARD_DANGER_SELECTED_CLASS
      : SELECTABLE_CARD_DANGER_CLASS
    : options.selected
      ? SELECTABLE_CARD_SELECTED_CLASS
      : SELECTABLE_CARD_DEFAULT_CLASS

  return `${SELECTABLE_CARD_BASE_CLASS} ${
    SELECTABLE_CARD_LAYOUT_CLASS[options.layout ?? 'row'][options.density ?? 'default']
  } ${stateClass} ${options.disabled ? SELECTABLE_CARD_DISABLED_CLASS : ''} ${options.class ?? ''}`
}

/**
 * 選択式カード内のラベル、説明、補助要素を表示する。
 *
 * @param props - アイコン、タイトル、説明、追加要素、追加クラス。
 * @returns 選択式カード共通の内容レイアウト。
 */
const SelectableCardContent = (props: SelectableCardContentProps): JSX.Element => (
  <>
    <Show when={props.icon}>{(icon) => <span class="shrink-0">{icon()}</span>}</Show>
    <span class={`${SELECTABLE_CARD_CONTENT_CLASS} ${props.contentClass ?? ''}`}>
      <span class={SELECTABLE_CARD_TITLE_ROW_CLASS}>
        <span class={`${SELECTABLE_CARD_TITLE_CLASS} ${props.titleClass ?? ''}`}>
          {props.title}
        </span>
        {props.children}
      </span>
      <Show when={props.description}>
        {(description) => (
          <span class={`${SELECTABLE_CARD_DESCRIPTION_CLASS} ${props.descriptionClass ?? ''}`}>
            {description()}
          </span>
        )}
      </Show>
    </span>
  </>
)

/**
 * カード全体を押せる選択ボタンを表示する。
 *
 * @param props - 選択状態、色調、表示内容、Kobalte Button の属性。
 * @returns Kobalte Button を使ったカード型ボタン。
 */
export const SelectableCardButton = (props: SelectableCardButtonProps): JSX.Element => {
  const [local, buttonProps] = splitProps(props, [
    'selected',
    'danger',
    'layout',
    'density',
    'icon',
    'title',
    'description',
    'children',
    'contentClass',
    'titleClass',
    'descriptionClass',
    'class',
  ])

  return (
    <Button
      {...buttonProps}
      type={buttonProps.type ?? 'button'}
      aria-pressed={buttonProps['aria-pressed'] ?? local.selected}
      class={getSelectableCardButtonClass({
        selected: local.selected,
        disabled: buttonProps.disabled,
        danger: local.danger,
        layout: local.layout,
        density: local.density,
        class: local.class,
      })}
    >
      <SelectableCardContent
        icon={local.icon}
        title={local.title}
        description={local.description}
        contentClass={local.contentClass}
        titleClass={local.titleClass}
        descriptionClass={local.descriptionClass}
      >
        {local.children}
      </SelectableCardContent>
    </Button>
  )
}

/**
 * カード全体を押せるリンクを表示する。
 *
 * @param props - 無効状態、選択状態、表示内容、リンク属性。
 * @returns 有効時は Solid Router の A、無効時は span のカード。
 */
export const SelectableCardLink = (props: SelectableCardLinkProps): JSX.Element => {
  const [local, linkProps] = splitProps(props, [
    'selected',
    'disabled',
    'danger',
    'layout',
    'density',
    'icon',
    'title',
    'description',
    'children',
    'contentClass',
    'titleClass',
    'descriptionClass',
    'class',
  ])

  /**
   * リンクまたは無効表示のカード内コンテンツを生成する。
   *
   * @returns カード内に表示するアイコン、見出し、説明、子要素。
   */
  const renderContent = (): JSX.Element => (
    <SelectableCardContent
      icon={local.icon}
      title={local.title}
      description={local.description}
      contentClass={local.contentClass}
      titleClass={local.titleClass}
      descriptionClass={local.descriptionClass}
    >
      {local.children}
    </SelectableCardContent>
  )

  return (
    <Show
      when={!local.disabled}
      fallback={
        <span
          aria-disabled="true"
          class={getSelectableCardButtonClass({
            selected: local.selected,
            disabled: true,
            danger: local.danger,
            layout: local.layout,
            density: local.density,
            class: local.class,
          })}
        >
          {renderContent()}
        </span>
      }
    >
      <A
        {...linkProps}
        class={getSelectableCardButtonClass({
          selected: local.selected,
          danger: local.danger,
          layout: local.layout,
          density: local.density,
          class: local.class,
        })}
      >
        {renderContent()}
      </A>
    </Show>
  )
}

/**
 * RadioGroup の選択肢をカード全体で押せる UI として表示する。
 *
 * @param props - 選択肢値、アクセシブルラベル、表示内容、RadioGroup.Item の属性。
 * @returns Kobalte RadioGroup.Item を使ったカード型選択肢。
 */
export const SelectableCardItem = (props: SelectableCardItemProps): JSX.Element => {
  const [local] = splitProps(props, [
    'value',
    'disabled',
    'selected',
    'danger',
    'layout',
    'density',
    'icon',
    'title',
    'description',
    'children',
    'contentClass',
    'titleClass',
    'descriptionClass',
    'class',
    'ariaLabel',
    'inputClass',
    'controlClass',
    'indicatorClass',
    'labelClass',
  ])

  return (
    <RadioGroup.Item
      value={local.value}
      disabled={local.disabled}
      class={getSelectableCardButtonClass({
        selected: local.selected,
        disabled: local.disabled,
        danger: local.danger,
        layout: local.layout,
        density: local.density,
        class: `${
          local.danger
            ? 'data-[checked]:border-danger data-[checked]:bg-danger-bg'
            : 'data-[checked]:border-action-primary data-[checked]:bg-action-primary-muted'
        } ${local.class ?? ''}`,
      })}
    >
      <RadioGroup.ItemInput class={`peer ${local.inputClass ?? ''}`} />
      <RadioGroup.ItemControl
        class={`${SELECTABLE_CARD_RADIO_CONTROL_CLASS} ${local.controlClass ?? ''}`}
      >
        <RadioGroup.ItemIndicator
          class={`${SELECTABLE_CARD_RADIO_INDICATOR_CLASS} ${local.indicatorClass ?? ''}`}
        />
      </RadioGroup.ItemControl>
      <SelectableCardContent
        icon={local.icon}
        title={local.title}
        description={local.description}
        contentClass={`pointer-events-none relative z-10 ${local.contentClass ?? ''}`}
        titleClass={local.titleClass}
        descriptionClass={local.descriptionClass}
      >
        {local.children}
      </SelectableCardContent>
      <RadioGroup.ItemLabel class={`${SELECTABLE_CARD_LABEL_CLASS} ${local.labelClass ?? ''}`}>
        <span class="sr-only">{local.ariaLabel}</span>
      </RadioGroup.ItemLabel>
    </RadioGroup.Item>
  )
}
