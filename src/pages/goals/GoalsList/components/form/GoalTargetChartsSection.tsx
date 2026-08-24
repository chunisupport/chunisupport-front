import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { AppButton } from '../../../../../components/common/AppButton'
import type { AppMultiSelectOption } from '../../../../../components/common/AppMultiSelect'
import {
  GenreMultiSelect,
  VersionMultiSelect,
} from '../../../../../components/common/DomainMultiSelect'
import {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
  TextRangeInput,
} from '../../../../../components/common/RangeInput'
import { THEORETICAL_OVER_POWER_TARGET_LABEL } from '../../../../../constants/chart'
import type { MasterDataDTO } from '../../../../../types/api'
import { normalizeChartConstRangeInput } from '../../../../../utils/rangeInput'
import { GOAL_FIELD_INPUT_CLASS, GoalFilterCheckbox } from './goalFormFields'
import type { GoalChartTargetMode } from './goalFormModel'
import {
  GOAL_MULTI_SELECT_CONTENT_Z_INDEX_CLASS,
  GOAL_STEP_BADGE_CLASS,
  GOAL_STEP_DESCRIPTION_CLASS,
  GOAL_STEP_SECTION_CLASS,
  GOAL_STEP_TITLE_CLASS,
} from './goalFormStyles'

interface GoalTargetChartsSectionProps {
  difficultyItems: MasterDataDTO['difficulties']
  /** 虹枠目標向けに楽曲単位の対象条件だけを表示するか */
  isRainbowGoal: boolean
  chartTargetMode: GoalChartTargetMode
  diffs: string[]
  constMin: string
  constMax: string
  genreOptions: AppMultiSelectOption<string>[]
  selectedGenres: string[]
  versionOptions: AppMultiSelectOption<string>[]
  selectedVersions: string[]
  targetCountText: string
  onClearDifficulty: () => void
  onToggleOpTarget: (checked: boolean) => void
  onToggleDifficulty: (id: number, checked: boolean) => void
  onGenresChange: (genres: string[]) => void
  onVersionsChange: (versions: string[]) => void
  onConstMinChange: (value: string) => void
  onConstMaxChange: (value: string) => void
}

const TARGET_CHART_COUNT_LABEL = '対象数:'
const GOAL_CHART_CONST_RANGE_TITLE = '譜面定数'

/**
 * 目標フォームの対象譜面セクションを描画する。
 *
 * @param props - 対象譜面条件の表示値、選択値、変更ハンドラ。
 * @returns 対象譜面セクションの JSX 要素。
 */
export const GoalTargetChartsSection: Component<GoalTargetChartsSectionProps> = (props) => (
  <section class={GOAL_STEP_SECTION_CLASS}>
    <div class="mb-3 flex items-center gap-3">
      <span class={GOAL_STEP_BADGE_CLASS}>2</span>
      <div>
        <h2 class={GOAL_STEP_TITLE_CLASS}>{props.isRainbowGoal ? '対象楽曲' : '対象譜面'}</h2>
        <p class={GOAL_STEP_DESCRIPTION_CLASS}>
          {props.isRainbowGoal
            ? '進捗を計算する楽曲を絞り込みます。'
            : '進捗を計算する譜面を絞り込みます。'}
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <div class="mb-3 flex flex-wrap items-center justify-start gap-2 text-xs text-text-muted">
        {TARGET_CHART_COUNT_LABEL} {props.targetCountText}
      </div>
      <div class="grid grid-cols-1 gap-3">
        <Show when={!props.isRainbowGoal}>
          <fieldset class="block text-sm space-y-1">
            <div class="flex items-center justify-between">
              <span class="block text-text-muted">難易度</span>
              <AppButton
                variant="ghost"
                size="xs"
                class="text-action-primary hover:text-action-primary"
                onClick={props.onClearDifficulty}
              >
                クリア
              </AppButton>
            </div>
            <div class="space-y-1 bg-surface rounded border border-border-strong px-3 py-2">
              <GoalFilterCheckbox
                label={THEORETICAL_OVER_POWER_TARGET_LABEL}
                checked={props.chartTargetMode === 'op_target'}
                onChange={props.onToggleOpTarget}
              />
              <For each={props.difficultyItems}>
                {(item) => (
                  <GoalFilterCheckbox
                    label={item.name}
                    checked={
                      props.chartTargetMode === 'normal' && props.diffs.includes(String(item.id))
                    }
                    disabled={props.chartTargetMode === 'op_target'}
                    onChange={(checked) => props.onToggleDifficulty(item.id, checked)}
                  />
                )}
              </For>
            </div>
          </fieldset>
        </Show>

        <fieldset class="block space-y-1 text-sm">
          <GenreMultiSelect
            options={props.genreOptions}
            selected={props.selectedGenres}
            contentZIndexClass={GOAL_MULTI_SELECT_CONTENT_Z_INDEX_CLASS}
            onChange={props.onGenresChange}
          />
        </fieldset>

        <Show
          when={props.versionOptions.length > 0}
          fallback={
            <div class="space-y-1 text-sm">
              <span class="block text-text-muted">バージョン</span>
              <p class="text-sm text-text-subtle">バージョンを取得できませんでした。</p>
            </div>
          }
        >
          <fieldset class="block space-y-1 text-sm">
            <VersionMultiSelect
              options={props.versionOptions}
              selected={props.selectedVersions}
              contentZIndexClass={GOAL_MULTI_SELECT_CONTENT_Z_INDEX_CLASS}
              onChange={props.onVersionsChange}
            />
          </fieldset>
        </Show>

        <Show when={!props.isRainbowGoal}>
          <TextRangeInput
            title={GOAL_CHART_CONST_RANGE_TITLE}
            titleClass="mb-1 text-sm text-text-muted"
            inputClass={GOAL_FIELD_INPUT_CLASS}
            start={{
              id: 'goal-chart-const-min',
              label: `${GOAL_CHART_CONST_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
              value: props.constMin,
              inputMode: 'decimal',
              pattern: '[0-9]*[.]?[0-9]*',
              normalizeInput: normalizeChartConstRangeInput,
              onChange: props.onConstMinChange,
            }}
            end={{
              id: 'goal-chart-const-max',
              label: `${GOAL_CHART_CONST_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
              value: props.constMax,
              inputMode: 'decimal',
              pattern: '[0-9]*[.]?[0-9]*',
              normalizeInput: normalizeChartConstRangeInput,
              onChange: props.onConstMaxChange,
            }}
          />
        </Show>
      </div>
    </div>
  </section>
)
