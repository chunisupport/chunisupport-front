import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'
import {
  CHART_CONST_DECIMAL_PLACES,
  CHART_CONST_MAX,
  CHART_CONST_MIN,
  SCORE_MIN,
} from '../../../../../constants/chart'
import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../../../types/api'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import { resolveGoalAchievementTypeLabel } from '../../../utils/goalForm'
import type { ComboLampGoalValue, HardLampGoalValue } from '../../../utils/goalLamp'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { buildGoalVersionOptions } from '../../../utils/goalVersion'
import { GoalAchievementSection } from './GoalAchievementSection'
import { GoalFormFooter } from './GoalFormFooter'
import { GoalPreviewSection } from './GoalPreviewSection'
import { GoalTargetChartsSection } from './GoalTargetChartsSection'
import { GoalTitleSection } from './GoalTitleSection'
import type { GoalSelectOption } from './goalFormFields'
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

  /**
   * 目標種別変更時に関連する入力値を既定値へ同期する。
   *
   * @param nextType - 変更後の目標種別。
   * @returns なし。
   */
  const handleAchievementTypeChange = (nextType: GoalAchievementType): void => {
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
  }

  /**
   * ランク目標変更時に保存用スコアも同期する。
   *
   * @param nextRank - 変更後のランク目標。
   * @returns なし。
   */
  const handleRankChange = (nextRank: RankGoalValue): void => {
    setRank(nextRank)
    setScore(String(getRankGoalScore(nextRank)))
  }

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
            <GoalTitleSection title={title()} onTitleChange={setTitle} />

            <GoalTargetChartsSection
              difficultyItems={props.masterData.difficulties}
              chartTargetMode={chartTargetMode()}
              diffs={diffs()}
              constMin={constMin()}
              constMax={constMax()}
              genreLabels={genreLabels()}
              selectedGenreLabels={selectedGenreLabels()}
              versionLabels={versionLabels()}
              selectedVersionLabels={selectedVersionLabels()}
              targetCountText={targetCountText()}
              onClearDifficulty={() => {
                setChartTargetMode('normal')
                setDiffs([])
              }}
              onToggleOpTarget={(checked) => {
                setChartTargetMode(checked ? 'op_target' : 'normal')
                if (checked) {
                  setDiffs([])
                }
              }}
              onToggleDifficulty={(id, checked) => {
                setChartTargetMode('normal')
                setDiffs((prev) => toggleSelection(prev, String(id), checked))
              }}
              onToggleGenre={handleToggleGenreLabel}
              onSelectAllGenres={() => setGenres(allGenreSelections())}
              onClearGenres={() => setGenres([])}
              onToggleVersion={handleToggleVersionLabel}
              onSelectAllVersions={() => setVersions(allVersionSelections())}
              onClearVersions={() => setVersions([])}
              onConstMinChange={(value) => handleMusicConstChange(setConstMin, value)}
              onConstMaxChange={(value) => handleMusicConstChange(setConstMax, value)}
            />

            <GoalAchievementSection
              achievementType={achievementType()}
              achievementTypeOptions={achievementTypeOptions()}
              achievementDescription={selectedAchievementDescription()}
              score={score()}
              rank={rank()}
              count={count()}
              countMode={countMode()}
              total={total()}
              totalMode={totalMode()}
              hardLamp={hardLamp()}
              comboLamp={comboLamp()}
              invert={invert()}
              countMax={props.resolveAllCount(getDraftAttributes())}
              countLimitText={countLimitText()}
              targetCountText={targetCountText()}
              theoreticalTotalText={theoreticalTotalText()}
              totalLimitText={totalLimitText()}
              totalFieldMax={totalFieldMax()}
              onAchievementTypeChange={handleAchievementTypeChange}
              onScoreChange={handleScoreChange}
              onRankChange={handleRankChange}
              onCountChange={setCount}
              onCountModeChange={setCountMode}
              onTotalChange={setTotal}
              onTotalModeChange={setTotalMode}
              onHardLampChange={setHardLamp}
              onComboLampChange={setComboLamp}
              onInvertChange={setInvert}
              canUseDynamicTotalTarget={canUseDynamicTotalTarget}
            />

            <GoalPreviewSection
              title={previewTitle()}
              achievementType={achievementType()}
              invert={invert()}
              progress={previewProgress()}
            />
          </div>

          <GoalFormFooter
            errorMessage={displayErrorMessage()}
            isSaving={props.isSaving}
            onCancel={() => props.onOpenChange(false)}
            onSave={() => {
              void handleSave()
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default GoalFormDialog
