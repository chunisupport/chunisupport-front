import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { createMultiSelectOption } from '../../../../../components/common/DomainMultiSelect'
import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalGroupDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../../../types/api'
import { normalizeScoreRangeInput } from '../../../../../utils/rangeInput'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import { resolveGoalAchievementTypeLabel } from '../../../utils/goalForm'
import type { ComboLampGoalValue, HardLampGoalValue } from '../../../utils/goalLamp'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { buildGoalVersionOptions } from '../../../utils/goalVersion'
import { resolveGoalFormGroupId } from '../../goalGroupsModel'
import { GoalAchievementSection } from './GoalAchievementSection'
import { GoalFormFooter } from './GoalFormFooter'
import { GoalGroupSection } from './GoalGroupSection'
import { GoalPreviewSection } from './GoalPreviewSection'
import { GoalTargetChartsSection } from './GoalTargetChartsSection'
import { GoalTitleSection } from './GoalTitleSection'
import type { GoalSelectOption } from './goalFormFields'
import {
  buildAllIdSelections,
  buildAllVersionSelections,
  buildDefaultDifficultySelections,
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
  /** 新規作成時に初期選択するグループID */
  initialGroupId: number | null
  /** 所属先として選択できる目標グループ */
  groups: GoalGroupDTO[]
  masterData: MasterDataDTO
  versions: VersionDTO[]
  isSaving: boolean
  /** 保存APIから返されたエラーメッセージ */
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSave: (payload: GoalRequest) => Promise<void>
  /** 対象条件と目標種別に応じた譜面数または楽曲数を解決する関数 */
  resolveAllCount: (attributes: GoalAttributes, achievementType?: GoalAchievementType) => number
  /** 対象条件に一致する譜面ごとの最大OVER POWER合計を解決する関数 */
  resolveOverPowerChartMax: (attributes: GoalAttributes) => number
  /** フォーム入力中の目標内容から実レコードに基づく進捗を解決する関数 */
  resolveDraftGoalProgress: (goal: GoalCreateRequest) => GoalProgressResult
}

const GOAL_ACHIEVEMENT_TYPE_DESCRIPTIONS = {
  rank_count: '指定ランク以上を達成した譜面数を目標にします。',
  score_count: '指定スコア以上を達成した譜面数を目標にします。',
  avg_score: '対象譜面の平均スコアを目標にします。',
  hardlamp_count: '指定ハードランプ以上を達成した譜面数を目標にします。',
  combolamp_count: 'FULL COMBO / ALL JUSTICE の達成数を目標にします。',
  rainbow_count: '曲ごとにBASICからMASTER、存在する場合はULTIMAまでのAJ達成を数えます。',
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
  'rainbow_count',
  'total_score',
  'overpower_value',
  'overpower_percent',
] as const satisfies readonly GoalAchievementType[]
const MAX_OVERPOWER_PERCENT = 100

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
  const [groupId, setGroupId] = createSignal<number | null>(null)
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
  const [invertValue, setInvertValue] = createSignal(false)
  const [invertPercentage, setInvertPercentage] = createSignal(false)

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
  const defaultDifficultySelections = createMemo(() =>
    buildDefaultDifficultySelections(props.masterData.difficulties)
  )
  const allGenreSelections = createMemo(() => buildAllIdSelections(props.masterData.genres))
  const allVersionSelections = createMemo(() => buildAllVersionSelections(versionOptions()))
  const genreSelectOptions = createMemo(() =>
    props.masterData.genres.map((genre) => createMultiSelectOption(String(genre.id), genre.name))
  )
  const versionSelectOptions = createMemo(() =>
    versionOptions().map((option) => createMultiSelectOption(option.value, option.label))
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

  const getTotalScoreMax = (): number =>
    props.resolveAllCount(getDraftAttributes(), achievementType()) * MAX_SCORE

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
    const normalizedValue = normalizeScoreRangeInput(value)
    if (normalizedValue === null) return
    setScore(normalizedValue)
  }

  // ダイアログを開いたタイミングで作成・編集モードに応じた初期値へ同期するため。
  createEffect(() => {
    if (!props.open) return
    setErrorMessage('')

    const nextState = createGoalFormInitialState(props.initialGoal, {
      allDifficultySelections: allDifficultySelections(),
      allGenreSelections: allGenreSelections(),
      allVersionSelections: allVersionSelections(),
      defaultDifficultySelections: defaultDifficultySelections(),
    })

    setTitle(nextState.title)
    setGroupId(resolveGoalFormGroupId(props.initialGoal, props.initialGroupId))
    setAchievementType(nextState.achievementType)
    setScore(nextState.score)
    setRank(nextState.rank)
    setCount(nextState.count)
    setCountMode(nextState.countMode)
    setTotal(nextState.total)
    setTotalMode(nextState.totalMode)
    setHardLamp(nextState.hardLamp)
    setComboLamp(nextState.comboLamp)
    setInvertValue(nextState.invertValue)
    setInvertPercentage(nextState.invertPercentage)
    setChartTargetMode(nextState.chartTargetMode)
    setDiffs(nextState.diffs)
    setConstMin(nextState.constMin)
    setConstMax(nextState.constMax)
    setGenres(nextState.genres)
    setVersions(nextState.versions)
  })

  const getDraftAttributes = (): GoalRequest['attributes'] =>
    buildGoalFormAttributes({
      achievementType: achievementType(),
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
   * 現在の対象条件に一致する譜面数または楽曲数を表示用テキストへ変換する。
   *
   * @returns 日本語ロケールで桁区切りした対象数。
   */
  const targetCountText = (): string => {
    const currentType = achievementType()
    const unit = currentType === 'rainbow_count' ? '曲' : '譜面'
    return `${props.resolveAllCount(getDraftAttributes(), currentType).toLocaleString('ja-JP')} ${unit}`
  }

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
      group_id: groupId(),
      title: previewTitle(),
      achievement_type: currentType,
      achievement_params: buildDraftAchievementParams(currentType),
      attributes,
      invert_value: invertValue(),
      invert_percentage: invertPercentage(),
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
      : `${props
          .resolveAllCount(getDraftAttributes(), achievementType())
          .toLocaleString('ja-JP')}件以内`

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
    const allCount = props.resolveAllCount(attributes, currentType)
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
      group_id: groupId(),
      title: trimmed,
      achievement_type: currentType,
      achievement_params,
      attributes,
      invert_value: invertValue(),
      invert_percentage: invertPercentage(),
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

            <GoalGroupSection
              groups={props.groups}
              groupId={groupId()}
              onGroupIdChange={setGroupId}
            />

            <GoalTargetChartsSection
              difficultyItems={props.masterData.difficulties}
              isRainbowGoal={achievementType() === 'rainbow_count'}
              chartTargetMode={chartTargetMode()}
              diffs={diffs()}
              constMin={constMin()}
              constMax={constMax()}
              genreOptions={genreSelectOptions()}
              selectedGenres={genres()}
              versionOptions={versionSelectOptions()}
              selectedVersions={versions()}
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
              onGenresChange={setGenres}
              onVersionsChange={setVersions}
              onConstMinChange={setConstMin}
              onConstMaxChange={setConstMax}
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
              invertValue={invertValue()}
              invertPercentage={invertPercentage()}
              countMax={props.resolveAllCount(getDraftAttributes(), achievementType())}
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
              onInvertValueChange={setInvertValue}
              onInvertPercentageChange={setInvertPercentage}
              canUseDynamicTotalTarget={canUseDynamicTotalTarget}
            />

            <GoalPreviewSection
              title={previewTitle()}
              achievementType={achievementType()}
              invertValue={invertValue()}
              invertPercentage={invertPercentage()}
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
