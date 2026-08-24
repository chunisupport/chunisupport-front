import { NumberField } from '@kobalte/core/number-field'
import { TextField } from '@kobalte/core/text-field'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { AppSelect, type AppSelectProps } from './AppSelect'

/** 範囲の開始側フィールドに使うスクリーンリーダー向け接尾辞 */
export const RANGE_START_LABEL_SUFFIX = 'ここから'

/** 範囲の終了側フィールドに使うスクリーンリーダー向け接尾辞 */
export const RANGE_END_LABEL_SUFFIX = 'ここまで'

/** 範囲区切りアイコンのアクセシビリティ用ラベル */
const RANGE_SEPARATOR_LABEL = '範囲'

/** 範囲区切りとして画面に表示する文字 */
const RANGE_SEPARATOR_SYMBOL = '～'

/** 範囲入力の左右フィールド配置に使う共通グリッドクラス */
const RANGE_CONTROL_ROW_CLASS = 'grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2'

type RangeControlRowProps = {
  /** 左側に表示する範囲開始フィールド */
  start: JSX.Element
  /** 右側に表示する範囲終了フィールド */
  end: JSX.Element
  /** 追加で適用する Tailwind クラス */
  class?: string
}

type RangeNumberFieldProps = {
  /** 入力欄の id */
  id: string
  /** スクリーンリーダー向けラベル */
  label: JSX.Element
  /** 現在の入力値 */
  value: string
  /** 入力欄の min 属性 */
  min?: number
  /** 入力欄の max 属性 */
  max?: number
  /** 入力欄の step 属性 */
  step?: number
  /** 入力中の値変更を通知する処理 */
  onInput: (value: string) => void
  /** 入力確定時の値を通知する処理 */
  onCommit: (value: string) => void
}

type NumberRangeInputProps = {
  /** 入力欄の見出し */
  title?: JSX.Element
  /** 開始側の数値入力設定 */
  start: RangeNumberFieldProps
  /** 終了側の数値入力設定 */
  end: RangeNumberFieldProps
  /** NumberField に許可する入力文字 */
  allowedInput?: RegExp
  /** NumberField の既定 step */
  step?: number
  /** 入力値を表示フォーマットするか */
  format?: boolean
  /** 入力欄に適用する Tailwind クラス */
  inputClass: string
  /** エラーメッセージ */
  errorMessage?: JSX.Element
  /** 追加で適用する Tailwind クラス */
  class?: string
}

type RangeTextFieldProps = {
  /** 入力欄の id */
  id: string
  /** name 属性。未指定の場合は id を使う */
  name?: string
  /** スクリーンリーダー向けラベル */
  label: JSX.Element
  /** 現在の入力値 */
  value: string
  /** 入力モード */
  inputMode?: JSX.InputHTMLAttributes<HTMLInputElement>['inputMode']
  /** pattern 属性 */
  pattern?: string
  /** 入力欄を無効化するか */
  disabled?: boolean
  /** エラー状態として扱うか */
  invalid?: boolean
  /** TextField の変更通知 */
  onChange?: (value: string) => void
  /** Input の入力イベント通知 */
  onInput?: (value: string) => void
  /** 入力値を通知前に正規化する処理。null を返すと入力を無視する */
  normalizeInput?: (value: string) => string | null
  /** 入力確定時の値を通知する処理 */
  onCommit?: (value: string) => void
}

type TextRangeInputProps = {
  /** 入力欄の見出し */
  title?: JSX.Element
  /** 見出しに適用する Tailwind クラス */
  titleClass?: string
  /** 開始側のテキスト入力設定 */
  start: RangeTextFieldProps
  /** 終了側のテキスト入力設定 */
  end: RangeTextFieldProps
  /** 入力欄に適用する Tailwind クラス */
  inputClass: string
  /** エラーメッセージ */
  errorMessage?: JSX.Element
  /** 追加で適用する Tailwind クラス */
  class?: string
}

type SelectRangeEndpointProps<T> = {
  /** 現在選択されている値 */
  value: T
  /** スクリーンリーダー向けラベル */
  label: JSX.Element
  /** 選択値が変更されたときの通知先 */
  onChange: (value: T) => void
}

export type SelectRangeInputProps<T> = Pick<
  AppSelectProps<T>,
  | 'contentClass'
  | 'contentZIndexClass'
  | 'formatLabel'
  | 'itemClass'
  | 'listboxClass'
  | 'options'
  | 'placeholder'
  | 'triggerClass'
  | 'valueClass'
> & {
  /** 入力欄の見出し */
  title?: JSX.Element
  /** 開始側の Select 設定 */
  start: SelectRangeEndpointProps<T>
  /** 終了側の Select 設定 */
  end: SelectRangeEndpointProps<T>
  /** エラーメッセージ */
  errorMessage?: JSX.Element
  /** 追加で適用する Tailwind クラス */
  class?: string
}

/**
 * 範囲入力の左右フィールドをつなぐ区切り記号を表示する。
 *
 * @returns 範囲を表す装飾記号。
 */
export const RangeSeparator = (): JSX.Element => (
  <div class="flex h-10 shrink-0 items-center justify-center self-end text-lg font-medium leading-none text-text-muted">
    <span aria-hidden="true">{RANGE_SEPARATOR_SYMBOL}</span>
    <span class="sr-only">{RANGE_SEPARATOR_LABEL}</span>
  </div>
)

/**
 * 範囲入力の左右フィールドと区切り記号を同じレイアウトで表示する。
 *
 * @param props - 左右フィールドと追加クラス。
 * @returns 範囲入力用の横並びレイアウト。
 */
export const RangeControlRow = (props: RangeControlRowProps): JSX.Element => (
  <div class={`${RANGE_CONTROL_ROW_CLASS} ${props.class ?? ''}`}>
    <div class="min-w-0">{props.start}</div>
    <RangeSeparator />
    <div class="min-w-0">{props.end}</div>
  </div>
)

/**
 * 範囲入力の片側に表示する Kobalte NumberField を組み立てる。
 *
 * @param props - 数値入力欄の設定。
 * @returns 範囲入力用の数値フィールド。
 */
const RangeNumberField = (props: {
  field: RangeNumberFieldProps
  allowedInput?: RegExp
  format: boolean
  inputClass: string
  step?: number
}): JSX.Element => (
  <NumberField
    value={props.field.value}
    onChange={props.field.onInput}
    class="w-full"
    format={props.format}
    allowedInput={props.allowedInput}
    step={props.field.step ?? props.step}
  >
    <NumberField.Label class="sr-only">{props.field.label}</NumberField.Label>
    <NumberField.Input
      id={props.field.id}
      min={props.field.min}
      max={props.field.max}
      step={props.field.step ?? props.step}
      class={props.inputClass}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={(event) => props.field.onCommit(event.currentTarget.value)}
    />
  </NumberField>
)

/**
 * 数値の範囲入力欄を共通レイアウトで表示する。
 *
 * @param props - 見出し、左右の数値入力欄、入力制限、クラス設定。
 * @returns 数値範囲入力欄。
 */
export const NumberRangeInput = (props: NumberRangeInputProps): JSX.Element => (
  <div class={props.class}>
    <Show when={props.title}>
      {(title) => <div class="mb-1 text-sm font-medium">{title()}</div>}
    </Show>
    <RangeControlRow
      start={
        <RangeNumberField
          field={props.start}
          allowedInput={props.allowedInput}
          format={props.format ?? false}
          inputClass={props.inputClass}
          step={props.step}
        />
      }
      end={
        <RangeNumberField
          field={props.end}
          allowedInput={props.allowedInput}
          format={props.format ?? false}
          inputClass={props.inputClass}
          step={props.step}
        />
      }
    />
    <Show when={props.errorMessage}>
      {(errorMessage) => <p class="mt-1 text-xs text-danger">{errorMessage()}</p>}
    </Show>
  </div>
)

/**
 * 範囲入力の片側に表示する Kobalte TextField を組み立てる。
 *
 * @param props - テキスト入力欄の設定。
 * @returns 範囲入力用のテキストフィールド。
 */
const RangeTextField = (props: { field: RangeTextFieldProps; inputClass: string }): JSX.Element => (
  <TextField
    value={props.field.value}
    onChange={(value) => {
      if (props.field.onInput) return
      const normalizedValue = normalizeRangeTextFieldValue(props.field, value)
      if (normalizedValue !== null) props.field.onChange?.(normalizedValue)
    }}
    class="w-full"
  >
    <TextField.Label class="sr-only" for={props.field.id}>
      {props.field.label}
    </TextField.Label>
    <TextField.Input
      id={props.field.id}
      name={props.field.name ?? props.field.id}
      type="text"
      class={props.inputClass}
      value={props.field.value}
      inputMode={props.field.inputMode}
      pattern={props.field.pattern}
      autocomplete="off"
      disabled={props.field.disabled}
      aria-invalid={props.field.invalid ? 'true' : 'false'}
      onInput={(event) => {
        const normalizedValue = normalizeRangeTextFieldValue(props.field, event.currentTarget.value)
        if (normalizedValue !== null) {
          props.field.onInput?.(normalizedValue)
        }
      }}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={(event) => {
        const normalizedValue = normalizeRangeTextFieldValue(props.field, event.currentTarget.value)
        if (normalizedValue !== null) props.field.onCommit?.(normalizedValue)
      }}
    />
  </TextField>
)

/**
 * 範囲テキスト入力値をフィールド設定に応じて正規化する。
 *
 * @param field - 入力欄の設定。
 * @param value - 入力欄から受け取った文字列。
 * @returns 正規化後の入力値。不正な入力で更新しない場合は null。
 */
const normalizeRangeTextFieldValue = (field: RangeTextFieldProps, value: string): string | null =>
  field.normalizeInput ? field.normalizeInput(value) : value

/**
 * テキストの範囲入力欄を共通レイアウトで表示する。
 *
 * @param props - 見出し、左右のテキスト入力欄、エラー表示、クラス設定。
 * @returns テキスト範囲入力欄。
 */
export const TextRangeInput = (props: TextRangeInputProps): JSX.Element => (
  <div class={props.class}>
    <Show when={props.title}>
      {(title) => <div class={props.titleClass ?? 'mb-1 text-sm font-medium'}>{title()}</div>}
    </Show>
    <RangeControlRow
      start={<RangeTextField field={props.start} inputClass={props.inputClass} />}
      end={<RangeTextField field={props.end} inputClass={props.inputClass} />}
    />
    <Show when={props.errorMessage}>
      {(errorMessage) => <p class="mt-1 text-xs text-danger">{errorMessage()}</p>}
    </Show>
  </div>
)

/**
 * Select の範囲入力欄を共通レイアウトで表示する。
 *
 * @param props - 選択肢、左右の選択値、表示変換、クラス設定。
 * @returns Select 範囲入力欄。
 */
export const SelectRangeInput = <T,>(props: SelectRangeInputProps<T>): JSX.Element => (
  <div class={props.class}>
    <Show when={props.title}>
      {(title) => <div class="mb-1 text-sm font-medium">{title()}</div>}
    </Show>
    <RangeControlRow
      start={
        <AppSelect<T>
          options={props.options}
          value={props.start.value}
          onChange={(value) => {
            if (value !== null) props.start.onChange(value)
          }}
          rootClass="w-full"
          label={props.start.label}
          labelVariant="srOnly"
          placeholder={props.placeholder}
          formatLabel={props.formatLabel}
          triggerClass={props.triggerClass}
          valueClass={props.valueClass}
          itemClass={props.itemClass}
          contentClass={props.contentClass}
          contentZIndexClass={props.contentZIndexClass}
          listboxClass={props.listboxClass}
        />
      }
      end={
        <AppSelect<T>
          options={props.options}
          value={props.end.value}
          onChange={(value) => {
            if (value !== null) props.end.onChange(value)
          }}
          rootClass="w-full"
          label={props.end.label}
          labelVariant="srOnly"
          placeholder={props.placeholder}
          formatLabel={props.formatLabel}
          triggerClass={props.triggerClass}
          valueClass={props.valueClass}
          itemClass={props.itemClass}
          contentClass={props.contentClass}
          contentZIndexClass={props.contentZIndexClass}
          listboxClass={props.listboxClass}
        />
      }
    />
    <Show when={props.errorMessage}>
      {(errorMessage) => <p class="mt-1 text-xs text-danger">{errorMessage()}</p>}
    </Show>
  </div>
)
