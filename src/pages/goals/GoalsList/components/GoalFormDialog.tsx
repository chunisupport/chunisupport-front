import { Button } from '@kobalte/core/button'
import { Checkbox } from '@kobalte/core/checkbox'
import { Dialog } from '@kobalte/core/dialog'
import { NumberField } from '@kobalte/core/number-field'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import type {
  GoalAchievementParams,
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../../types/api'
import {
  getScoreRank,
  MAX_SCORE,
  SCORE_RANK_MIN_SCORES,
  SCORE_RANKS_ASC,
  type ScoreRank,
} from '../../../../utils/scoreRank'
import { buildTargetCountParam } from '../../utils/goalCountTarget'
import {
  COMBO_LAMP_OPTIONS,
  HARD_LAMP_OPTIONS,
  resolveGoalAchievementTypeLabel,
} from '../../utils/goalForm'
import type { GoalProgressResult } from '../../utils/goalProgress'
import { buildGoalVersionOptions } from '../../utils/goalVersion'
import {
  ERROR_MESSAGE_INVALID_COUNT_TARGET,
  GOAL_TITLE_MAX_LENGTH,
  LABEL_INVERT_DISPLAY,
  STEP2_DESCRIPTION,
} from './constants'
import { GoalCardProgress } from './GoalCard'

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
  'z-60 mt-1 max-h-64 w-[--kb-select-content-width] overflow-y-auto rounded-md border border-border-strong bg-surface p-2 shadow-lg'
/**
 * スクロール可能な目標条件リストの共通スタイル。
 */
const GOAL_FILTER_LIST_CLASS =
  'scrollbar-none max-h-36 space-y-1 overflow-y-auto rounded border border-border-strong px-3 py-2'
const GOAL_STEP_SECTION_CLASS = 'rounded-lg border border-border bg-surface-muted p-4'
const GOAL_STEP_BADGE_CLASS =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action-primary text-sm font-bold text-text-inverse'
const GOAL_STEP_TITLE_CLASS = 'text-base font-bold text-text'
const GOAL_STEP_DESCRIPTION_CLASS = 'text-sm text-text-muted'

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

const COUNT_MODE_OPTIONS: GoalSelectOption<'number' | 'all'>[] = [
  { value: 'number', label: '数値を指定' },
  { value: 'all', label: '条件に当てはまるものすべて' },
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
const MIN_SCORE = 0
const MIN_MUSIC_CONST = 1
const MAX_MUSIC_CONST = 16
const MUSIC_CONST_DECIMAL_PLACES = 1
const MAX_OVERPOWER_PERCENT = 100
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
    <TextField.Label class="mb-1 block text-text-muted">{props.label}</TextField.Label>
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
    class="relative flex items-center gap-2 text-sm text-text-muted"
    checked={props.checked}
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
  key: 'count' | 'total'
): number | undefined => {
  const value = (params as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : undefined
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

const normalizeAttributeSelection = (value: number | number[] | undefined): string[] => {
  if (typeof value === 'number') return [String(value)]
  if (Array.isArray(value)) {
    return value
      .filter((item): item is number => Number.isInteger(item))
      .map((item) => String(item))
  }
  return []
}

const parseAttributeSelection = (selectedValues: string[]): number | number[] | undefined => {
  const normalized = Array.from(new Set(selectedValues))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))

  if (normalized.length === 0) return undefined
  if (normalized.length === 1) return normalized[0]
  return normalized
}

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
  const [countMode, setCountMode] = createSignal<'number' | 'all'>('number')
  const [total, setTotal] = createSignal(getDefaultTotalGoalValue(DEFAULT_GOAL_ACHIEVEMENT_TYPE))
  const [totalMode, setTotalMode] = createSignal<'number' | 'all'>('number')
  const [hardLamp, setHardLamp] = createSignal<'HRD' | 'BRV' | 'ABS' | 'CTS'>('HRD')
  const [comboLamp, setComboLamp] = createSignal<'FC' | 'AJ'>('FC')
  const [invert, setInvert] = createSignal(false)

  const [diffs, setDiffs] = createSignal<string[]>([])
  const [constMin, setConstMin] = createSignal('')
  const [constMax, setConstMax] = createSignal('')
  const [genres, setGenres] = createSignal<string[]>([])
  const [versions, setVersions] = createSignal<string[]>([])

  const [errorMessage, setErrorMessage] = createSignal('')
  const displayErrorMessage = createMemo(() => errorMessage() || props.apiErrorMessage)
  const versionOptions = createMemo(() => buildGoalVersionOptions(props.versions))
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
    setScore(clampNumericInput(value, MIN_SCORE, MAX_SCORE, String))
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
      clampNumericInput(value, MIN_MUSIC_CONST, MAX_MUSIC_CONST, (nextValue) =>
        nextValue.toFixed(MUSIC_CONST_DECIMAL_PLACES)
      )
    )
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
      setCountMode('number')
      setTotal(getDefaultTotalGoalValue(DEFAULT_GOAL_ACHIEVEMENT_TYPE))
      setTotalMode('number')
      setHardLamp('HRD')
      setComboLamp('FC')
      setInvert(false)
      setDiffs([])
      setConstMin('')
      setConstMax('')
      setGenres([])
      setVersions([])
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
    const allCount = props.resolveAllCount(goal.attributes)
    const rawCount = getOptionalNumberParam(goal.achievement_params, 'count')
    if (typeof rawCount === 'number') {
      setCount(String(rawCount))
    }
    const rawTotal = getOptionalNumberParam(goal.achievement_params, 'total')
    if (typeof rawTotal === 'number') {
      setTotal(String(rawTotal))
    }
    if ('lamp' in goal.achievement_params && isHardLampValue(goal.achievement_params.lamp)) {
      setHardLamp(goal.achievement_params.lamp)
    }
    if ('lamp' in goal.achievement_params && isComboLampValue(goal.achievement_params.lamp)) {
      setComboLamp(goal.achievement_params.lamp)
    }
    setInvert(goal.invert)
    setDiffs(normalizeAttributeSelection(goal.attributes.diff))
    setConstMin(
      typeof goal.attributes.const?.min === 'number' ? String(goal.attributes.const.min) : ''
    )
    setConstMax(
      typeof goal.attributes.const?.max === 'number' ? String(goal.attributes.const.max) : ''
    )
    setGenres(normalizeAttributeSelection(goal.attributes.genre))
    setVersions(normalizeAttributeSelection(goal.attributes.ver))

    if (isCountAchievementType(goal.achievement_type)) {
      setCountMode(
        rawCount === undefined || (allCount > 0 && rawCount === allCount) ? 'all' : 'number'
      )
    } else {
      setCountMode('number')
    }
    setTotalMode(
      canUseDynamicTotalTarget(goal.achievement_type) && rawTotal === undefined ? 'all' : 'number'
    )
  })

  const getDraftAttributes = (): GoalRequest['attributes'] => ({
    ...(parseAttributeSelection(diffs()) !== undefined
      ? { diff: parseAttributeSelection(diffs()) }
      : {}),
    ...(constMin() || constMax()
      ? {
          const: {
            ...(constMin() ? { min: Number(constMin()) } : {}),
            ...(constMax() ? { max: Number(constMax()) } : {}),
          },
        }
      : {}),
    ...(parseAttributeSelection(genres()) !== undefined
      ? { genre: parseAttributeSelection(genres()) }
      : {}),
    ...(parseAttributeSelection(versions()) !== undefined
      ? { ver: parseAttributeSelection(versions()) }
      : {}),
  })

  /**
   * 現在のフォーム入力値から保存・プレビュー共通の成果パラメータを組み立てる。
   *
   * @param type - 現在選択中の目標種別。
   * @returns API送信値と同じ形の成果パラメータ。
   */
  const buildDraftAchievementParams = (type: GoalAchievementType): GoalAchievementParams => {
    const parsedScore = type === 'rank_count' ? getRankGoalScore(rank()) : Number(score())
    const parsedTotal =
      canUseDynamicTotalTarget(type) && totalMode() === 'all'
        ? getTheoreticalTotal(type)
        : Number(total())
    const targetCount = buildTargetCountParam(countMode(), count())

    return type === 'score_count' || type === 'rank_count'
      ? {
          score: Math.floor(Number.isFinite(parsedScore) ? parsedScore : 0),
          ...(typeof targetCount === 'number' ? { count: targetCount } : {}),
        }
      : type === 'avg_score'
        ? { score: Math.floor(Number.isFinite(parsedScore) ? parsedScore : 0) }
        : type === 'hardlamp_count'
          ? {
              lamp: hardLamp(),
              ...(typeof targetCount === 'number' ? { count: targetCount } : {}),
            }
          : type === 'combolamp_count'
            ? {
                lamp: comboLamp(),
                ...(typeof targetCount === 'number' ? { count: targetCount } : {}),
              }
            : canUseDynamicTotalTarget(type) && totalMode() === 'all'
              ? {}
              : { total: Number.isFinite(parsedTotal) ? parsedTotal : 0 }
  }

  /**
   * 現在の対象譜面条件に一致する件数を表示用テキストへ変換する。
   *
   * @returns 日本語ロケールで桁区切りした対象譜面数。
   */
  const targetCountText = (): string =>
    `${props.resolveAllCount(getDraftAttributes()).toLocaleString('ja-JP')} 譜面`

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
  const previewProgress = (): GoalProgressResult => {
    const currentType = achievementType()
    const attributes = getDraftAttributes()
    return props.resolveDraftGoalProgress({
      title: previewTitle(),
      achievement_type: currentType,
      achievement_params: buildDraftAchievementParams(currentType),
      attributes,
      invert: invert(),
    })
  }

  /**
   * 件数入力で指定できる上限を表示用に組み立てる。
   *
   * @returns 日本語ロケールで桁区切りした件数上限表示。
   */
  const countLimitText = (): string =>
    `${props.resolveAllCount(getDraftAttributes()).toLocaleString('ja-JP')}件以内`

  /**
   * 件数入力欄へ表示する値を取得する。
   *
   * @returns すべて指定時は現在の対象譜面数、通常時は入力中の件数。
   */
  const countFieldValue = (): string =>
    countMode() === 'all' ? String(props.resolveAllCount(getDraftAttributes())) : count()

  /**
   * 目標値入力で指定できる上限を表示用に組み立てる。
   *
   * @returns 目標種別に応じた上限表示。
   */
  const totalLimitText = (): string => {
    const currentType = achievementType()
    if (currentType === 'overpower_percent') return '100%以内'
    return `${getTheoreticalTotal(currentType).toLocaleString('ja-JP')}以内`
  }

  /**
   * 目標値入力欄へ表示する値を取得する。
   *
   * @returns 理論値指定時は現在の最大目標値、通常時は入力中の目標値。
   */
  const totalFieldValue = (): string =>
    canUseDynamicTotalTarget(achievementType()) && totalMode() === 'all'
      ? String(getTheoreticalTotal(achievementType()))
      : total()

  /**
   * 目標値入力欄に適用する最大値を取得する。
   *
   * @returns OVER POWER達成率では100、それ以外では未指定。
   */
  const totalFieldMax = (): number | undefined =>
    achievementType() === 'overpower_percent' ? MAX_OVERPOWER_PERCENT : undefined

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
      (!Number.isFinite(parsedScore) || parsedScore < MIN_SCORE || parsedScore > MAX_SCORE)
    ) {
      setErrorMessage('スコアは 0 ～ 1,010,000 の範囲で入力してください。')
      return
    }

    const isCountType = isCountAchievementType(currentType)

    const attributes = getDraftAttributes()

    const allCount = props.resolveAllCount(attributes)

    if (isCountType && countMode() === 'number') {
      const countMin = 1
      if (!Number.isInteger(parsedCount) || parsedCount < countMin) {
        setErrorMessage(`件数は${countMin}以上の整数で入力してください。`)
        return
      }
      if (parsedCount > allCount) {
        setErrorMessage(`件数は${allCount.toLocaleString('ja-JP')}件以内で入力してください。`)
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
        (canUseDynamicTotalTarget(currentType) && totalMode() === 'number')) &&
      (!Number.isFinite(parsedTotal) || parsedTotal < 0)
    ) {
      setErrorMessage('合計/割合の目標値は0以上で入力してください。')
      return
    }

    if (currentType === 'overpower_percent' && parsedTotal > MAX_OVERPOWER_PERCENT) {
      setErrorMessage('OVER POWER達成率は100%以下で入力してください。')
      return
    }

    const dynamicTotalMax =
      canUseDynamicTotalTarget(currentType) && totalMode() === 'number'
        ? getTheoreticalTotal(currentType)
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

    const targetCount = buildTargetCountParam(countMode(), count())

    if (isCountType && typeof targetCount === 'number' && targetCount <= 0) {
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
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-overlay z-40" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <Dialog.Title class="shrink-0 text-lg font-bold">
            {props.mode === 'create' ? '目標を作成' : '目標を編集'}
          </Dialog.Title>

          <div class="scrollbar-none mt-4 min-h-0 flex-1 basis-0 space-y-4 overflow-y-auto pr-1">
            <section class={GOAL_STEP_SECTION_CLASS}>
              <div class="mb-4 flex gap-3">
                <span class={GOAL_STEP_BADGE_CLASS}>1</span>
                <div>
                  <h2 class={GOAL_STEP_TITLE_CLASS}>タイトルと対象譜面</h2>
                  <p class={GOAL_STEP_DESCRIPTION_CLASS}>
                    目標名を決めてから、進捗を計算する譜面を絞り込みます。
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <GoalTextField
                  label="タイトル"
                  value={title()}
                  maxLength={GOAL_TITLE_MAX_LENGTH}
                  onChange={setTitle}
                />

                <div class="rounded border border-border bg-surface p-3">
                  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm font-semibold text-text-muted">対象譜面</p>
                    <p class="rounded bg-action-secondary px-2 py-1 text-xs font-semibold text-text-muted">
                      {targetCountText()}
                    </p>
                  </div>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <fieldset class="block text-sm space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="block text-text-muted">難易度（複数可）</span>
                        <Button
                          type="button"
                          class="text-xs text-action-primary hover:text-action-primary"
                          onClick={() => setDiffs([])}
                        >
                          クリア
                        </Button>
                      </div>
                      <div class={GOAL_FILTER_LIST_CLASS}>
                        <For each={props.masterData.difficulties}>
                          {(item) => (
                            <GoalFilterCheckbox
                              label={item.name}
                              checked={diffs().includes(String(item.id))}
                              onChange={(checked) =>
                                setDiffs((prev) => toggleSelection(prev, String(item.id), checked))
                              }
                            />
                          )}
                        </For>
                      </div>
                    </fieldset>

                    <fieldset class="block text-sm space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="block text-text-muted">ジャンル（複数可）</span>
                        <Button
                          type="button"
                          class="text-xs text-action-primary hover:text-action-primary"
                          onClick={() => setGenres([])}
                        >
                          クリア
                        </Button>
                      </div>
                      <div class={GOAL_FILTER_LIST_CLASS}>
                        <For each={props.masterData.genres}>
                          {(item) => (
                            <GoalFilterCheckbox
                              label={item.name}
                              checked={genres().includes(String(item.id))}
                              onChange={(checked) =>
                                setGenres((prev) => toggleSelection(prev, String(item.id), checked))
                              }
                            />
                          )}
                        </For>
                      </div>
                    </fieldset>

                    <fieldset class="block text-sm space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="block text-text-muted">バージョン（複数可）</span>
                        <Button
                          type="button"
                          class="text-xs text-action-primary hover:text-action-primary"
                          onClick={() => setVersions([])}
                        >
                          クリア
                        </Button>
                      </div>
                      <div class={GOAL_FILTER_LIST_CLASS}>
                        <Show
                          when={versionOptions().length > 0}
                          fallback={
                            <p class="text-sm text-text-subtle">
                              バージョンを取得できませんでした。
                            </p>
                          }
                        >
                          <For each={versionOptions()}>
                            {(item) => (
                              <GoalFilterCheckbox
                                label={item.label}
                                checked={versions().includes(item.value)}
                                onChange={(checked) =>
                                  setVersions((prev) => toggleSelection(prev, item.value, checked))
                                }
                              />
                            )}
                          </For>
                        </Show>
                      </div>
                    </fieldset>

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
              </div>
            </section>

            <section class={GOAL_STEP_SECTION_CLASS}>
              <div class="mb-4 flex gap-3">
                <span class={GOAL_STEP_BADGE_CLASS}>2</span>
                <div>
                  <h2 class={GOAL_STEP_TITLE_CLASS}>達成条件</h2>
                  <p class={GOAL_STEP_DESCRIPTION_CLASS}>{STEP2_DESCRIPTION}</p>
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
                      if (!canUseDynamicTotalTarget(nextType)) {
                        setTotalMode('number')
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
                    min={MIN_SCORE}
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
                    <div class="space-y-2">
                      <GoalNumberField
                        label="目標譜面数"
                        min={1}
                        value={countFieldValue()}
                        description={countLimitText()}
                        onChange={setCount}
                        disabled={countMode() === 'all'}
                      />
                      <Checkbox
                        class="relative flex items-center gap-2 text-sm text-text-muted"
                        checked={countMode() === 'all'}
                        onChange={(checked) => setCountMode(checked ? 'all' : 'number')}
                      >
                        <Checkbox.Input style={{ left: '0', top: '0' }} />
                        <Checkbox.Control class={GOAL_FILTER_CHECKBOX_CONTROL_CLASS}>
                          <Checkbox.Indicator>
                            <Check class="h-4 w-4" />
                          </Checkbox.Indicator>
                        </Checkbox.Control>
                        <Checkbox.Label>{COUNT_MODE_OPTIONS[1].label}</Checkbox.Label>
                      </Checkbox>
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
                      <GoalNumberField
                        label="目標値"
                        value={totalFieldValue()}
                        description={totalLimitText()}
                        min={0}
                        max={totalFieldMax()}
                        onChange={setTotal}
                        disabled={
                          canUseDynamicTotalTarget(achievementType()) && totalMode() === 'all'
                        }
                      />
                      <Show when={canUseDynamicTotalTarget(achievementType())}>
                        <Checkbox
                          class="relative flex items-center gap-2 text-sm text-text-muted"
                          checked={totalMode() === 'all'}
                          onChange={(checked) => setTotalMode(checked ? 'all' : 'number')}
                        >
                          <Checkbox.Input style={{ left: '0', top: '0' }} />
                          <Checkbox.Control class={GOAL_FILTER_CHECKBOX_CONTROL_CLASS}>
                            <Checkbox.Indicator>
                              <Check class="h-4 w-4" />
                            </Checkbox.Indicator>
                          </Checkbox.Control>
                          <Checkbox.Label>理論値</Checkbox.Label>
                        </Checkbox>
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

                <article class="rounded-lg border border-border bg-surface p-4 shadow-sm">
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
