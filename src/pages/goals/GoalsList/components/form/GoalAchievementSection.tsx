import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { CheckboxField } from '../../../../../components/common/CheckboxField'
import { SCORE_MIN } from '../../../../../constants/chart'
import type { GoalAchievementType } from '../../../../../types/api'
import {
  COMBO_LAMP_OPTIONS,
  type ComboLampGoalValue,
  FULL_CHAIN_OPTIONS,
  type FullChainGoalValue,
  HARD_LAMP_OPTIONS,
  type HardLampGoalValue,
} from '../../../../../utils/goalLamp'
import { MAX_SCORE, SCORE_RANK_MIN_SCORES, SCORE_RANKS_ASC } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import { getGoalValueUnit } from '../../../utils/goalValueFormat'
import { GOAL_GAUGE_START_LABEL } from '../../constants'
import {
  LABEL_APPLY_GAUGE_START_TO_PERCENTAGE,
  LABEL_GAUGE_START_MODE_CURRENT,
  LABEL_GAUGE_START_MODE_CUSTOM,
  LABEL_GAUGE_START_MODE_ZERO,
  LABEL_INVERT_PERCENTAGE,
  LABEL_INVERT_VALUE,
  OVERPOWER_TARGET_DECIMAL_PLACES,
  RATING_GOAL_DECIMAL_PLACES,
  RATING_GOAL_FIELD_LABEL,
  RATING_GOAL_MIN_VALUE,
  STEP3_DESCRIPTION,
} from './constants'
import {
  GoalNumberField,
  GoalSelectField,
  type GoalSelectOption,
  GoalTargetModeRadioGroup,
} from './goalFormFields'
import {
  canApplyGaugeStartToPercentage,
  type GoalGaugeStartMode,
  getGoalGaugeStartDecimalPlaces,
  type RankGoalValue,
  THEORETICAL_RANK_GOAL,
} from './goalFormModel'
import {
  GOAL_STEP_BADGE_CLASS,
  GOAL_STEP_DESCRIPTION_CLASS,
  GOAL_STEP_SECTION_CLASS,
  GOAL_STEP_TITLE_CLASS,
} from './goalFormStyles'

interface GoalAchievementSectionProps {
  achievementType: GoalAchievementType
  achievementTypeOptions: GoalSelectOption<GoalAchievementType>[]
  achievementDescription: string
  score: string
  rating: string
  rank: RankGoalValue
  count: string
  countMode: GoalTargetMode
  total: string
  totalMode: GoalTargetMode
  hardLamp: HardLampGoalValue
  comboLamp: ComboLampGoalValue
  fullChain: FullChainGoalValue
  invertValue: boolean
  invertPercentage: boolean
  /** ゲージのスタート位置の決め方 */
  gaugeStartMode: GoalGaugeStartMode
  /** 「任意の数値から」で使うスタート位置の入力値 */
  gaugeStart: string
  /** 達成率表示もゲージのスタート位置から計算するか */
  applyGaugeStartToPercentage: boolean
  /** 「任意の数値から」の入力欄の下に表示する検証エラー */
  gaugeStartErrorMessage?: string
  /** スタート位置の選択欄の下に表示するエラー。「現在値から」を使えない状態で選んでいる場合に出す */
  gaugeStartGroupErrorMessage?: string
  /** 「現在値から」を選べるか。対象がない、達成済み、または現在値が0の場合はfalse */
  canUseCurrentGaugeStart: boolean
  /** 「現在値から」を選んだときに保存されるスタート位置の表示文字列 */
  currentGaugeStartText: string
  /** スタート位置が0より大きく、達成率への適用指定が効くか */
  hasGaugeStart: boolean
  countMax: number
  countLimitText: string
  targetCountText: string
  theoreticalTotalText: string
  totalLimitText: string
  totalFieldMax?: number
  onAchievementTypeChange: (type: GoalAchievementType) => void
  onScoreChange: (score: string) => void
  onRatingChange: (rating: string) => void
  onRankChange: (rank: RankGoalValue) => void
  onCountChange: (count: string) => void
  onCountModeChange: (mode: GoalTargetMode) => void
  onTotalChange: (total: string) => void
  onTotalModeChange: (mode: GoalTargetMode) => void
  onHardLampChange: (lamp: HardLampGoalValue) => void
  onComboLampChange: (lamp: ComboLampGoalValue) => void
  onFullChainChange: (lamp: FullChainGoalValue) => void
  onInvertValueChange: (invertValue: boolean) => void
  onInvertPercentageChange: (invertPercentage: boolean) => void
  /** ゲージのスタート位置の決め方が変わったときの通知先 */
  onGaugeStartModeChange: (mode: GoalGaugeStartMode) => void
  /** 「任意の数値から」の入力値が変わったときの通知先 */
  onGaugeStartChange: (gaugeStart: string) => void
  /** 達成率への適用指定が変わったときの通知先 */
  onApplyGaugeStartToPercentageChange: (applyGaugeStartToPercentage: boolean) => void
  /** ゲージのスタート位置の欄全体を受け取る。検証エラー時に表示位置へ移るために使う */
  gaugeStartFieldRef: (element: HTMLDivElement) => void
  /** 「任意の数値から」の入力要素を受け取る。検証エラー時にフォーカスを移すために使う */
  gaugeStartInputRef: (element: HTMLInputElement) => void
  canUseDynamicTotalTarget: (type: GoalAchievementType) => boolean
}

const COUNT_MODE_OPTIONS: GoalSelectOption<GoalTargetMode>[] = [
  { value: 'all', label: '条件に当てはまる譜面すべて' },
  { value: 'number', label: '目標値を指定' },
  { value: 'remaining', label: '最大値に対する残数' },
  { value: 'percent', label: '最大値に対する割合' },
]
const RAINBOW_COUNT_MODE_OPTIONS: GoalSelectOption<GoalTargetMode>[] = [
  { value: 'all', label: '条件に当てはまる楽曲すべて' },
  ...COUNT_MODE_OPTIONS.slice(1),
]

const TOTAL_MODE_OPTIONS: GoalSelectOption<GoalTargetMode>[] = [
  { value: 'all', label: '理論値' },
  { value: 'number', label: '目標値を指定' },
  { value: 'remaining', label: '最大値に対する残数' },
  { value: 'percent', label: '最大値に対する割合' },
]

/** ゲージのスタート位置の決め方の選択肢。 */
const GAUGE_START_MODE_OPTIONS: GoalSelectOption<GoalGaugeStartMode>[] = [
  { value: 'zero', label: LABEL_GAUGE_START_MODE_ZERO },
  { value: 'current', label: LABEL_GAUGE_START_MODE_CURRENT },
  { value: 'custom', label: LABEL_GAUGE_START_MODE_CUSTOM },
]

const HARD_LAMP_SELECT_OPTIONS: GoalSelectOption<HardLampGoalValue>[] = HARD_LAMP_OPTIONS.map(
  (lamp) => ({ value: lamp.value, label: lamp.label })
)

const COMBO_LAMP_SELECT_OPTIONS: GoalSelectOption<ComboLampGoalValue>[] = COMBO_LAMP_OPTIONS.map(
  (lamp) => ({ value: lamp.value, label: lamp.label })
)

const FULL_CHAIN_SELECT_OPTIONS: GoalSelectOption<FullChainGoalValue>[] = FULL_CHAIN_OPTIONS.map(
  (lamp) => ({ value: lamp.value, label: lamp.label })
)

const MAX_OVERPOWER_PERCENT = 100
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
 * 目標フォームの達成条件セクションを描画する。
 *
 * @param props - 達成条件の選択値、表示用補助値、変更ハンドラ。
 * @returns 達成条件セクションの JSX 要素。
 */
export const GoalAchievementSection: Component<GoalAchievementSectionProps> = (props) => (
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
          value={props.achievementType}
          options={props.achievementTypeOptions}
          onChange={props.onAchievementTypeChange}
        />
        <p class="text-xs text-text-muted">{props.achievementDescription}</p>
      </div>

      <Show when={props.achievementType === 'score_count' || props.achievementType === 'avg_score'}>
        <GoalNumberField
          label="スコア目標"
          value={props.score}
          min={SCORE_MIN}
          max={MAX_SCORE}
          onChange={props.onScoreChange}
        />
      </Show>

      <Show when={props.achievementType === 'rank_count'}>
        <GoalSelectField
          label="ランク目標"
          value={props.rank}
          options={RANK_OPTIONS}
          onChange={props.onRankChange}
        />
      </Show>

      <Show when={props.achievementType === 'rating_count'}>
        <GoalNumberField
          label={RATING_GOAL_FIELD_LABEL}
          value={props.rating}
          min={RATING_GOAL_MIN_VALUE}
          step={10 ** -RATING_GOAL_DECIMAL_PLACES}
          onChange={props.onRatingChange}
        />
      </Show>

      <Show when={props.achievementType === 'hardlamp_count'}>
        <GoalSelectField
          label="ハードランプ"
          value={props.hardLamp}
          options={HARD_LAMP_SELECT_OPTIONS}
          onChange={props.onHardLampChange}
        />
      </Show>

      <Show when={props.achievementType === 'combolamp_count'}>
        <GoalSelectField
          label="コンボランプ"
          value={props.comboLamp}
          options={COMBO_LAMP_SELECT_OPTIONS}
          onChange={props.onComboLampChange}
        />
      </Show>

      <Show when={props.achievementType === 'fullchain_count'}>
        <GoalSelectField
          label="FULL CHAIN"
          value={props.fullChain}
          options={FULL_CHAIN_SELECT_OPTIONS}
          onChange={props.onFullChainChange}
        />
      </Show>

      <Show
        when={
          props.achievementType === 'score_count' ||
          props.achievementType === 'rank_count' ||
          props.achievementType === 'rating_count' ||
          props.achievementType === 'hardlamp_count' ||
          props.achievementType === 'combolamp_count' ||
          props.achievementType === 'fullchain_count' ||
          props.achievementType === 'rainbow_count'
        }
      >
        <div class="block text-sm">
          <div class="space-y-3">
            <GoalTargetModeRadioGroup
              label={props.achievementType === 'rainbow_count' ? '目標楽曲数' : '目標譜面数'}
              name="goal-count-mode"
              value={props.countMode}
              options={
                props.achievementType === 'rainbow_count'
                  ? RAINBOW_COUNT_MODE_OPTIONS
                  : COUNT_MODE_OPTIONS
              }
              onChange={props.onCountModeChange}
              renderOptionContent={(option) =>
                option.value === props.countMode ? (
                  option.value === 'all' ? (
                    <p class="-mt-3 text-xs leading-none text-text-muted">
                      {props.targetCountText}
                    </p>
                  ) : (
                    <GoalNumberField
                      label=""
                      min={option.value === 'number' ? 1 : 0}
                      max={option.value === 'percent' ? MAX_OVERPOWER_PERCENT : props.countMax}
                      value={props.count}
                      description={props.countLimitText}
                      onChange={props.onCountChange}
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
          props.achievementType === 'total_score' ||
          props.achievementType === 'overpower_value' ||
          props.achievementType === 'overpower_percent'
        }
      >
        <div class="block text-sm">
          <div class="space-y-2">
            <Show
              when={props.canUseDynamicTotalTarget(props.achievementType)}
              fallback={
                <GoalNumberField
                  label="目標値"
                  value={props.total}
                  description={props.totalLimitText}
                  min={0}
                  max={props.totalFieldMax}
                  step={10 ** -OVERPOWER_TARGET_DECIMAL_PLACES}
                  unit={getGoalValueUnit(props.achievementType)}
                  onChange={props.onTotalChange}
                />
              }
            >
              <div class="space-y-3">
                <GoalTargetModeRadioGroup
                  label="目標値"
                  name="goal-total-mode"
                  value={props.totalMode}
                  options={TOTAL_MODE_OPTIONS}
                  onChange={props.onTotalModeChange}
                  renderOptionContent={(option) =>
                    option.value === props.totalMode ? (
                      option.value === 'all' ? (
                        <p class="-mt-3 text-xs leading-none text-text-muted">
                          {props.theoreticalTotalText}
                        </p>
                      ) : (
                        <GoalNumberField
                          label=""
                          value={props.total}
                          description={props.totalLimitText}
                          min={0}
                          max={props.totalFieldMax}
                          onChange={props.onTotalChange}
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

      <div class="block space-y-2 text-sm">
        <p class="mb-1 block text-text-muted">表示形式</p>
        <Show when={props.achievementType !== 'avg_score'}>
          <CheckboxField
            class="relative flex items-center gap-2 text-sm text-text-muted"
            checked={props.invertValue}
            onChange={props.onInvertValueChange}
            label={LABEL_INVERT_VALUE}
          />
          <CheckboxField
            class="relative flex items-center gap-2 text-sm text-text-muted"
            checked={props.invertPercentage}
            onChange={props.onInvertPercentageChange}
            label={LABEL_INVERT_PERCENTAGE}
          />
        </Show>
        <div ref={props.gaugeStartFieldRef}>
          <GoalTargetModeRadioGroup
            label={GOAL_GAUGE_START_LABEL}
            name="goal-gauge-start-mode"
            value={props.gaugeStartMode}
            options={GAUGE_START_MODE_OPTIONS}
            // 選択中の項目まで無効にすると Tab で欄に入れず選び直せないため、使えない状態はエラーで示す。
            isOptionDisabled={(option) =>
              option.value === 'current' &&
              !props.canUseCurrentGaugeStart &&
              props.gaugeStartMode !== 'current'
            }
            errorMessage={props.gaugeStartGroupErrorMessage}
            onChange={props.onGaugeStartModeChange}
            renderOptionContent={(option) =>
              option.value !== props.gaugeStartMode ? null : option.value === 'current' ? (
                <p class="-mt-3 text-xs leading-none text-text-muted">
                  {props.currentGaugeStartText}
                </p>
              ) : option.value === 'custom' ? (
                <GoalNumberField
                  label=""
                  ariaLabel={GOAL_GAUGE_START_LABEL}
                  value={props.gaugeStart}
                  min={0}
                  step={10 ** -getGoalGaugeStartDecimalPlaces(props.achievementType)}
                  unit={getGoalValueUnit(props.achievementType)}
                  errorMessage={props.gaugeStartErrorMessage}
                  inputRef={props.gaugeStartInputRef}
                  onChange={props.onGaugeStartChange}
                />
              ) : null
            }
          />
        </div>
        <Show
          when={
            props.gaugeStartMode !== 'zero' && canApplyGaugeStartToPercentage(props.achievementType)
          }
        >
          {/* スタート位置が未入力・0の間は達成率が変わらないため、選択状態を残したまま操作だけ止める。 */}
          <CheckboxField
            class="relative flex items-center gap-2 text-sm text-text-muted"
            checked={props.applyGaugeStartToPercentage}
            disabled={!props.hasGaugeStart}
            onChange={props.onApplyGaugeStartToPercentageChange}
            label={LABEL_APPLY_GAUGE_START_TO_PERCENTAGE}
          />
        </Show>
      </div>
    </div>
  </section>
)
