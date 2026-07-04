import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
  SelectRangeInput,
  TextRangeInput,
} from '../../../../components/common/RangeInput'
import { normalizeScoreRangeInput } from '../../../../utils/rangeInput'

import { SCORE_RANKS } from '../../utils/scoreRank'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from './styles'

/** スコア範囲セクションの見出し。 */
const SCORE_RANGE_TITLE = 'スコア'

/** スコアランク範囲セクションの見出し。 */
const SCORE_RANK_RANGE_TITLE = 'スコアランク'

type ScoreSectionProps = {
  scoreFilterMode: 'number' | 'rank'
  scoreMinInput: string
  scoreMaxInput: string
  scoreRankMin: string
  scoreRankMax: string
  excludeNoPlay: boolean
  onScoreFilterModeChange: (mode: 'number' | 'rank') => void
  onScoreMinInput: (value: string) => void
  onScoreMaxInput: (value: string) => void
  onScoreMinCommit: (value: string) => void
  onScoreMaxCommit: (value: string) => void
  onScoreRankChange: (type: 'min' | 'max', value: string) => void
  onExcludeNoPlayChange: (value: boolean) => void
}

/**
 * スコア条件の入力欄とランク選択欄を表示する。
 *
 * @param props - スコア条件、表示モード、未プレイ除外状態、各変更ハンドラ。
 * @returns スコアフィルターセクションの JSX 要素。
 */
const ScoreSection: Component<ScoreSectionProps> = (props) => (
  <div>
    {props.scoreFilterMode === 'number' ? (
      <TextRangeInput
        title={SCORE_RANGE_TITLE}
        inputClass={FILTER_DIALOG_FIELD_INPUT_CLASS}
        start={{
          id: 'filter-score-min',
          label: `${SCORE_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
          value: props.scoreMinInput,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          normalizeInput: normalizeScoreRangeInput,
          onInput: props.onScoreMinInput,
          onCommit: props.onScoreMinCommit,
        }}
        end={{
          id: 'filter-score-max',
          label: `${SCORE_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
          value: props.scoreMaxInput,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          normalizeInput: normalizeScoreRangeInput,
          onInput: props.onScoreMaxInput,
          onCommit: props.onScoreMaxCommit,
        }}
      />
    ) : (
      <SelectRangeInput
        title={SCORE_RANK_RANGE_TITLE}
        options={SCORE_RANKS}
        placeholder="選択…"
        start={{
          value: props.scoreRankMin,
          label: `${SCORE_RANK_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
          onChange: (value) => props.onScoreRankChange('min', value),
        }}
        end={{
          value: props.scoreRankMax,
          label: `${SCORE_RANK_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
          onChange: (value) => props.onScoreRankChange('max', value),
        }}
      />
    )}
    <div class="mt-2">
      <Checkbox
        checked={props.scoreFilterMode === 'number'}
        onChange={(checked) => props.onScoreFilterModeChange(checked ? 'number' : 'rank')}
        class="flex items-center gap-2"
      >
        <Checkbox.Input id="filter-score-mode" />
        <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="leading-5" for="filter-score-mode">
          数値で指定する
        </Checkbox.Label>
      </Checkbox>
    </div>
    <div class="mt-2">
      <Checkbox
        checked={props.excludeNoPlay}
        onChange={(checked) => props.onExcludeNoPlayChange(checked)}
        class="flex items-center gap-2"
      >
        <Checkbox.Input id="filter-exclude-noplay" />
        <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="leading-5" for="filter-exclude-noplay">
          未プレイ譜面を除外する
        </Checkbox.Label>
      </Checkbox>
    </div>
  </div>
)

export default ScoreSection
