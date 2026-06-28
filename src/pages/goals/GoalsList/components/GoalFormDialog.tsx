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
import MultiSelectDropdown from '../../../../components/common/MultiSelectDropdown'
import {
  CHART_CONST_DECIMAL_PLACES,
  CHART_CONST_MAX,
  CHART_CONST_MIN,
  SCORE_MIN,
} from '../../../../constants/chart'
import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../../types/api'
import { MAX_SCORE, SCORE_RANK_MIN_SCORES, SCORE_RANKS_ASC } from '../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../utils/goalCountTarget'
import { resolveGoalAchievementTypeLabel } from '../../utils/goalForm'
import {
  COMBO_LAMP_OPTIONS,
  type ComboLampGoalValue,
  HARD_LAMP_OPTIONS,
  type HardLampGoalValue,
} from '../../utils/goalLamp'
import type { GoalProgressResult } from '../../utils/goalProgress'
import { buildGoalVersionOptions } from '../../utils/goalVersion'
import { GOAL_TITLE_MAX_LENGTH, LABEL_INVERT_DISPLAY, STEP3_DESCRIPTION } from './constants'
import { GoalCardProgress } from './GoalCard'
import {
  buildAllIdSelections,
  buildAllVersionSelections,
  buildGoalFormAchievementParams,
  buildGoalFormAttributes,
  canUseDynamicTotalTarget,
  createGoalFormInitialState,
  DEFAULT_GOAL_ACHIEVEMENT_TYPE,
  DEFAULT_RANK_GOAL,
  type GoalChartTargetMode,
  type GoalFormAchievementParamsInput,
  getDefaultTotalGoalValue,
  getRankGoalScore,
  isCountAchievementType,
  type RankGoalValue,
  THEORETICAL_RANK_GOAL,
  toggleSelection,
} from './goalFormModel'
import { validateGoalForm } from './goalFormValidation'

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

const HARD_LAMP_SELECT_OPTIONS: GoalSelectOption<HardLampGoalValue>[] = HARD_LAMP_OPTIONS.map(
  (lamp) => ({ value: lamp.value, label: lamp.label })
)

const COMBO_LAMP_SELECT_OPTIONS: GoalSelectOption<ComboLampGoalValue>[] = COMBO_LAMP_OPTIONS.map(
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
const MAX_OVERPOWER_PERCENT = 100
const DECIMAL_INPUT_PATTERN = /^\d*(?:\.\d*)?$/
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
 * 文字列が目標種別として扱える値か判定する。
 *
 * @param value - APIから受け取った目標種別コード。
 * @returns 目標種別として定義済みの値ならtrue。
 */
const isGoalAchievementType = (value: string): value is GoalAchievementType =>
  GOAL_ACHIEVEMENT_TYPES.includes(value as GoalAchievementType)

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
  const [hardLamp, setHardLamp] = createSignal<HardLampGoalValue>('HRD')
  const [comboLamp, setComboLamp] = createSignal<ComboLampGoalValue>('FC')
  const [invert, setInvert] = createSignal(false)

  const [chartTargetMode, setChartTargetMode] = createSignal<GoalChartTargetMode>('normal')
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

    const nextState = createGoalFormInitialState(props.initialGoal, {
      allDifficultySelections: allDifficultySelections(),
      allGenreSelections: allGenreSelections(),
      allVersionSelections: allVersionSelections(),
    })

    setTitle(nextState.title)
    setAchievementType(nextState.achievementType)
    setScore(nextState.score)
    setRank(nextState.rank)
    setCount(nextState.count)
    setCountMode(nextState.countMode)
    setTotal(nextState.total)
    setTotalMode(nextState.totalMode)
    setHardLamp(nextState.hardLamp)
    setComboLamp(nextState.comboLamp)
    setInvert(nextState.invert)
    setChartTargetMode(nextState.chartTargetMode)
    setDiffs(nextState.diffs)
    setConstMin(nextState.constMin)
    setConstMax(nextState.constMax)
    setGenres(nextState.genres)
    setVersions(nextState.versions)
  })

  const getDraftAttributes = (): GoalRequest['attributes'] =>
    buildGoalFormAttributes({
      chartTargetMode: chartTargetMode(),
      diffs: diffs(),
      constMin: constMin(),
      constMax: constMax(),
      genres: genres(),
      versions: versions(),
    })

  /**
   * 現在のフォーム入力値から成果パラメータ作成用の入力値を集める。
   *
   * @param type - 現在選択中の目標種別。
   * @returns 成果パラメータ作成関数へ渡すフォーム値。
   */
  const getAchievementParamsInput = (
    type: GoalAchievementType
  ): GoalFormAchievementParamsInput => ({
    achievementType: type,
    score: score(),
    rank: rank(),
    count: count(),
    countMode: countMode(),
    total: total(),
    totalMode: totalMode(),
    hardLamp: hardLamp(),
    comboLamp: comboLamp(),
  })

  /**
   * 現在のフォーム入力値から保存・プレビュー共通の成果パラメータを組み立てる。
   *
   * @param type - 現在選択中の目標種別。
   * @returns API送信値と同じ形の成果パラメータ。
   */
  const buildDraftAchievementParams = (type: GoalAchievementType) =>
    buildGoalFormAchievementParams(getAchievementParamsInput(type))

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
    const currentType = achievementType()
    const attributes = getDraftAttributes()
    const allCount = props.resolveAllCount(attributes)
    const validationError = validateGoalForm({
      title: title(),
      achievementType: currentType,
      score: score(),
      rank: rank(),
      count: count(),
      countMode: countMode(),
      total: total(),
      totalMode: totalMode(),
      constMin: constMin(),
      constMax: constMax(),
      allCount,
      theoreticalTotal: getTheoreticalTotal(currentType),
    })

    if (validationError) {
      setErrorMessage(validationError)
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
