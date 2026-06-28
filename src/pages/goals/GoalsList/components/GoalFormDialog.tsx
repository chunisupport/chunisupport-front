import { Button } from '@kobalte/core/button'
import { Checkbox } from '@kobalte/core/checkbox'
import { Dialog } from '@kobalte/core/dialog'
import { NumberField } from '@kobalte/core/number-field'
import { RadioGroup } from '@kobalte/core/radio-group'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import MultiSelectDropdown from '../../../../components/common/MultiSelectDropdown.tsx'
import {
  CHART_CONST_DECIMAL_PLACES,
  CHART_CONST_MAX,
  CHART_CONST_MIN,
  SCORE_MIN,
} from '../../../../constants/chart.ts'
import type {
  GoalAchievementParams,
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../../types/api.ts'
import {
  getScoreRank,
  MAX_SCORE,
  SCORE_RANK_MIN_SCORES,
  SCORE_RANKS_ASC,
  type ScoreRank,
} from '../../../../utils/scoreRank.ts'
import { buildGoalTargetParam, type GoalTargetMode } from '../../utils/goalCountTarget.ts'
import {
  COMBO_LAMP_OPTIONS,
  HARD_LAMP_OPTIONS,
  resolveGoalAchievementTypeLabel,
} from '../../utils/goalForm.ts'
import type { GoalProgressResult } from '../../utils/goalProgress.ts'
import { buildGoalVersionOptions } from '../../utils/goalVersion.ts'
import {
  ERROR_MESSAGE_INVALID_COUNT_TARGET,
  GOAL_TITLE_MAX_LENGTH,
  LABEL_INVERT_DISPLAY,
  STEP3_DESCRIPTION,
} from './constants.ts'
import { GoalCardProgress } from './GoalCard.tsx'

type GoalRequest = GoalCreateRequest | GoalUpdateRequest

interface GoalFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialGoal?: GoalDTO
  masterData: MasterDataDTO
  versions: VersionDTO[]
  isSaving: boolean
  /** 保存APIから返されたエラーメッセージ。 */
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSave: (payload: GoalRequest) => Promise<void>
  resolveAllCount: (attributes: GoalAttributes) => number
  /** 対象条件に一致する譜面ごとの最大OVER POWER合計を解決する関数。 */
  resolveOverPowerChartMax: (attributes: GoalAttributes) => number
  /** フォーム入力中の目標内容から実レコードに基づく進捗を解決する関数。 */
  resolveDraftGoalProgress: (goal: GoalCreateRequest) => GoalProgressResult
}

interface GoalFilterCheckboxProps {
  label: string
  checked: boolean
  /** チェックボックスを操作不可にし、非対象状態として表示するか。 */
  disabled?: boolean
  onChange: (checked: boolean) => void
}

interface GoalTextFieldProps {
  label: string
  value: string
  maxLength?: number
  onChange: (value: string) => void
}

interface GoalNumberFieldProps {
  /** 入力欄の表示ラベル。 */
  label: string
  /** 入力欄に表示する数値文字列。 */
  value: string
  /** 入力欄の補足説明。 */
  description?: string
  /** 入力できる最小値。 */
  min?: number
  /** 入力できる最大値。 */
  max?: number
  /** 入力値の増減単位。 */
  step?: number
  /** 入力操作を無効化するか。 */
  disabled?: boolean
  /** 入力値が変更されたときの通知先。 */
  onChange: (value: string) => void
}

interface GoalDecimalTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

interface GoalSelectOption<TValue extends string> {
  value: TValue
  label: string
}

interface GoalSelectFieldProps<TValue extends string> {
  label: string
  value: TValue
  options: GoalSelectOption<TValue>[]
  onChange: (value: TValue) => void
}

interface GoalTargetModeRadioGroupProps<TValue extends string> {
  /** ラジオグループ全体の表示ラベル。 */
  label: string
  /** フォーム送信・アクセシビリティ用の名前。 */
  name: string
  /** 現在選択中の値。 */
  value: TValue
  /** 選択できる目標値指定方法。 */
  options: GoalSelectOption<TValue>[]
  /** 選択値が変更されたときの通知先。 */
  onChange: (value: TValue) => void
  /** 選択肢カード内へ追加表示する入力欄などの内容。 */
  renderOptionContent?: (option: GoalSelectOption<TValue>) => JSX.Element
}

type RankGoalValue = ScoreRank | 'THEORETICAL'

const GOAL_FILTER_CHECKBOX_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'
/**
 * 入力系コントロールのフォーカス表示を要素内側に収める共通スタイル。
 */
const GOAL_FIELD_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const GOAL_FIELD_INPUT_CLASS = `w-full rounded border border-border-strong bg-surface px-3 py-2 text-sm hover:border-input-border-hover ${GOAL_FIELD_FOCUS_CLASS}`
const GOAL_SELECT_ITEM_CLASS =
  'flex h-8 cursor-pointer items-center justify-between rounded px-2 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-action-primary data-highlighted:text-text-inverse'
const GOAL_SELECT_CONTENT_CLASS =
  'z-60 max-h-64 w-[--kb-select-content-width] overflow-y-auto rounded-md border border-border-strong bg-surface shadow-lg'
const GOAL_MULTI_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'
const GOAL_RADIO_CARD_BASE_CLASS =
  'rounded border px-3 py-2 text-sm text-text-muted hover:bg-surface-muted'
const GOAL_RADIO_CARD_UNCHECKED_CLASS = 'border-border-strong bg-surface'
const GOAL_RADIO_CARD_CHECKED_CLASS = 'border-action-primary bg-action-primary-muted'
const GOAL_RADIO_ITEM_CLASS = 'relative flex min-h-6 items-center gap-3'
const GOAL_RADIO_CONTROL_CLASS =
  'pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-input-bg data-[checked]:border-action-primary'
/**
 * スクロール可能な目標条件リストの共通スタイル。
 */
const GOAL_STEP_SECTION_CLASS = 'rounded-lg border border-border bg-surface-muted p-4'
const GOAL_STEP_BADGE_CLASS =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action-primary text-sm font-bold text-text-inverse'
const GOAL_STEP_TITLE_CLASS = 'text-base font-bold text-text'
const GOAL_STEP_DESCRIPTION_CLASS = 'text-sm text-text-muted'
/** 対象譜面数の表示ラベル。 */
const TARGET_CHART_COUNT_LABEL = '対象となる譜面数:'

const GOAL_ACHIEVEMENT_TYPE_DESCRIPTIONS = {
  rank_count: '指定ランク以上を達成した譜面数を目標にします。',
  score_count: '指定スコア以上を達成した譜面数を目標にします。',
  avg_score: '対象譜面の平均スコアを目標にします。',
  hardlamp_count: '指定ハードランプ以上を達成した譜面数を目標にします。',
  combolamp_count: 'FULL COMBO / ALL JUSTICE の達成数を目標にします。',
  total_score: '対象譜面のスコア合計を目標にします。',
  overpower_value: '対象譜面のOVER POWER合計値を目標にします。',
  overpower_percent: '対象譜面のOVER POWER達成率を目標にします。',
} as const satisfies Record<GoalAchievementType, string>

const COUNT_MODE_OPTIONS: GoalSelectOption<GoalTargetMode>[] = [
  { value: 'all', label: '条件に当てはまる譜面すべて' },
  { value: 'number', label: '目標値を指定' },
  { value: 'remaining', label: '最大値に対する残数' },
  { value: 'percent', label: '最大値に対する割合' },
]

const TOTAL_MODE_OPTIONS: GoalSelectOption<GoalTargetMode>[] = [
  { value: 'all', label: '理論値' },
  { value: 'number', label: '目標値を指定' },
  { value: 'remaining', label: '最大値に対する残数' },
  { value: 'percent', label: '最大値に対する割合' },
]

const HARD_LAMP_SELECT_OPTIONS: GoalSelectOption<'HRD' | 'BRV' | 'ABS' | 'CTS'>[] =
  HARD_LAMP_OPTIONS.map((lamp) => ({ value: lamp.value, label: lamp.label }))

const COMBO_LAMP_SELECT_OPTIONS: GoalSelectOption<'FC' | 'AJ'>[] = COMBO_LAMP_OPTIONS.map(
  (lamp) => ({ value: lamp.value, label: lamp.label })
)

const GOAL_ACHIEVEMENT_TYPES = [
  'rank_count',
  'score_count',
  'avg_score',
  'hardlamp_count',
  'combolamp_count',
  'total_score',
  'overpower_value',
  'overpower_percent',
] as const satisfies readonly GoalAchievementType[]
const HARD_LAMP_VALUES = ['HRD', 'BRV', 'ABS', 'CTS'] as const
const COMBO_LAMP_VALUES = ['FC', 'AJ'] as const
const MAX_OVERPOWER_PERCENT = 100
const OVERPOWER_TARGET_DECIMAL_PLACES = 3
const DECIMAL_INPUT_PATTERN = /^\d*(?:\.\d*)?$/
const DEFAULT_GOAL_ACHIEVEMENT_TYPE = 'rank_count' satisfies GoalAchievementType
const DEFAULT_TOTAL_GOAL_VALUE = '10'
const DEFAULT_TOTAL_SCORE_GOAL_VALUE = '1000000'
const DEFAULT_OVERPOWER_VALUE_GOAL_VALUE = '10'
const DEFAULT_OVERPOWER_PERCENT_GOAL_VALUE = '90'
const DEFAULT_RANK_GOAL = 'S' satisfies RankGoalValue
const THEORETICAL_RANK_GOAL = 'THEORETICAL' satisfies RankGoalValue
const SELECTABLE_SCORE_RANKS_DESC = [...SCORE_RANKS_ASC]
  .filter((scoreRank) => scoreRank !== 'D')
  .reverse()

const RANK_OPTIONS: GoalSelectOption<RankGoalValue>[] = [
  {
    value: THEORETICAL_RANK_GOAL,
    label: `理論値（${MAX_SCORE.toLocaleString('ja-JP')}）`,
  },
  ...SELECTABLE_SCORE_RANKS_DESC.map((scoreRank) => ({
    value: scoreRank,
    label: `${scoreRank}（${SCORE_RANK_MIN_SCORES[scoreRank].toLocaleString('ja-JP')}）`,
  })),
]

/**
 * 数値が指定した小数桁数以内か判定する。
 *
 * @param value - 判定対象の数値。
 * @param decimalPlaces - 許容する小数桁数。
 * @returns 許容範囲内ならtrue。
 */
const isWithinDecimalPlaces = (value: number, decimalPlaces: number): boolean => {
  const scale = 10 ** decimalPlaces
  return Math.abs(value * scale - Math.round(value * scale)) < Number.EPSILON * scale
}

/**
 * 数値入力値を指定範囲内に丸めた文字列へ変換する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @param min - 許容する最小値。
 * @param max - 許容する最大値。
 * @param format - 範囲外補正時の文字列フォーマット。
 * @returns 空文字または数値でない入力はそのまま、範囲外の数値は丸めた文字列。
 */
const clampNumericInput = (
  value: string,
  min: number,
  max: number,
  format: (value: number) => string
): string => {
  if (value === '') return value

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  if (parsed < min) return format(min)
  if (parsed > max) return format(max)
  return value
}

/**
 * ランク目標の選択値を保存用スコアへ変換する。
 *
 * @param value - ランク目標の選択値。
 * @returns APIへ送信するスコア目標値。
 */
const getRankGoalScore = (value: RankGoalValue): number =>
  value === THEORETICAL_RANK_GOAL ? MAX_SCORE : SCORE_RANK_MIN_SCORES[value]

/**
 * 保存済みスコアからランク目標の選択値を復元する。
 *
 * @param score - APIから返されたスコア目標値。
 * @returns ダイアログで選択するランク目標値。
 */
const getRankGoalValue = (score: number): RankGoalValue =>
  score >= MAX_SCORE ? THEORETICAL_RANK_GOAL : getScoreRank(score)

/**
 * 文字列が目標種別として扱える値か判定する。
 *
 * @param value - APIから受け取った目標種別コード。
 * @returns 目標種別として定義済みの値ならtrue。
 */
const isGoalAchievementType = (value: string): value is GoalAchievementType =>
  GOAL_ACHIEVEMENT_TYPES.includes(value as GoalAchievementType)

/**
 * 文字列がハードランプ目標の値か判定する。
 *
 * @param value - 成果パラメータ内のランプ値。
 * @returns ハードランプ目標で利用できる値ならtrue。
 */
const isHardLampValue = (value: string): value is 'HRD' | 'BRV' | 'ABS' | 'CTS' =>
  HARD_LAMP_VALUES.includes(value as 'HRD' | 'BRV' | 'ABS' | 'CTS')

/**
 * 文字列がコンボランプ目標の値か判定する。
 *
 * @param value - 成果パラメータ内のランプ値。
 * @returns コンボランプ目標で利用できる値ならtrue。
 */
const isComboLampValue = (value: string): value is 'FC' | 'AJ' =>
  COMBO_LAMP_VALUES.includes(value as 'FC' | 'AJ')

/**
 * 目標設定ダイアログで使う文字列入力欄を描画する。
 *
 * @param props - 表示ラベル、入力値、最大文字数、変更ハンドラ。
 * @returns Kobalte TextField を使った入力欄。
 */
const GoalTextField: Component<GoalTextFieldProps> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <Show when={props.label}>
      <TextField.Label class="mb-1 block text-text-muted">{props.label}</TextField.Label>
    </Show>
    <TextField.Input class={`${GOAL_FIELD_INPUT_CLASS} font-sans`} maxLength={props.maxLength} />
    <TextField.Description class="mt-1 text-xs text-text-subtle">
      {GOAL_TITLE_MAX_LENGTH}文字以内
    </TextField.Description>
  </TextField>
)

/**
 * 目標設定ダイアログで使う数値入力欄を描画する。
 *
 * @param props - 表示ラベル、入力値、補足説明、数値制約、無効状態、変更ハンドラ。
 * @returns Kobalte NumberField を使った入力欄。
 */
const GoalNumberField: Component<GoalNumberFieldProps> = (props) => (
  <NumberField
    class="block text-sm"
    value={props.value}
    onChange={props.onChange}
    disabled={props.disabled}
    format={false}
    allowedInput={/[0-9.]/}
    step={props.step ?? 1}
  >
    <NumberField.Label class="mb-1 block text-text-muted">{props.label}</NumberField.Label>
    <NumberField.Input
      class={`${GOAL_FIELD_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
    />
    <Show when={props.description}>
      <NumberField.Description class="mt-1 text-xs text-text-muted">
        {props.description}
      </NumberField.Description>
    </Show>
  </NumberField>
)

/**
 * 空欄を許可する小数入力欄を描画する。
 *
 * @param props - 表示ラベル、入力値、変更ハンドラ。
 * @returns Kobalte TextField を使った小数入力欄。
 */
const GoalDecimalTextField: Component<GoalDecimalTextFieldProps> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block text-text-muted">{props.label}</TextField.Label>
    <TextField.Input class={GOAL_FIELD_INPUT_CLASS} inputMode="decimal" pattern="[0-9.]*" />
  </TextField>
)

/**
 * 目標設定ダイアログで使う単一選択欄を描画する。
 *
 * @param props - 表示ラベル、選択値、選択肢、変更ハンドラ。
 * @returns Kobalte Select を使った単一選択欄。
 */
const GoalSelectField = <TValue extends string>(props: GoalSelectFieldProps<TValue>) => {
  const selectedOption = () => props.options.find((option) => option.value === props.value) ?? null

  return (
    <Select<GoalSelectOption<TValue>>
      class="block text-sm"
      options={props.options}
      optionValue="value"
      optionTextValue="label"
      value={selectedOption()}
      onChange={(option) => {
        if (option) {
          props.onChange(option.value)
        }
      }}
      placeholder="選択..."
      gutter={0}
      itemComponent={(itemProps) => (
        <Select.Item item={itemProps.item} class={GOAL_SELECT_ITEM_CLASS}>
          <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
          <Select.ItemIndicator class="inline-flex h-5 w-5 items-center justify-center">
            <Check class="h-4 w-4" />
          </Select.ItemIndicator>
        </Select.Item>
      )}
    >
      <Select.Label class="mb-1 block text-text-muted">{props.label}</Select.Label>
      <Select.Trigger
        class={`inline-flex w-full items-center justify-between rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover ${GOAL_FIELD_FOCUS_CLASS}`}
      >
        <Select.Value<
          GoalSelectOption<TValue>
        > class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
          {(state) => state.selectedOption()?.label}
        </Select.Value>
        <Select.Icon class="flex h-5 w-5 items-center justify-center text-text-subtle">
          <ChevronDown class="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class={GOAL_SELECT_CONTENT_CLASS}>
          <Select.Listbox />
        </Select.Content>
      </Select.Portal>
    </Select>
  )
}

/**
 * 目標設定ダイアログで使うフィルター用チェックボックスを描画する。
 *
 * @param props - 表示ラベル、選択状態、選択変更ハンドラ。
 * @returns Kobalte Checkbox を使ったチェックボックス要素。
 */
const GoalFilterCheckbox: Component<GoalFilterCheckboxProps> = (props) => (
  <Checkbox
    class="relative flex items-center gap-2 text-sm text-text-muted data-disabled:cursor-not-allowed data-disabled:opacity-45"
    checked={props.checked}
    disabled={props.disabled}
    onChange={props.onChange}
  >
    <Checkbox.Input style={{ left: '0', top: '0' }} />
    <Checkbox.Control class={GOAL_FILTER_CHECKBOX_CONTROL_CLASS}>
      <Checkbox.Indicator>
        <Check class="h-4 w-4" />
      </Checkbox.Indicator>
    </Checkbox.Control>
    <Checkbox.Label>{props.label}</Checkbox.Label>
  </Checkbox>
)

/**
 * 目標値の指定方法をラジオボタンで選択する欄を描画する。
 *
 * @param props - 表示ラベル、name属性、選択値、選択肢、変更ハンドラ、追加内容の描画関数。
 * @returns Kobalte RadioGroup を使った目標値指定方法の選択欄。
 */
const GoalTargetModeRadioGroup = <TValue extends string>(
  props: GoalTargetModeRadioGroupProps<TValue>
) => (
  <RadioGroup
    name={props.name}
    value={props.value}
    onChange={(value) => props.onChange(value as TValue)}
    class="space-y-2 text-sm"
  >
    <RadioGroup.Label class="block text-text-muted">{props.label}</RadioGroup.Label>
    <div class="space-y-2">
      <For each={props.options}>
        {(option) => (
          <div
            class={`${GOAL_RADIO_CARD_BASE_CLASS} ${
              props.value === option.value
                ? GOAL_RADIO_CARD_CHECKED_CLASS
                : GOAL_RADIO_CARD_UNCHECKED_CLASS
            }`}
          >
            <RadioGroup.Item value={option.value} class={GOAL_RADIO_ITEM_CLASS}>
              <RadioGroup.ItemInput class="peer" />
              <RadioGroup.ItemControl class={GOAL_RADIO_CONTROL_CLASS}>
                <RadioGroup.ItemIndicator class="h-2.5 w-2.5 rounded-full bg-action-primary" />
              </RadioGroup.ItemControl>
              <span class="pointer-events-none">{option.label}</span>
              <RadioGroup.ItemLabel class="absolute inset-0 cursor-pointer rounded focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring">
                <span class="sr-only">{option.label}</span>
              </RadioGroup.ItemLabel>
            </RadioGroup.Item>
            <Show when={props.renderOptionContent?.(option)}>
              {(content) => <div class="relative z-10 mt-3 pl-8">{content()}</div>}
            </Show>
          </div>
        )}
      </For>
    </div>
  </RadioGroup>
)

const isCountAchievementType = (type: GoalAchievementType): boolean =>
  type === 'score_count' ||
  type === 'rank_count' ||
  type === 'hardlamp_count' ||
  type === 'combolamp_count'

/**
 * 成果パラメータから有効な数値を取り出す。
 *
 * @param params - 目標種別ごとの成果パラメータ。
 * @param key - 取り出すパラメータ名。
 * @returns 数値が設定されていればその値、未指定ならundefined。
 */
const getOptionalNumberParam = (
  params: GoalDTO['achievement_params'],
  key: 'count' | 'total' | 'remaining' | 'percent'
): number | undefined => {
  const value = (params as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : undefined
}

/**
 * 保存済み成果パラメータからフォームの目標値指定方法を解決する。
 *
 * @param params - APIから取得した成果パラメータ。
 * @param absoluteKey - 絶対値指定に使うキー。
 * @returns 保存済みキーに対応する指定方法。
 */
const resolveGoalTargetMode = (
  params: GoalDTO['achievement_params'],
  absoluteKey: 'count' | 'total'
): GoalTargetMode => {
  if (getOptionalNumberParam(params, 'remaining') !== undefined) return 'remaining'
  if (getOptionalNumberParam(params, 'percent') !== undefined) return 'percent'
  if (getOptionalNumberParam(params, absoluteKey) !== undefined) return 'number'
  return 'all'
}

/**
 * 成果種別が動的な合計上限を利用できるか判定する。
 *
 * @param type - 判定対象の成果種別。
 * @returns 動的上限を選択できる成果種別ならtrue。
 */
const canUseDynamicTotalTarget = (type: GoalAchievementType): boolean =>
  type === 'total_score' || type === 'overpower_value'

/**
 * 目標種別ごとの目標値入力の初期値を取得する。
 *
 * @param type - 選択された目標種別。
 * @returns 目標値欄に設定する初期値文字列。
 */
const getDefaultTotalGoalValue = (type: GoalAchievementType): string =>
  type === 'total_score'
    ? DEFAULT_TOTAL_SCORE_GOAL_VALUE
    : type === 'overpower_value'
      ? DEFAULT_OVERPOWER_VALUE_GOAL_VALUE
      : type === 'overpower_percent'
        ? DEFAULT_OVERPOWER_PERCENT_GOAL_VALUE
        : DEFAULT_TOTAL_GOAL_VALUE

/**
 * API属性に保存された単一IDまたはID配列をフォーム用の文字列配列へ変換する。
 *
 * @param value - API属性に保存されたID指定。
 * @returns フォームのチェック状態として扱う文字列ID配列。
 */
const normalizeAttributeSelection = (value: number | number[] | undefined): string[] => {
  if (typeof value === 'number') return [String(value)]
  if (Array.isArray(value)) {
    return value
      .filter((item): item is number => Number.isInteger(item))
      .map((item) => String(item))
  }
  return []
}

/**
 * フォームの選択値をAPI属性で使う単一IDまたはID配列へ変換する。
 *
 * @param selectedValues - フォーム上で選択されている文字列ID配列。
 * @returns 選択値が1件なら単一数値、それ以外は数値配列。
 */
const parseAttributeSelection = (selectedValues: string[]): number | number[] => {
  const normalized = Array.from(new Set(selectedValues))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))

  if (normalized.length === 1) return normalized[0]
  return normalized
}

/**
 * マスタデータのID一覧をフォーム用の全選択値へ変換する。
 *
 * @param items - IDを持つマスタデータ一覧。
 * @returns 全項目を選択済みにする文字列ID配列。
 */
const buildAllIdSelections = (items: readonly { id: number }[]): string[] =>
  items.map((item) => String(item.id))

/**
 * 保存済み属性が未指定の場合だけ、現在の全選択値で補完する。
 *
 * @param value - API属性に保存されたID指定。
 * @param fallbackValues - 属性未指定時に使う全選択値。
 * @returns 編集フォームへ反映する選択値。
 */
const resolveInitialAttributeSelection = (
  value: number | number[] | undefined,
  fallbackValues: string[]
): string[] => (value === undefined ? fallbackValues : normalizeAttributeSelection(value))

/**
 * バージョン選択肢をフォーム用の全選択値へ変換する。
 *
 * @param options - 目標フォームで表示するバージョン選択肢。
 * @returns 全バージョンを選択済みにする値配列。
 */
const buildAllVersionSelections = (options: readonly GoalSelectOption<string>[]): string[] =>
  options.map((option) => option.value)

/**
 * チェックボックスの選択状態を更新する。
 *
 * @param current - 現在の選択値一覧。
 * @param value - 操作対象の選択値。
 * @param checked - チェック後の状態。
 * @returns 更新後の選択値一覧。
 */
const toggleSelection = (current: string[], value: string, checked: boolean): string[] => {
  if (checked) {
    return current.includes(value) ? current : [...current, value]
  }
  return current.filter((item) => item !== value)
}

/**
 * 目標の作成・編集に使う入力ダイアログを表示する。
 *
 * @param props - ダイアログの表示状態、初期値、マスタデータ、保存ハンドラ。
 * @returns 目標フォームダイアログの JSX 要素。
 */
const GoalFormDialog: Component<GoalFormDialogProps> = (props) => {
  const [title, setTitle] = createSignal('')
  const [achievementType, setAchievementType] = createSignal<GoalAchievementType>(
    DEFAULT_GOAL_ACHIEVEMENT_TYPE
  )
  const [score, setScore] = createSignal(String(getRankGoalScore(DEFAULT_RANK_GOAL)))
  const [rank, setRank] = createSignal<RankGoalValue>(DEFAULT_RANK_GOAL)
  const [count, setCount] = createSignal('1')
  const [countMode, setCountMode] = createSignal<GoalTargetMode>('all')
  const [total, setTotal] = createSignal(getDefaultTotalGoalValue(DEFAULT_GOAL_ACHIEVEMENT_TYPE))
  const [totalMode, setTotalMode] = createSignal<GoalTargetMode>('number')
  const [hardLamp, setHardLamp] = createSignal<'HRD' | 'BRV' | 'ABS' | 'CTS'>('HRD')
  const [comboLamp, setComboLamp] = createSignal<'FC' | 'AJ'>('FC')
  const [invert, setInvert] = createSignal(false)

  const [chartTargetMode, setChartTargetMode] = createSignal<'normal' | 'op_target'>('normal')
  const [diffs, setDiffs] = createSignal<string[]>([])
  const [constMin, setConstMin] = createSignal('')
  const [constMax, setConstMax] = createSignal('')
  const [genres, setGenres] = createSignal<string[]>([])
  const [versions, setVersions] = createSignal<string[]>([])

  const [errorMessage, setErrorMessage] = createSignal('')
  const displayErrorMessage = createMemo(() => errorMessage() || props.apiErrorMessage)
  const versionOptions = createMemo(() => buildGoalVersionOptions(props.versions))
  const allDifficultySelections = createMemo(() =>
    buildAllIdSelections(props.masterData.difficulties)
  )
  const allGenreSelections = createMemo(() => buildAllIdSelections(props.masterData.genres))
  const allVersionSelections = createMemo(() => buildAllVersionSelections(versionOptions()))
  const genreLabels = createMemo(() => props.masterData.genres.map((genre) => genre.name))
  const genreValueByLabel = createMemo(
    () => new Map(props.masterData.genres.map((genre) => [genre.name, String(genre.id)]))
  )
  const genreLabelByValue = createMemo(
    () => new Map(props.masterData.genres.map((genre) => [String(genre.id), genre.name]))
  )
  const selectedGenreLabels = createMemo(() =>
    genres().flatMap((value) => {
      const label = genreLabelByValue().get(value)
      return label ? [label] : []
    })
  )
  const versionLabels = createMemo(() => versionOptions().map((option) => option.label))
  const versionValueByLabel = createMemo(
    () => new Map(versionOptions().map((option) => [option.label, option.value]))
  )
  const versionLabelByValue = createMemo(
    () => new Map(versionOptions().map((option) => [option.value, option.label]))
  )
  const selectedVersionLabels = createMemo(() =>
    versions().flatMap((value) => {
      const label = versionLabelByValue().get(value)
      return label ? [label] : []
    })
  )
  const achievementTypeOptions = createMemo<GoalSelectOption<GoalAchievementType>[]>(() =>
    props.masterData.achievement_types
      .filter((item): item is typeof item & { code: GoalAchievementType } =>
        isGoalAchievementType(item.code)
      )
      .map((item) => ({
        value: item.code,
        label: resolveGoalAchievementTypeLabel(item.code, {
          locale: 'ja',
          fallbackLabel: item.label ?? item.name,
        }),
      }))
  )

  const getTotalScoreMax = (): number => props.resolveAllCount(getDraftAttributes()) * MAX_SCORE

  /**
   * 現在の対象条件から譜面別に見た総OVER POWER最大値を取得する。
   *
   * @returns 対象譜面ごとの最大OVER POWERを合計した値。
   */
  const getOverPowerChartMax = (): number => props.resolveOverPowerChartMax(getDraftAttributes())

  /**
   * 現在の目標種別で利用できる理論値を取得する。
   *
   * @param type - 現在選択中の目標種別。
   * @returns 対象条件や目標種別から決まる最大目標値。
   */
  const getTheoreticalTotal = (type: GoalAchievementType): number =>
    type === 'total_score'
      ? getTotalScoreMax()
      : type === 'overpower_value'
        ? getOverPowerChartMax()
        : 0

  /**
   * スコア入力値を有効なスコア範囲に丸めて保持する。
   *
   * @param value - 入力欄から受け取ったスコア文字列。
   * @returns なし。
   */
  const handleScoreChange = (value: string): void => {
    setScore(clampNumericInput(value, SCORE_MIN, MAX_SCORE, String))
  }

  /**
   * 譜面定数入力値を有効な定数範囲に丸めて保持する。
   *
   * @param setter - 更新対象の Signal setter。
   * @param value - 入力欄から受け取った譜面定数文字列。
   * @returns なし。
   */
  const handleMusicConstChange = (setter: (value: string) => void, value: string): void => {
    if (!DECIMAL_INPUT_PATTERN.test(value)) return

    setErrorMessage('')
    setter(
      clampNumericInput(value, CHART_CONST_MIN, CHART_CONST_MAX, (nextValue) =>
        nextValue.toFixed(CHART_CONST_DECIMAL_PLACES)
      )
    )
  }

  /**
   * 表示名で指定されたジャンルの選択状態を内部ID値へ変換して切り替える。
   *
   * @param label - GenreSection から受け取ったジャンル表示名。
   * @returns なし。
   */
  const handleToggleGenreLabel = (label: string): void => {
    const value = genreValueByLabel().get(label)
    if (!value) return
    setGenres((prev) => toggleSelection(prev, value, !prev.includes(value)))
  }

  /**
   * 表示名で指定されたバージョンの選択状態を内部番号値へ変換して切り替える。
   *
   * @param label - VersionSection から受け取ったバージョン表示名。
   * @returns なし。
   */
  const handleToggleVersionLabel = (label: string): void => {
    const value = versionValueByLabel().get(label)
    if (!value) return
    setVersions((prev) => toggleSelection(prev, value, !prev.includes(value)))
  }

  // ダイアログを開いたタイミングで作成・編集モードに応じた初期値へ同期するため。
  createEffect(() => {
    if (!props.open) return
    setErrorMessage('')

    const goal = props.initialGoal
    if (!goal) {
      setTitle('')
      setAchievementType(DEFAULT_GOAL_ACHIEVEMENT_TYPE)
      setScore(String(getRankGoalScore(DEFAULT_RANK_GOAL)))
      setRank(DEFAULT_RANK_GOAL)
      setCount('1')
      setCountMode('all')
      setTotal(getDefaultTotalGoalValue(DEFAULT_GOAL_ACHIEVEMENT_TYPE))
      setTotalMode('number')
      setHardLamp('HRD')
      setComboLamp('FC')
      setInvert(false)
      setChartTargetMode('normal')
      setDiffs(allDifficultySelections())
      setConstMin(String(CHART_CONST_MIN))
      setConstMax(String(CHART_CONST_MAX))
      setGenres(allGenreSelections())
      setVersions(allVersionSelections())
      return
    }

    setTitle(goal.title)
    setAchievementType(goal.achievement_type)
    if ('score' in goal.achievement_params) {
      setScore(String(goal.achievement_params.score))
      if (goal.achievement_type === 'rank_count') {
        setRank(getRankGoalValue(goal.achievement_params.score))
      }
    }
    const rawCount = getOptionalNumberParam(goal.achievement_params, 'count')
    const rawRemaining = getOptionalNumberParam(goal.achievement_params, 'remaining')
    const rawPercent = getOptionalNumberParam(goal.achievement_params, 'percent')
    const countTargetValue = rawCount ?? rawRemaining ?? rawPercent
    if (typeof countTargetValue === 'number') setCount(String(countTargetValue))
    const rawTotal = getOptionalNumberParam(goal.achievement_params, 'total')
    const totalTargetValue = rawTotal ?? rawRemaining ?? rawPercent
    if (typeof totalTargetValue === 'number') setTotal(String(totalTargetValue))
    if ('lamp' in goal.achievement_params && isHardLampValue(goal.achievement_params.lamp)) {
      setHardLamp(goal.achievement_params.lamp)
    }
    if ('lamp' in goal.achievement_params && isComboLampValue(goal.achievement_params.lamp)) {
      setComboLamp(goal.achievement_params.lamp)
    }
    setInvert(goal.invert)
    setChartTargetMode(goal.attributes.chart_target === 'OP_TARGET' ? 'op_target' : 'normal')
    setDiffs(resolveInitialAttributeSelection(goal.attributes.diff, allDifficultySelections()))
    setConstMin(
      typeof goal.attributes.const?.min === 'number'
        ? String(goal.attributes.const.min)
        : String(CHART_CONST_MIN)
    )
    setConstMax(
      typeof goal.attributes.const?.max === 'number'
        ? String(goal.attributes.const.max)
        : String(CHART_CONST_MAX)
    )
    setGenres(resolveInitialAttributeSelection(goal.attributes.genre, allGenreSelections()))
    setVersions(resolveInitialAttributeSelection(goal.attributes.ver, allVersionSelections()))

    if (isCountAchievementType(goal.achievement_type)) {
      setCountMode(resolveGoalTargetMode(goal.achievement_params, 'count'))
    } else {
      setCountMode('number')
    }
    setTotalMode(
      canUseDynamicTotalTarget(goal.achievement_type)
        ? resolveGoalTargetMode(goal.achievement_params, 'total')
        : 'number'
    )
  })

  const getDraftAttributes = (): GoalRequest['attributes'] => ({
    ...(chartTargetMode() === 'op_target' ? { chart_target: 'OP_TARGET' as const } : {}),
    ...(chartTargetMode() === 'normal' ? { diff: parseAttributeSelection(diffs()) } : {}),
    ...(constMin() || constMax()
      ? {
          const: {
            ...(constMin() ? { min: Number(constMin()) } : {}),
            ...(constMax() ? { max: Number(constMax()) } : {}),
          },
        }
      : {}),
    genre: parseAttributeSelection(genres()),
    ver: parseAttributeSelection(versions()),
  })

  /**
   * 現在のフォーム入力値から保存・プレビュー共通の成果パラメータを組み立てる。
   *
   * @param type - 現在選択中の目標種別。
   * @returns API送信値と同じ形の成果パラメータ。
   */
  const buildDraftAchievementParams = (type: GoalAchievementType): GoalAchievementParams => {
    const parsedScore = type === 'rank_count' ? getRankGoalScore(rank()) : Number(score())
    const targetCountParam = buildGoalTargetParam(countMode(), count(), 'count')
    const targetTotalParam = buildGoalTargetParam(totalMode(), total(), 'total')

    return type === 'score_count' || type === 'rank_count'
      ? {
          score: Math.floor(Number.isFinite(parsedScore) ? parsedScore : 0),
          ...targetCountParam,
        }
      : type === 'avg_score'
        ? { score: Math.floor(Number.isFinite(parsedScore) ? parsedScore : 0) }
        : type === 'hardlamp_count'
          ? {
              lamp: hardLamp(),
              ...targetCountParam,
            }
          : type === 'combolamp_count'
            ? {
                lamp: comboLamp(),
                ...targetCountParam,
              }
            : canUseDynamicTotalTarget(type)
              ? targetTotalParam
              : { total: Number.isFinite(Number(total())) ? Number(total()) : 0 }
  }

  /**
   * 現在の対象譜面条件に一致する件数を表示用テキストへ変換する。
   *
   * @returns 日本語ロケールで桁区切りした対象譜面数。
   */
  const targetCountText = (): string =>
    `${props.resolveAllCount(getDraftAttributes()).toLocaleString('ja-JP')} 譜面`

  /**
   * 理論値選択時に表示する目標値を組み立てる。
   *
   * @returns 目標種別に応じた総スコアまたはOVER POWERの理論値。
   */
  const theoreticalTotalText = (): string => {
    const currentType = achievementType()
    return getTheoreticalTotal(currentType).toLocaleString('ja-JP')
  }

  /**
   * 現在選択中の目標種別の説明文を取得する。
   *
   * @returns 目標種別ごとの説明テキスト。
   */
  const selectedAchievementDescription = (): string =>
    GOAL_ACHIEVEMENT_TYPE_DESCRIPTIONS[achievementType()]

  /**
   * プレビューカードに表示するタイトルを取得する。
   *
   * @returns 入力済みタイトル、未入力の場合は仮タイトル。
   */
  const previewTitle = (): string => title().trim() || '新しい目標'

  /**
   * プレビューカードに渡す進捗値を現在の入力内容から組み立てる。
   *
   * @returns 実際の目標カードと同じ表示計算に渡す進捗情報。
   */
  const previewProgress = createMemo<GoalProgressResult>(() => {
    const currentType = achievementType()
    const attributes = getDraftAttributes()
    return props.resolveDraftGoalProgress({
      title: previewTitle(),
      achievement_type: currentType,
      achievement_params: buildDraftAchievementParams(currentType),
      attributes,
      invert: invert(),
    })
  })

  /**
   * 件数入力で指定できる上限を表示用に組み立てる。
   *
   * @returns 日本語ロケールで桁区切りした件数上限表示。
   */
  const countLimitText = (): string =>
    countMode() === 'percent'
      ? '100%以内'
      : `${props.resolveAllCount(getDraftAttributes()).toLocaleString('ja-JP')}件以内`

  /**
   * 目標値入力で指定できる上限を表示用に組み立てる。
   *
   * @returns 目標種別に応じた上限表示。
   */
  const totalLimitText = (): string => {
    const currentType = achievementType()
    if (currentType === 'overpower_percent' || totalMode() === 'percent') return '100%以内'
    return `${getTheoreticalTotal(currentType).toLocaleString('ja-JP')}以内`
  }

  /**
   * 目標値入力欄に適用する最大値を取得する。
   *
   * @returns OVER POWER達成率では100、それ以外では未指定。
   */
  const totalFieldMax = (): number | undefined =>
    achievementType() === 'overpower_percent' || totalMode() === 'percent'
      ? MAX_OVERPOWER_PERCENT
      : undefined

  const handleSave = async () => {
    setErrorMessage('')
    const trimmed = title().trim()
    if (!trimmed) {
      setErrorMessage('タイトルを入力してください。')
      return
    }
    if (trimmed.length > GOAL_TITLE_MAX_LENGTH) {
      setErrorMessage(`タイトルは${GOAL_TITLE_MAX_LENGTH}文字以内で入力してください。`)
      return
    }

    const currentType = achievementType()
    const parsedScore = currentType === 'rank_count' ? getRankGoalScore(rank()) : Number(score())
    const parsedCount = Number(count())
    const parsedTotal =
      canUseDynamicTotalTarget(currentType) && totalMode() === 'all'
        ? getTheoreticalTotal(currentType)
        : Number(total())
    const parsedConstMin = constMin() === '' ? undefined : Number(constMin())
    const parsedConstMax = constMax() === '' ? undefined : Number(constMax())

    if (
      (currentType === 'score_count' ||
        currentType === 'rank_count' ||
        currentType === 'avg_score') &&
      (!Number.isFinite(parsedScore) || parsedScore < SCORE_MIN || parsedScore > MAX_SCORE)
    ) {
      setErrorMessage('スコアは 0 ～ 1,010,000 の範囲で入力してください。')
      return
    }

    const isCountType = isCountAchievementType(currentType)

    const attributes = getDraftAttributes()

    const allCount = props.resolveAllCount(attributes)

    if (isCountType && countMode() !== 'all') {
      const countMin = countMode() === 'number' ? 1 : 0
      const requiresInteger = countMode() !== 'percent'
      if (
        !Number.isFinite(parsedCount) ||
        (requiresInteger && !Number.isInteger(parsedCount)) ||
        parsedCount < countMin
      ) {
        const inputLabel = countMode() === 'percent' ? '割合' : '件数'
        setErrorMessage(
          `${inputLabel}は${countMin}以上の${requiresInteger ? '整数' : '数値'}で入力してください。`
        )
        return
      }
      const countMax = countMode() === 'percent' ? MAX_OVERPOWER_PERCENT : allCount
      if (parsedCount > countMax) {
        const unit = countMode() === 'percent' ? '%' : '件'
        setErrorMessage(
          `${countMode() === 'percent' ? '割合' : '件数'}は${countMax.toLocaleString('ja-JP')}${unit}以内で入力してください。`
        )
        return
      }
    }

    if (isCountType && countMode() === 'all' && allCount <= 0) {
      setErrorMessage('条件に当てはまる譜面がありません。条件を見直してください。')
      return
    }

    if (canUseDynamicTotalTarget(currentType) && totalMode() === 'all' && allCount <= 0) {
      setErrorMessage('条件に当てはまる譜面がありません。条件を見直してください。')
      return
    }

    if (
      (currentType === 'overpower_percent' ||
        (canUseDynamicTotalTarget(currentType) && totalMode() !== 'all')) &&
      (!Number.isFinite(parsedTotal) || parsedTotal < 0)
    ) {
      setErrorMessage('合計/割合の目標値は0以上で入力してください。')
      return
    }

    if (currentType === 'overpower_percent' && parsedTotal > MAX_OVERPOWER_PERCENT) {
      setErrorMessage('OVER POWER達成率は100%以下で入力してください。')
      return
    }

    if (
      currentType === 'total_score' &&
      (totalMode() === 'number' || totalMode() === 'remaining') &&
      !Number.isInteger(parsedTotal)
    ) {
      setErrorMessage('総スコアの目標値と残数は整数で入力してください。')
      return
    }

    if (
      currentType === 'overpower_value' &&
      totalMode() !== 'all' &&
      !isWithinDecimalPlaces(parsedTotal, OVERPOWER_TARGET_DECIMAL_PLACES)
    ) {
      setErrorMessage(
        `OVER POWERの目標値・残数・割合は小数第${OVERPOWER_TARGET_DECIMAL_PLACES}位以内で入力してください。`
      )
      return
    }

    const dynamicTotalMax = canUseDynamicTotalTarget(currentType)
      ? totalMode() === 'percent'
        ? MAX_OVERPOWER_PERCENT
        : totalMode() === 'all'
          ? undefined
          : getTheoreticalTotal(currentType)
      : undefined
    if (dynamicTotalMax !== undefined && parsedTotal > dynamicTotalMax) {
      const targetLabel = currentType === 'total_score' ? '総スコア目標' : 'OVER POWER合計目標'
      setErrorMessage(
        `${targetLabel}は最大 ${dynamicTotalMax.toLocaleString('ja-JP')} 以下で入力してください。`
      )
      return
    }

    if (
      (typeof parsedConstMin === 'number' && !Number.isFinite(parsedConstMin)) ||
      (typeof parsedConstMax === 'number' && !Number.isFinite(parsedConstMax))
    ) {
      setErrorMessage('定数範囲が不正です。')
      return
    }
    if (
      typeof parsedConstMin === 'number' &&
      typeof parsedConstMax === 'number' &&
      parsedConstMin > parsedConstMax
    ) {
      setErrorMessage('定数の最小値は最大値以下にしてください。')
      return
    }

    if (isCountType && countMode() === 'number' && parsedCount <= 0) {
      setErrorMessage(ERROR_MESSAGE_INVALID_COUNT_TARGET)
      return
    }

    const achievement_params = buildDraftAchievementParams(currentType)

    await props.onSave({
      title: trimmed,
      achievement_type: currentType,
      achievement_params,
      attributes,
      invert: invert(),
    })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-overlay z-40" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] select-none flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <Dialog.Title class="shrink-0 text-lg font-bold">
            {props.mode === 'create' ? '目標を作成' : '目標を編集'}
          </Dialog.Title>

          <div class="scrollbar-none mt-4 min-h-0 flex-1 basis-0 space-y-4 overflow-y-auto pr-1">
            <section class={GOAL_STEP_SECTION_CLASS}>
              <div class="mb-3 flex items-center gap-3">
                <span class={GOAL_STEP_BADGE_CLASS}>1</span>
                <div>
                  <h2 class={GOAL_STEP_TITLE_CLASS}>タイトル</h2>
                  <p class={GOAL_STEP_DESCRIPTION_CLASS}>表示名を設定します。</p>
                </div>
              </div>

              <GoalTextField
                label=""
                aria-label="タイトル"
                value={title()}
                maxLength={GOAL_TITLE_MAX_LENGTH}
                onChange={setTitle}
              />
            </section>

            <section class={GOAL_STEP_SECTION_CLASS}>
              <div class="mb-3 flex items-center gap-3">
                <span class={GOAL_STEP_BADGE_CLASS}>2</span>
                <div>
                  <h2 class={GOAL_STEP_TITLE_CLASS}>対象譜面</h2>
                  <p class={GOAL_STEP_DESCRIPTION_CLASS}>進捗を計算する譜面を絞り込みます。</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="mb-3 flex flex-wrap items-center justify-start gap-2 text-xs text-text-muted">
                  {TARGET_CHART_COUNT_LABEL} {targetCountText()}
                </div>
                <div class="grid grid-cols-1 gap-3">
                  <fieldset class="block text-sm space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="block text-text-muted">難易度</span>
                      <Button
                        type="button"
                        class="text-xs text-action-primary hover:text-action-primary"
                        onClick={() => {
                          setChartTargetMode('normal')
                          setDiffs([])
                        }}
                      >
                        クリア
                      </Button>
                    </div>
                    <div class="space-y-1 bg-surface rounded border border-border-strong px-3 py-2">
                      <GoalFilterCheckbox
                        label="OP対象 (MAS+ULT)"
                        checked={chartTargetMode() === 'op_target'}
                        onChange={(checked) => {
                          setChartTargetMode(checked ? 'op_target' : 'normal')
                          if (checked) {
                            setDiffs([])
                          }
                        }}
                      />
                      <For each={props.masterData.difficulties}>
                        {(item) => (
                          <GoalFilterCheckbox
                            label={item.name}
                            checked={
                              chartTargetMode() === 'normal' && diffs().includes(String(item.id))
                            }
                            disabled={chartTargetMode() === 'op_target'}
                            onChange={(checked) => {
                              setChartTargetMode('normal')
                              setDiffs((prev) => toggleSelection(prev, String(item.id), checked))
                            }}
                          />
                        )}
                      </For>
                    </div>
                  </fieldset>

                  <fieldset class="block space-y-1 text-sm">
                    <span class="block text-text-muted">ジャンル</span>
                    <MultiSelectDropdown
                      options={genreLabels()}
                      selected={selectedGenreLabels()}
                      placeholder="ジャンルを選択"
                      contentZIndexClass={GOAL_MULTI_SELECT_CONTENT_Z_INDEX_CLASS}
                      onToggle={handleToggleGenreLabel}
                      onSelectAll={() => setGenres(allGenreSelections())}
                      onClear={() => setGenres([])}
                    />
                  </fieldset>

                  <Show
                    when={versionLabels().length > 0}
                    fallback={
                      <div class="space-y-1 text-sm">
                        <span class="block text-text-muted">バージョン</span>
                        <p class="text-sm text-text-subtle">バージョンを取得できませんでした。</p>
                      </div>
                    }
                  >
                    <fieldset class="block space-y-1 text-sm">
                      <span class="block text-text-muted">バージョン</span>
                      <MultiSelectDropdown
                        options={versionLabels()}
                        selected={selectedVersionLabels()}
                        placeholder="バージョンを選択"
                        contentZIndexClass={GOAL_MULTI_SELECT_CONTENT_Z_INDEX_CLASS}
                        onToggle={handleToggleVersionLabel}
                        onSelectAll={() => setVersions(allVersionSelections())}
                        onClear={() => setVersions([])}
                      />
                    </fieldset>
                  </Show>

                  <div class="grid grid-cols-2 gap-2">
                    <GoalDecimalTextField
                      label="定数min"
                      value={constMin()}
                      onChange={(value) => handleMusicConstChange(setConstMin, value)}
                    />
                    <GoalDecimalTextField
                      label="定数max"
                      value={constMax()}
                      onChange={(value) => handleMusicConstChange(setConstMax, value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section class={GOAL_STEP_SECTION_CLASS}>
              <div class="mb-3 flex items-center gap-3">
                <span class={GOAL_STEP_BADGE_CLASS}>3</span>
                <div>
                  <h2 class={GOAL_STEP_TITLE_CLASS}>達成条件</h2>
                  <p class={GOAL_STEP_DESCRIPTION_CLASS}>{STEP3_DESCRIPTION}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="space-y-1">
                  <GoalSelectField
                    label="目標種別"
                    value={achievementType()}
                    options={achievementTypeOptions()}
                    onChange={(nextType) => {
                      setAchievementType(nextType)
                      setCountMode(isCountAchievementType(nextType) ? 'all' : 'number')
                      if (!canUseDynamicTotalTarget(nextType)) {
                        setTotalMode('number')
                      } else {
                        setTotalMode('all')
                      }
                      setTotal(getDefaultTotalGoalValue(nextType))
                      if (nextType === 'rank_count') {
                        setRank(DEFAULT_RANK_GOAL)
                        setScore(String(getRankGoalScore(DEFAULT_RANK_GOAL)))
                      }
                    }}
                  />
                  <p class="text-xs text-text-muted">{selectedAchievementDescription()}</p>
                </div>

                <Show
                  when={achievementType() === 'score_count' || achievementType() === 'avg_score'}
                >
                  <GoalNumberField
                    label="スコア目標"
                    value={score()}
                    min={SCORE_MIN}
                    max={MAX_SCORE}
                    onChange={handleScoreChange}
                  />
                </Show>

                <Show when={achievementType() === 'rank_count'}>
                  <GoalSelectField
                    label="ランク目標"
                    value={rank()}
                    options={RANK_OPTIONS}
                    onChange={(nextRank) => {
                      setRank(nextRank)
                      setScore(String(getRankGoalScore(nextRank)))
                    }}
                  />
                </Show>

                <Show when={achievementType() === 'hardlamp_count'}>
                  <GoalSelectField
                    label="ハードランプ"
                    value={hardLamp()}
                    options={HARD_LAMP_SELECT_OPTIONS}
                    onChange={setHardLamp}
                  />
                </Show>

                <Show when={achievementType() === 'combolamp_count'}>
                  <GoalSelectField
                    label="コンボランプ"
                    value={comboLamp()}
                    options={COMBO_LAMP_SELECT_OPTIONS}
                    onChange={setComboLamp}
                  />
                </Show>

                <Show
                  when={
                    achievementType() === 'score_count' ||
                    achievementType() === 'rank_count' ||
                    achievementType() === 'hardlamp_count' ||
                    achievementType() === 'combolamp_count'
                  }
                >
                  <div class="block text-sm">
                    <div class="space-y-3">
                      <GoalTargetModeRadioGroup
                        label="目標譜面数"
                        name="goal-count-mode"
                        value={countMode()}
                        options={COUNT_MODE_OPTIONS}
                        onChange={setCountMode}
                        renderOptionContent={(option) =>
                          option.value === countMode() ? (
                            option.value === 'all' ? (
                              <p class="-mt-3 text-xs leading-none text-text-muted">
                                {targetCountText()}
                              </p>
                            ) : (
                              <GoalNumberField
                                label=""
                                min={option.value === 'number' ? 1 : 0}
                                max={
                                  option.value === 'percent'
                                    ? MAX_OVERPOWER_PERCENT
                                    : props.resolveAllCount(getDraftAttributes())
                                }
                                value={count()}
                                description={countLimitText()}
                                onChange={setCount}
                              />
                            )
                          ) : null
                        }
                      />
                    </div>
                  </div>
                </Show>

                <Show
                  when={
                    achievementType() === 'total_score' ||
                    achievementType() === 'overpower_value' ||
                    achievementType() === 'overpower_percent'
                  }
                >
                  <div class="block text-sm">
                    <div class="space-y-2">
                      <Show
                        when={canUseDynamicTotalTarget(achievementType())}
                        fallback={
                          <GoalNumberField
                            label="目標値"
                            value={total()}
                            description={totalLimitText()}
                            min={0}
                            max={totalFieldMax()}
                            onChange={setTotal}
                          />
                        }
                      >
                        <div class="space-y-3">
                          <GoalTargetModeRadioGroup
                            label="目標値"
                            name="goal-total-mode"
                            value={totalMode()}
                            options={TOTAL_MODE_OPTIONS}
                            onChange={setTotalMode}
                            renderOptionContent={(option) =>
                              option.value === totalMode() ? (
                                option.value === 'all' ? (
                                  <p class="-mt-3 text-xs leading-none text-text-muted">
                                    {theoreticalTotalText()}
                                  </p>
                                ) : (
                                  <GoalNumberField
                                    label=""
                                    value={total()}
                                    description={totalLimitText()}
                                    min={0}
                                    max={totalFieldMax()}
                                    onChange={setTotal}
                                  />
                                )
                              ) : null
                            }
                          />
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                <div class="block text-sm">
                  <p class="mb-1 block text-text-muted">表示形式</p>
                  <Checkbox
                    class="relative flex items-center gap-2 text-sm text-text-muted"
                    checked={invert()}
                    onChange={setInvert}
                  >
                    <Checkbox.Input style={{ left: '0', top: '0' }} />
                    <Checkbox.Control class={GOAL_FILTER_CHECKBOX_CONTROL_CLASS}>
                      <Checkbox.Indicator>
                        <Check class="h-4 w-4" />
                      </Checkbox.Indicator>
                    </Checkbox.Control>
                    <Checkbox.Label>{LABEL_INVERT_DISPLAY}</Checkbox.Label>
                  </Checkbox>
                </div>

                <p class="mb-1 block text-text-muted text-sm">プレビュー</p>
                <article
                  class={`rounded-lg border p-4 shadow-sm ${
                    previewProgress().achieved
                      ? 'border-action-primary-border bg-action-primary-muted'
                      : 'border-border bg-surface'
                  }`}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h2 class="truncate font-sans text-lg font-bold text-text">
                        {previewTitle()}
                      </h2>
                    </div>
                  </div>
                  <GoalCardProgress
                    title={previewTitle()}
                    achievementType={achievementType()}
                    invert={invert()}
                    progress={previewProgress()}
                  />
                </article>
              </div>
            </section>
          </div>

          <div class="mt-6">
            <Show when={displayErrorMessage()}>
              <p class="text-sm text-danger -mt-4 mb-2">{displayErrorMessage()}</p>
            </Show>
            <div class="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                class="rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover"
                onClick={() => props.onOpenChange(false)}
                disabled={props.isSaving}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
                onClick={() => {
                  void handleSave()
                }}
                disabled={props.isSaving}
              >
                {props.isSaving ? '保存中...' : '保存する'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default GoalFormDialog
