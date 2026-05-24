import { Checkbox } from '@kobalte/core/checkbox'
import { Dialog } from '@kobalte/core/dialog'
import { NumberField } from '@kobalte/core/number-field'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js'
import type {
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
import {
  COMBO_LAMP_OPTIONS,
  HARD_LAMP_OPTIONS,
  resolveGoalAchievementTypeLabel,
} from '../../utils/goalForm'
import { buildGoalVersionOptions } from '../../utils/goalVersion'

type GoalRequest = GoalCreateRequest | GoalUpdateRequest

interface GoalFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialGoal?: GoalDTO
  masterData: MasterDataDTO
  versions: VersionDTO[]
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: GoalRequest) => Promise<void>
  resolveAllCount: (attributes: GoalAttributes) => number
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
  label: string
  value: string
  min?: number
  max?: number
  step?: number
  inputRef?: (el: HTMLInputElement) => void
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

const COUNT_MODE_OPTIONS: GoalSelectOption<'number' | 'all'>[] = [
  { value: 'number', label: '数値を指定' },
  { value: 'all', label: '条件に当てはまるものすべて' },
]

const RANK_OPTIONS: GoalSelectOption<ScoreRank>[] = SCORE_RANKS_ASC.map((scoreRank) => ({
  value: scoreRank,
  label: `${scoreRank}（${SCORE_RANK_MIN_SCORES[scoreRank].toLocaleString('ja-JP')}）`,
}))

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
    <TextField.Input class={GOAL_FIELD_INPUT_CLASS} maxLength={props.maxLength} />
  </TextField>
)

/**
 * 目標設定ダイアログで使う数値入力欄を描画する。
 *
 * @param props - 表示ラベル、入力値、数値制約、変更ハンドラ。
 * @returns Kobalte NumberField を使った入力欄。
 */
const GoalNumberField: Component<GoalNumberFieldProps> = (props) => (
  <NumberField
    class="block text-sm"
    value={props.value}
    onChange={props.onChange}
    format={false}
    allowedInput={/[0-9.]/}
    step={props.step ?? 1}
  >
    <NumberField.Label class="mb-1 block text-text-muted">{props.label}</NumberField.Label>
    <NumberField.Input
      ref={props.inputRef}
      class={GOAL_FIELD_INPUT_CLASS}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
    />
  </NumberField>
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
    class="flex items-center gap-2 text-sm text-text-muted"
    checked={props.checked}
    onChange={props.onChange}
  >
    <Checkbox.Input />
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
  const [achievementType, setAchievementType] = createSignal<GoalAchievementType>('score_count')
  const [score, setScore] = createSignal(String(MAX_SCORE - 10000))
  const [rank, setRank] = createSignal<ScoreRank>('S')
  const [count, setCount] = createSignal('1')
  const [countMode, setCountMode] = createSignal<'number' | 'all'>('number')
  const [total, setTotal] = createSignal('100')
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
  let dialogContentRef: HTMLDivElement | undefined
  let formScrollAreaRef: HTMLDivElement | undefined
  let invertCheckboxRef: HTMLInputElement | undefined
  let countInputRef: HTMLInputElement | undefined
  let goalCountSectionRef: HTMLDivElement | undefined
  const [debugDialogId] = createSignal(`goal-form-${Math.random().toString(36).slice(2, 10)}`)
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

  createEffect(() => {
    if (!props.open) return
    setErrorMessage('')

    const goal = props.initialGoal
    if (!goal) {
      setTitle('')
      setAchievementType('score_count')
      setScore(String(MAX_SCORE - 10000))
      setRank('S')
      setCount('1')
      setCountMode('number')
      setTotal('100')
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
        setRank(getScoreRank(goal.achievement_params.score))
      }
    }
    const allCount = props.resolveAllCount(goal.attributes)
    const rawCount = getOptionalNumberParam(goal.achievement_params, 'count')
    if (typeof rawCount === 'number') {
      setCount(String(goal.invert ? Math.max(allCount - rawCount, 0) : rawCount))
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

  /**
   * 目標フォームダイアログのレイアウト情報をデバッグ出力する。
   *
   * @param phase - ログ出力タイミングの識別子。
   * @returns なし。
   */
  const logGoalDialogLayout = (phase: string, eventDetail?: Record<string, unknown>): void => {
    if (!props.open) return

    if (!dialogContentRef || !formScrollAreaRef) {
      console.log('[GoalFormDialog][layout]', { phase, reason: 'ref_unavailable' })
      return
    }

    const contentRect = dialogContentRef.getBoundingClientRect()
    const scrollRect = formScrollAreaRef.getBoundingClientRect()

    const visualViewportHeight = window.visualViewport?.height
    const visualViewportOffsetTop = window.visualViewport?.offsetTop
    const activeElement = document.activeElement
    const activeTagName = activeElement?.tagName
    const activeElementClassName =
      activeElement instanceof HTMLElement ? activeElement.className : undefined
    const activeElementAriaLabel =
      activeElement instanceof HTMLElement ? activeElement.getAttribute('aria-label') : undefined
    const invertCheckboxRect = invertCheckboxRef?.getBoundingClientRect()
    const countInputRect = countInputRef?.getBoundingClientRect()
    const goalCountSectionRect = goalCountSectionRef?.getBoundingClientRect()
    const documentScrollTop = document.scrollingElement?.scrollTop
    const rootClientTop = document.documentElement.getBoundingClientRect().top
    const bodyClientTop = document.body.getBoundingClientRect().top
    const activeIsInvertCheckbox = activeElement === invertCheckboxRef
    const activeIsCountInput = activeElement === countInputRef

    console.log('[GoalFormDialog][layout]', {
      debugDialogId: debugDialogId(),
      open: props.open,
      mode: props.mode,
      phase,
      invert: invert(),
      countMode: countMode(),
      count: count(),
      viewportHeight: window.innerHeight,
      visualViewportHeight,
      visualViewportOffsetTop,
      windowScrollY: window.scrollY,
      activeTagName,
      activeElementClassName,
      activeElementAriaLabel,
      contentTop: contentRect.top,
      contentBottom: contentRect.bottom,
      contentHeight: contentRect.height,
      scrollTop: formScrollAreaRef.scrollTop,
      scrollHeight: formScrollAreaRef.scrollHeight,
      scrollClientHeight: formScrollAreaRef.clientHeight,
      scrollAreaTop: scrollRect.top,
      scrollAreaBottom: scrollRect.bottom,
      scrollAreaHeight: scrollRect.height,
      invertCheckboxTop: invertCheckboxRect?.top,
      invertCheckboxBottom: invertCheckboxRect?.bottom,
      countInputTop: countInputRect?.top,
      countInputBottom: countInputRect?.bottom,
      goalCountSectionTop: goalCountSectionRect?.top,
      goalCountSectionBottom: goalCountSectionRect?.bottom,
      documentScrollTop,
      rootClientTop,
      bodyClientTop,
      activeIsInvertCheckbox,
      activeIsCountInput,
      eventDetail,
    })
  }

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
   * クリック・フォーカス・入力イベントを監視して原因調査用ログを出力する。
   *
   * @returns なし。
   */
  createEffect(() => {
    if (!props.open) return
    if (!dialogContentRef || !formScrollAreaRef) return

    const handleWindowClick = (event: MouseEvent): void => {
      logGoalDialogLayout('window_click', {
        targetTag: (event.target as HTMLElement | null)?.tagName,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    }
    const handleFocusIn = (event: FocusEvent): void => {
      const target = event.target as HTMLElement | null
      logGoalDialogLayout('focusin', {
        targetTag: target?.tagName,
        targetClassName: target?.className,
      })
    }
    const handleFocusOut = (event: FocusEvent): void => {
      const target = event.target as HTMLElement | null
      logGoalDialogLayout('focusout', {
        targetTag: target?.tagName,
        targetClassName: target?.className,
      })
    }
    const handleInput = (event: Event): void => {
      const target = event.target as HTMLInputElement | null
      logGoalDialogLayout('input_event', {
        targetTag: target?.tagName,
        targetType: target?.type,
        targetValue: target?.value,
      })
    }

    window.addEventListener('click', handleWindowClick, true)
    dialogContentRef.addEventListener('focusin', handleFocusIn)
    dialogContentRef.addEventListener('focusout', handleFocusOut)
    dialogContentRef.addEventListener('input', handleInput, true)

    onCleanup(() => {
      window.removeEventListener('click', handleWindowClick, true)
      dialogContentRef?.removeEventListener('focusin', handleFocusIn)
      dialogContentRef?.removeEventListener('focusout', handleFocusOut)
      dialogContentRef?.removeEventListener('input', handleInput, true)
    })
  })

  /**
   * スクロール領域・VisualViewportのイベントを監視してデバッグログを出力する。
   *
   * @returns なし。
   */
  createEffect(() => {
    if (!props.open) return
    if (!formScrollAreaRef) return

    const handleScroll = (): void => {
      logGoalDialogLayout('scroll_event', { source: 'formScrollAreaRef' })
    }
    const handleVisualViewportResize = (): void => {
      logGoalDialogLayout('visual_viewport_resize')
    }
    const handleVisualViewportScroll = (): void => {
      logGoalDialogLayout('visual_viewport_scroll')
    }
    const handleWindowResize = (): void => {
      logGoalDialogLayout('window_resize')
    }
    const handleWindowScroll = (): void => {
      logGoalDialogLayout('window_scroll')
    }

    formScrollAreaRef.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleWindowResize)
    window.addEventListener('scroll', handleWindowScroll, true)
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize)
    window.visualViewport?.addEventListener('scroll', handleVisualViewportScroll)

    onCleanup(() => {
      formScrollAreaRef?.removeEventListener('scroll', handleScroll)
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize)
      window.visualViewport?.removeEventListener('scroll', handleVisualViewportScroll)
      window.removeEventListener('resize', handleWindowResize)
      window.removeEventListener('scroll', handleWindowScroll, true)
    })
  })

  createEffect(
    on([invert, countMode, count], () => {
      if (!props.open) return
      queueMicrotask(() => {
        logGoalDialogLayout('state_change_microtask')
      })
      requestAnimationFrame(() => {
        logGoalDialogLayout('state_change_animation_frame')
      })
    })
  )

  const handleSave = async () => {
    setErrorMessage('')
    const trimmed = title().trim()
    if (!trimmed) {
      setErrorMessage('タイトルを入力してください。')
      return
    }
    if (trimmed.length > 30) {
      setErrorMessage('タイトルは30文字以内で入力してください。')
      return
    }

    const currentType = achievementType()
    const parsedScore =
      currentType === 'rank_count' ? SCORE_RANK_MIN_SCORES[rank()] : Number(score())
    const parsedCount = Number(count())
    const parsedTotal = Number(total())
    const parsedConstMin = constMin() === '' ? undefined : Number(constMin())
    const parsedConstMax = constMax() === '' ? undefined : Number(constMax())

    if (
      (currentType === 'score_count' ||
        currentType === 'rank_count' ||
        currentType === 'avg_score') &&
      (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > MAX_SCORE)
    ) {
      setErrorMessage('スコアは 0 ～ 1,010,000 の範囲で入力してください。')
      return
    }

    const isCountType = isCountAchievementType(currentType)

    const attributes = getDraftAttributes()
    const allCount = props.resolveAllCount(attributes)

    if (isCountType && countMode() === 'number') {
      const countMin = invert() ? 0 : 1
      if (!Number.isInteger(parsedCount) || parsedCount < countMin) {
        setErrorMessage(`件数は${countMin}以上の整数で入力してください。`)
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

    if (currentType === 'total_score' && totalMode() === 'number') {
      const maxTotalScore = getTotalScoreMax()
      if (parsedTotal > maxTotalScore) {
        setErrorMessage(
          `総スコア目標は最大 ${maxTotalScore.toLocaleString('ja-JP')} 以下で入力してください。`
        )
        return
      }
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

    const targetCount =
      countMode() === 'all'
        ? undefined
        : invert()
          ? allCount - Math.floor(parsedCount)
          : Math.floor(parsedCount)

    if (isCountType && typeof targetCount === 'number' && targetCount <= 0) {
      setErrorMessage('件数目標の変換結果が0以下です。条件または入力値を見直してください。')
      return
    }

    const achievement_params =
      currentType === 'score_count' || currentType === 'rank_count'
        ? {
            score: Math.floor(parsedScore),
            ...(typeof targetCount === 'number' ? { count: targetCount } : {}),
          }
        : currentType === 'avg_score'
          ? { score: Math.floor(parsedScore) }
          : currentType === 'hardlamp_count'
            ? {
                lamp: hardLamp(),
                ...(typeof targetCount === 'number' ? { count: targetCount } : {}),
              }
            : currentType === 'combolamp_count'
              ? {
                  lamp: comboLamp(),
                  ...(typeof targetCount === 'number' ? { count: targetCount } : {}),
                }
              : canUseDynamicTotalTarget(currentType) && totalMode() === 'all'
                ? {}
                : { total: parsedTotal }

    await props.onSave({
      title: trimmed,
      achievement_type: currentType,
      achievement_params,
      attributes,
      invert: invert(),
    })
  }

  const handleInvertChange = (next: boolean) => {
    logGoalDialogLayout('before_invert_change')
    if (isCountAchievementType(achievementType()) && countMode() === 'number') {
      const parsed = Number(count())
      if (Number.isInteger(parsed) && parsed >= 0) {
        const allCount = props.resolveAllCount(getDraftAttributes())
        setCount(String(Math.max(allCount - parsed, 0)))
      }
    }
    setInvert(next)
    queueMicrotask(() => {
      logGoalDialogLayout('after_invert_change_microtask')
    })
    requestAnimationFrame(() => {
      logGoalDialogLayout('after_invert_change_animation_frame')
    })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-overlay z-40" />
        <Dialog.Content
          ref={dialogContentRef}
          class="fixed inset-x-4 top-4 bottom-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6"
        >
          <Dialog.Title class="text-lg font-bold">
            {props.mode === 'create' ? '目標を作成' : '目標を編集'}
          </Dialog.Title>

          <div
            ref={formScrollAreaRef}
            class="scrollbar-none mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
          >
            <GoalTextField label="タイトル" value={title()} maxLength={30} onChange={setTitle} />

            <GoalSelectField
              label="目標種別"
              value={achievementType()}
              options={achievementTypeOptions()}
              onChange={(nextType) => {
                setAchievementType(nextType)
                if (!canUseDynamicTotalTarget(nextType)) {
                  setTotalMode('number')
                }
                if (nextType === 'rank_count') {
                  setRank('S')
                  setScore(String(SCORE_RANK_MIN_SCORES.S))
                }
              }}
            />

            <Show when={achievementType() === 'score_count' || achievementType() === 'avg_score'}>
              <GoalNumberField
                label="スコア目標"
                value={score()}
                min={0}
                max={MAX_SCORE}
                onChange={setScore}
              />
            </Show>

            <Show when={achievementType() === 'rank_count'}>
              <GoalSelectField
                label="ランク目標"
                value={rank()}
                options={RANK_OPTIONS}
                onChange={(nextRank) => {
                  setRank(nextRank)
                  setScore(String(SCORE_RANK_MIN_SCORES[nextRank]))
                }}
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
              <div
                ref={goalCountSectionRef}
                data-debug-id="goal-count-section"
                class="block text-sm"
              >
                <p class="mb-1 block text-text-muted">{invert() ? '未達成件数目標' : '件数目標'}</p>
                <div class="space-y-2">
                  <GoalSelectField
                    label="件数指定方法"
                    value={countMode()}
                    options={COUNT_MODE_OPTIONS}
                    onChange={setCountMode}
                  />
                  <Show
                    when={countMode() === 'number'}
                    fallback={
                      <p class="rounded border border-action-primary-border bg-action-primary-muted px-3 py-2 text-xs text-action-primary">
                        現在の対象譜面数: {props.resolveAllCount(getDraftAttributes())} 件
                      </p>
                    }
                  >
                    <GoalNumberField
                      label={invert() ? '未達成件数' : '件数'}
                      min={invert() ? 0 : 1}
                      value={count()}
                      inputRef={(element) => {
                        countInputRef = element
                      }}
                      onChange={setCount}
                    />
                  </Show>
                </div>
              </div>
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
                achievementType() === 'total_score' ||
                achievementType() === 'overpower_value' ||
                achievementType() === 'overpower_percent'
              }
            >
              <div class="block text-sm">
                <p class="mb-1 block text-text-muted">合計/割合目標</p>
                <div class="space-y-2">
                  <Show when={canUseDynamicTotalTarget(achievementType())}>
                    <GoalSelectField
                      label="目標値の指定方法"
                      value={totalMode()}
                      options={COUNT_MODE_OPTIONS}
                      onChange={setTotalMode}
                    />
                  </Show>
                  <Show
                    when={!canUseDynamicTotalTarget(achievementType()) || totalMode() === 'number'}
                    fallback={
                      <p class="rounded border border-action-primary-border bg-action-primary-muted px-3 py-2 text-xs text-action-primary">
                        現在の対象譜面数から目標値を自動計算します。
                      </p>
                    }
                  >
                    <GoalNumberField
                      label="合計/割合の目標値"
                      value={total()}
                      min={0}
                      onChange={setTotal}
                    />
                    <Show when={achievementType() === 'total_score'}>
                      <p class="mt-1 text-xs text-text-muted">
                        最大値: {getTotalScoreMax().toLocaleString('ja-JP')}（対象譜面数 ×
                        1,010,000）
                      </p>
                    </Show>
                  </Show>
                </div>
              </div>
            </Show>

            <div class="rounded border border-border p-3">
              <p class="mb-2 text-sm font-semibold text-text-muted">対象条件（任意）</p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <fieldset class="block text-sm space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="block text-text-muted">難易度（複数可）</span>
                    <button
                      type="button"
                      class="text-xs text-action-primary hover:text-action-primary"
                      onClick={() => setDiffs([])}
                    >
                      クリア
                    </button>
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
                  <p class="text-xs text-text-subtle">未選択で「指定なし」になります。</p>
                </fieldset>

                <fieldset class="block text-sm space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="block text-text-muted">ジャンル（複数可）</span>
                    <button
                      type="button"
                      class="text-xs text-action-primary hover:text-action-primary"
                      onClick={() => setGenres([])}
                    >
                      クリア
                    </button>
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
                  <p class="text-xs text-text-subtle">未選択で「指定なし」になります。</p>
                </fieldset>

                <fieldset class="block text-sm space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="block text-text-muted">バージョン（複数可）</span>
                    <button
                      type="button"
                      class="text-xs text-action-primary hover:text-action-primary"
                      onClick={() => setVersions([])}
                    >
                      クリア
                    </button>
                  </div>
                  <div class={GOAL_FILTER_LIST_CLASS}>
                    <Show
                      when={versionOptions().length > 0}
                      fallback={
                        <p class="text-sm text-text-subtle">バージョンを取得できませんでした。</p>
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
                  <p class="text-xs text-text-subtle">未選択で「指定なし」になります。</p>
                </fieldset>

                <div class="grid grid-cols-2 gap-2">
                  <GoalNumberField
                    label="定数min"
                    value={constMin()}
                    step={0.1}
                    onChange={setConstMin}
                  />
                  <GoalNumberField
                    label="定数max"
                    value={constMax()}
                    step={0.1}
                    onChange={setConstMax}
                  />
                </div>
              </div>
            </div>

            <Checkbox
              class="flex items-center gap-2 text-sm text-text-muted"
              checked={invert()}
              onChange={handleInvertChange}
            >
              <Checkbox.Input ref={invertCheckboxRef} />
              <Checkbox.Control class={GOAL_FILTER_CHECKBOX_CONTROL_CLASS}>
                <Checkbox.Indicator>
                  <Check class="h-4 w-4" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label>進捗表示を反転（未達寄り）</Checkbox.Label>
            </Checkbox>

            <Show when={errorMessage()}>
              <p class="text-sm text-danger">{errorMessage()}</p>
            </Show>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover"
              onClick={() => props.onOpenChange(false)}
              disabled={props.isSaving}
            >
              キャンセル
            </button>
            <button
              type="button"
              class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
              onClick={() => {
                void handleSave()
              }}
              disabled={props.isSaving}
            >
              {props.isSaving ? '保存中...' : '保存する'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default GoalFormDialog
