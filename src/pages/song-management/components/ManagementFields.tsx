import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import { FormSelect } from '../../../components/common/AppSelect'
import { CheckboxField } from '../../../components/common/CheckboxField'
import type { MasterItemDTO } from '../../../types/api'

/** 楽曲管理画面の入力欄の共通クラス */
export const MANAGEMENT_INPUT_CLASS = 'w-full rounded border border-border-strong px-3 py-2'

/** 楽曲管理画面の自由入力テキスト欄のクラス */
export const MANAGEMENT_TEXT_INPUT_CLASS = `${MANAGEMENT_INPUT_CLASS} font-sans`

/** 楽曲管理画面の読み取り専用入力欄のクラス */
export const MANAGEMENT_READONLY_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface-hover px-3 py-2 text-text-muted'

type ManagementTextFieldProps = {
  label: string
  value: string | number
  class?: string
  inputClass?: string
  type?: 'text' | 'search' | 'number' | 'date'
  maxLength?: number
  min?: string
  max?: string
  disabled?: boolean
  placeholder?: string
  inputMode?: 'decimal'
  onInput?: (value: string) => void
}

type GenreSelectFieldProps = {
  label: string
  value: number | null
  genres: MasterItemDTO[]
  placeholder: string
  onChange: (value: number | null) => void
}

type ManagementCheckboxProps = {
  checked: boolean
  disabled?: boolean
  ariaLabel: string
  label?: string
  class?: string
  onChange: (checked: boolean) => void
}

/**
 * 楽曲管理画面で利用する Kobalte TextField ベースの入力欄を描画します。
 *
 * @param props 表示ラベル、入力値、入力制約、変更ハンドラを含むプロパティ
 * @returns Kobalte TextField を利用した入力欄
 */
export const ManagementTextField: Component<ManagementTextFieldProps> = (props) => (
  <TextField class={props.class ?? 'text-sm'} disabled={props.disabled}>
    <TextField.Label class="mb-1 block text-text-muted">{props.label}</TextField.Label>
    <TextField.Input
      type={props.type ?? 'text'}
      value={props.value}
      maxLength={props.maxLength}
      min={props.min}
      max={props.max}
      placeholder={props.placeholder}
      inputMode={props.inputMode}
      class={props.inputClass ?? MANAGEMENT_INPUT_CLASS}
      onInput={(event) => props.onInput?.(event.currentTarget.value)}
    />
  </TextField>
)

/**
 * 楽曲管理画面で利用するジャンル選択欄を描画します。
 *
 * @param props 表示ラベル、現在値、ジャンル候補、変更ハンドラを含むプロパティ
 * @returns 共通 FormSelect を利用したジャンル選択欄
 */
export const GenreSelectField: Component<GenreSelectFieldProps> = (props) => {
  const selectedGenre = () => props.genres.find((genre) => genre.id === props.value) ?? null

  return (
    <FormSelect<MasterItemDTO>
      rootClass="text-sm"
      label={props.label}
      options={props.genres}
      optionValue="id"
      optionTextValue="name"
      value={selectedGenre()}
      onChange={(genre: MasterItemDTO | null) => props.onChange(genre?.id ?? null)}
      placeholder={props.placeholder}
      contentZIndexClass="z-50"
      contentClass="max-h-[min(16rem,var(--kb-popper-content-available-height))] w-[--kb-popper-anchor-width]"
      formatLabel={(genre) => genre.name}
    />
  )
}

/**
 * 楽曲管理画面で利用する共通チェック欄を描画します。
 *
 * @param props 選択状態、無効状態、表示ラベル、アクセシブル名、変更ハンドラを含むプロパティ
 * @returns 共通 CheckboxField を利用したチェック欄
 */
export const ManagementCheckbox: Component<ManagementCheckboxProps> = (props) => (
  <CheckboxField
    checked={props.checked}
    disabled={props.disabled}
    onChange={props.onChange}
    ariaLabel={props.ariaLabel}
    class={props.class ?? 'relative inline-flex items-center gap-2'}
    controlClass="rounded data-disabled:opacity-50"
    indicatorClass="h-3.5 w-3.5"
    labelClass="text-sm text-text"
    label={props.label}
  />
)
