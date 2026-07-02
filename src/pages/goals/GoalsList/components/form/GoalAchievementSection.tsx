import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { SCORE_MIN } from '../../../../../constants/chart'
import type { GoalAchievementType } from '../../../../../types/api'
import { MAX_SCORE, SCORE_RANK_MIN_SCORES, SCORE_RANKS_ASC } from '../../../../../utils/scoreRank'
import type { GoalTargetMode } from '../../../utils/goalCountTarget'
import {
  COMBO_LAMP_OPTIONS,
  type ComboLampGoalValue,
  HARD_LAMP_OPTIONS,
  type HardLampGoalValue,
} from '../../../utils/goalLamp'
import { LABEL_INVERT_DISPLAY, STEP3_DESCRIPTION } from './constants'
import {
  GOAL_FILTER_CHECKBOX_CONTROL_CLASS,
  GoalNumberField,
  GoalSelectField,
  type GoalSelectOption,
  GoalTargetModeRadioGroup,
} from './goalFormFields'
import { type RankGoalValue, THEORETICAL_RANK_GOAL } from './goalFormModel'
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
  rank: RankGoalValue
  count: string
  countMode: GoalTargetMode
  total: string
  totalMode: GoalTargetMode
  hardLamp: HardLampGoalValue
  comboLamp: ComboLampGoalValue
  invert: boolean
  countMax: number
  countLimitText: string
  targetCountText: string
  theoreticalTotalText: string
  totalLimitText: string
  totalFieldMax?: number
  onAchievementTypeChange: (type: GoalAchievementType) => void
  onScoreChange: (score: string) => void
  onRankChange: (rank: RankGoalValue) => void
  onCountChange: (count: string) => void
  onCountModeChange: (mode: GoalTargetMode) => void
  onTotalChange: (total: string) => void
  onTotalModeChange: (mode: GoalTargetMode) => void
  onHardLampChange: (lamp: HardLampGoalValue) => void
  onComboLampChange: (lamp: ComboLampGoalValue) => void
  onInvertChange: (invert: boolean) => void
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

const HARD_LAMP_SELECT_OPTIONS: GoalSelectOption<HardLampGoalValue>[] = HARD_LAMP_OPTIONS.map(
  (lamp) => ({ value: lamp.value, label: lamp.label })
)

const COMBO_LAMP_SELECT_OPTIONS: GoalSelectOption<ComboLampGoalValue>[] = COMBO_LAMP_OPTIONS.map(
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

      <Show
        when={
          props.achievementType === 'score_count' ||
          props.achievementType === 'rank_count' ||
          props.achievementType === 'hardlamp_count' ||
          props.achievementType === 'combolamp_count' ||
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

      <div class="block text-sm">
        <p class="mb-1 block text-text-muted">表示形式</p>
        <Checkbox
          class="relative flex items-center gap-2 text-sm text-text-muted"
          checked={props.invert}
          onChange={props.onInvertChange}
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
    </div>
  </section>
)
