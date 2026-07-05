import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { Show } from 'solid-js'

export type CheckboxFieldControlVariant = 'action' | 'success'
export type CheckboxFieldTextVariant = 'option' | 'choice'

type CheckboxFieldProps = {
  /** チェックボックスの input id。 */
  id?: string
  /** チェック状態。 */
  checked: boolean
  /** 表示ラベル。 */
  label?: JSX.Element
  /** ラベル下に表示する補足内容。 */
  description?: JSX.Element
  /** ラベル領域へ追加表示する任意の内容。 */
  extra?: JSX.Element
  /** ラベルがない場合に使うアクセシブル名。 */
  ariaLabel?: string
  /** 操作を無効化するか。 */
  disabled?: boolean
  /** チェック状態が変わったときの通知先。 */
  onChange: (checked: boolean) => void
  /** ルート要素に追加で適用する Tailwind クラス。 */
  class?: string
  /** hidden input に追加で適用する Tailwind クラス。 */
  inputClass?: string
  /** control に追加で適用する Tailwind クラス。 */
  controlClass?: string
  /** label、description、extra を包む要素に追加で適用する Tailwind クラス。 */
  bodyClass?: string
  /** label に追加で適用する Tailwind クラス。 */
  labelClass?: string
  /** description に追加で適用する Tailwind クラス。 */
  descriptionClass?: string
  /** extra に追加で適用する Tailwind クラス。 */
  extraClass?: string
  /** check アイコンに追加で適用する Tailwind クラス。 */
  indicatorClass?: string
  /** control の既定配色。 */
  controlVariant?: CheckboxFieldControlVariant
  /** ラベル領域の文字スタイル用途。 */
  textVariant?: CheckboxFieldTextVariant
}

const CHECKBOX_FIELD_ROOT_CLASS =
  'relative flex items-center gap-2 data-disabled:cursor-not-allowed data-disabled:opacity-60'

const CHECKBOX_FIELD_OPTION_TEXT_CLASS = 'text-sm text-text-muted'

const CHECKBOX_FIELD_LABEL_CLASS = 'min-w-0 leading-5'

const CHECKBOX_FIELD_BODY_CLASS = 'min-w-0'

const CHECKBOX_FIELD_DESCRIPTION_CLASS = 'mt-0.5 text-xs leading-5 text-text-subtle'

const CHECKBOX_FIELD_EXTRA_CLASS = 'mt-1'

const CHECKBOX_FIELD_ACTION_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'

const CHECKBOX_FIELD_SUCCESS_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-strong bg-surface text-success data-checked:border-success'

/**
 * control の既定スタイルを配色種別から取得する。
 *
 * @param variant - control の配色種別。
 * @returns Checkbox.Control に適用する Tailwind クラス。
 */
const getCheckboxFieldControlClass = (variant: CheckboxFieldControlVariant): string =>
  variant === 'success' ? CHECKBOX_FIELD_SUCCESS_CONTROL_CLASS : CHECKBOX_FIELD_ACTION_CONTROL_CLASS

/**
 * ラベル領域の既定文字スタイルを用途から取得する。
 *
 * @param variant - ラベル領域の文字スタイル用途。
 * @returns Checkbox.Root に適用する Tailwind クラス。
 */
const getCheckboxFieldTextClass = (variant: CheckboxFieldTextVariant): string =>
  variant === 'option' ? CHECKBOX_FIELD_OPTION_TEXT_CLASS : ''

/**
 * アプリ全体で使う Kobalte Checkbox ベースのチェック欄を表示する。
 *
 * @param props - チェック状態、ラベル、補足内容、無効状態、変更ハンドラ、スタイル設定。
 * @returns 共通スタイルを適用したチェックボックス。
 */
export const CheckboxField: Component<CheckboxFieldProps> = (props) => (
  <Checkbox
    checked={props.checked}
    disabled={props.disabled}
    onChange={props.onChange}
    aria-label={props.label ? undefined : props.ariaLabel}
    class={`${CHECKBOX_FIELD_ROOT_CLASS} ${getCheckboxFieldTextClass(
      props.textVariant ?? 'option'
    )} ${props.class ?? ''}`}
  >
    <Checkbox.Input id={props.id} class={props.inputClass} style={{ left: '0', top: '0' }} />
    <Checkbox.Control
      class={`${getCheckboxFieldControlClass(props.controlVariant ?? 'action')} ${
        props.controlClass ?? ''
      }`}
    >
      <Checkbox.Indicator>
        <Check class={props.indicatorClass ?? 'h-4 w-4'} aria-hidden="true" />
      </Checkbox.Indicator>
    </Checkbox.Control>
    <Show when={props.label || props.description || props.extra}>
      <div class={`${CHECKBOX_FIELD_BODY_CLASS} ${props.bodyClass ?? ''}`}>
        <Show when={props.label}>
          {(label) => (
            <Checkbox.Label
              class={`${CHECKBOX_FIELD_LABEL_CLASS} ${props.labelClass ?? ''}`}
              for={props.id}
            >
              {label()}
            </Checkbox.Label>
          )}
        </Show>
        <Show when={props.description}>
          {(description) => (
            <span class={`${CHECKBOX_FIELD_DESCRIPTION_CLASS} ${props.descriptionClass ?? ''}`}>
              {description()}
            </span>
          )}
        </Show>
        <Show when={props.extra}>
          {(extra) => (
            <span class={`${CHECKBOX_FIELD_EXTRA_CLASS} ${props.extraClass ?? ''}`}>{extra()}</span>
          )}
        </Show>
      </div>
    </Show>
  </Checkbox>
)
